import type { AppConfig } from './types';
import { DEFAULT_CONFIG } from './types';

const CONFIG_KEY = 'utm_generator_config';

// Migrate V1 rules: Add targetFieldType if missing
function migrateV1(config: AppConfig): AppConfig {
  return {
    ...config,
    dependencies: config.dependencies.map(rule => {
      // If targetFieldType doesn't exist, it's an old rule (dropdown → dropdown only)
      if (!rule.targetFieldType) {
        const targetField = config.fields.find(f => f.id === rule.targetField);
        const fieldType = targetField?.fieldType || 'dropdown';
        return {
          ...rule,
          targetFieldType: (fieldType === 'string' ? 'string' : 'dropdown') as 'dropdown' | 'string',
        };
      }
      return rule;
    }),
  };
}

// Migrate V2 rules: Add ruleType if missing
function migrateV2(config: AppConfig): AppConfig {
  return {
    ...config,
    version: 2,
    dependencies: config.dependencies.map((rule: any) => {
      // If ruleType exists, it's already migrated
      if (rule.ruleType) return rule;

      // Detect rule type based on existing structure
      let ruleType: string;
      if (rule.targetFieldType === 'string' && rule.stringConstraint) {
        ruleType = 'validation';
      } else if (rule.allowedValues) {
        ruleType = 'filter';
      } else {
        ruleType = 'filter'; // Default
      }

      return {
        ...rule,
        ruleType,
        sourceCondition: rule.sourceCondition || 'equals',
        priority: rule.priority !== undefined ? rule.priority : 50,
      };
    }),
  };
}

// Migrate dependency rules through all versions
function migrateDependencyRules(config: AppConfig): AppConfig {
  let migrated = config;

  // V1 migration: Add targetFieldType
  if (!config.version || config.version < 1) {
    migrated = migrateV1(migrated);
  }

  // V2 migration: Add ruleType
  if (!config.version || config.version < 2) {
    migrated = migrateV2(migrated);
  }

  return migrated;
}

// Load global config from public/config.json
async function loadGlobalConfig(): Promise<AppConfig | null> {
  try {
    // Add timestamp to bypass browser cache - ensures always fetches latest version
    const timestamp = Date.now();
    const response = await fetch(`/config.json?t=${timestamp}`, {
      cache: 'no-store' // Additional directive to prevent caching
    });
    if (response.ok) {
      const config = await response.json();
      // Ensure fields have all required properties
      if (config.fields) {
        config.fields = config.fields.map((field: any) => ({
          ...field,
          fieldType: field.fieldType || 'dropdown',
          description: field.description !== undefined ? field.description : undefined
        }));
      }
      return config;
    }
  } catch {
    console.error('Failed to load global config from public/config.json');
  }
  return null;
}

// Load config with priority: localStorage > global config > defaults
export function loadConfig(): AppConfig {
  try {
    // First, check localStorage
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      let parsed = JSON.parse(stored);
      // Migration: Add fieldType to fields without it
      if (parsed.fields) {
        parsed.fields = parsed.fields.map((field: any) => ({
          ...field,
          fieldType: field.fieldType || 'dropdown',
          description: field.description !== undefined ? field.description : undefined
        }));
      }
      // Migration: Add targetFieldType to dependency rules
      parsed = migrateDependencyRules(parsed);
      return parsed;
    }
    return DEFAULT_CONFIG;
  } catch {
    console.error('Failed to load config from storage');
    return DEFAULT_CONFIG;
  }
}

// Get the stored config version
export function getStoredConfigVersion(): number {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.version || 0;
    }
  } catch {
    return 0;
  }
  return 0;
}

// Async version: Load from global config, using localStorage only if version matches
export async function loadConfigAsync(): Promise<AppConfig> {
  // Try to load global config first
  let globalConfig = await loadGlobalConfig();
  if (globalConfig) {
    // Migration: Add targetFieldType to dependency rules
    globalConfig = migrateDependencyRules(globalConfig);

    // Check localStorage version vs global version
    const storedVersion = getStoredConfigVersion();

    // If versions match, user can have custom changes in localStorage
    if (storedVersion === globalConfig.version) {
      const stored = localStorage.getItem(CONFIG_KEY);
      if (stored) {
        try {
          let parsedConfig = JSON.parse(stored);
          parsedConfig = migrateDependencyRules(parsedConfig);
          return parsedConfig;
        } catch {
          return globalConfig;
        }
      }
    } else {
      // Version mismatch - admin updated config, use global and update localStorage
      saveConfig(globalConfig);
    }
    return globalConfig;
  }
  // Fallback to synchronous load
  return loadConfig();
}

export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    console.error('Failed to save config to storage');
  }
}

export function exportConfig(): string {
  const config = loadConfig();
  return JSON.stringify(config, null, 2);
}

export function importConfig(jsonString: string): AppConfig {
  try {
    let parsed = JSON.parse(jsonString);
    // Validate basic structure
    if (!parsed.fields || !Array.isArray(parsed.fields)) {
      throw new Error('Invalid config format: missing fields array');
    }
    if (!parsed.dependencies || !Array.isArray(parsed.dependencies)) {
      throw new Error('Invalid config format: missing dependencies array');
    }

    // Migration: Add fieldType to fields without it
    parsed.fields = parsed.fields.map((field: any) => ({
      ...field,
      fieldType: field.fieldType || 'dropdown'
    }));

    // Migration: Add targetFieldType to dependency rules
    parsed = migrateDependencyRules(parsed);

    return parsed;
  } catch (error) {
    throw new Error(`Failed to parse config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function resetConfig(): void {
  saveConfig(DEFAULT_CONFIG);
}

// Save configuration to server (persists to config.json) — requires a valid
// admin session token obtained from adminLogin().
export async function saveConfigToServer(config: AppConfig, adminToken: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/config/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Failed to save configuration' };
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error saving config to server:', error);
    return { success: false, error: 'Failed to save configuration to server' };
  }
}

// Exchange the admin password for a short-lived session token (validated
// server-side against ADMIN_PASSWORD_HASH — never compared in the browser).
export async function adminLogin(password: string): Promise<{ token?: string; error?: string }> {
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || 'Senha inválida' };
    }
    return { token: data.token };
  } catch {
    return { error: 'Falha ao conectar ao servidor' };
  }
}

export async function adminLogout(token: string): Promise<void> {
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
  } catch {
    // best-effort — session also expires on its own after SESSION_TTL_MS
  }
}
