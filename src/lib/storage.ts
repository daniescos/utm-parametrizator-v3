import type { AppConfig } from './types';
import { DEFAULT_CONFIG } from './types';

// This app has no admin panel and no backend: public/config.json is the
// single source of truth for UTM rules, edited directly in the repo (see
// MANUAL.md) and deployed via GitHub Pages. Cache-busted so a fresh deploy
// is picked up immediately instead of a stale browser cache.
export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) return DEFAULT_CONFIG;
    const raw = (await response.json()) as AppConfig;
    return {
      ...raw,
      fields: raw.fields.map(field => ({ ...field, fieldType: field.fieldType || 'dropdown' })),
    };
  } catch {
    console.error('Failed to load config.json');
    return DEFAULT_CONFIG;
  }
}
