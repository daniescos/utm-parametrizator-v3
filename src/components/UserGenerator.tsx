import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Info, AlertTriangle, ShieldAlert, Link2 } from 'lucide-react';
import { loadConfig } from '../lib/storage';
import {
  generateUTMUrl,
  getAvailableOptionsForField,
  copyToClipboard,
  getApplicableDependencyRules,
  validateStringAgainstRules,
  getActiveRules,
  computeFieldStates,
  validateStaticPattern,
  sanitizeUtmText,
  evaluateSourceCondition,
} from '../lib/utils';
import { translations } from '../lib/translations';
import type { AppConfig, UTMField, UTMFieldState } from '../lib/types';
import { DEFAULT_CONFIG } from '../lib/types';
import { Tooltip } from './Tooltip';
import { RuleIndicator } from './RuleIndicator';
import { ThemeToggle } from './ThemeToggle';

interface FieldGroup {
  title: string | null;
  fields: UTMField[];
}

export function UserGenerator() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationTimeouts, setValidationTimeouts] = useState<Record<string, ReturnType<typeof setTimeout>>>({});
  const [fieldStates, setFieldStates] = useState<Record<string, UTMFieldState>>({});

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [validationTimeouts]);

  // Compute field states based on active rules
  const newFieldStates = useMemo(() => {
    return computeFieldStates(selectedValues, config);
  }, [selectedValues, config]);

  // Handle field state changes (side effects)
  useEffect(() => {
    const oldStates = fieldStates;
    const newStates = newFieldStates;

    for (const fieldId in newStates) {
      const oldState = oldStates[fieldId];
      const newState = newStates[fieldId];

      // Clear value if field becomes hidden
      if (oldState?.isVisible && !newState.isVisible) {
        setSelectedValues(prev => ({ ...prev, [fieldId]: '' }));
      }

      // Handle field type transformation
      if (oldState?.currentFieldType !== newState.currentFieldType) {
        const activeRules = getActiveRules(selectedValues, config);
        const transformRule = activeRules.get(fieldId)?.find(r => r.ruleType === 'transform');

        if (transformRule?.transformTo?.clearValueOnTransform) {
          setSelectedValues(prev => ({ ...prev, [fieldId]: '' }));
        }
      }

      // Apply autofill if rule becomes active
      const newAutofillRule = newStates[fieldId]?.appliedRules
        .map(ruleId => config.dependencies.find(r => r.id === ruleId))
        .find(r => r?.ruleType === 'autofill');

      if (newAutofillRule && !selectedValues[fieldId]) {
        setSelectedValues(prev => ({
          ...prev,
          [fieldId]: newAutofillRule.autofillValue || ''
        }));
      }
    }

    setFieldStates(newStates);
  }, [newFieldStates]);

  const sortedFields = useMemo(() => {
    return [...config.fields].sort((a, b) => a.order - b.order);
  }, [config.fields]);

  // Group fields into cards by sectionTitle boundaries (each field carrying
  // a sectionTitle starts a new card — mirrors the numbered-card layout of
  // 01.plan_type_parametrizador).
  const fieldGroups = useMemo<FieldGroup[]>(() => {
    const groups: FieldGroup[] = [];
    for (const field of sortedFields) {
      if (field.sectionTitle || groups.length === 0) {
        groups.push({ title: field.sectionTitle ?? null, fields: [] });
      }
      groups[groups.length - 1].fields.push(field);
    }
    return groups;
  }, [sortedFields]);

  // Missing required + visible fields, for the aggregate validation alert
  const missingRequiredLabels = useMemo(() => {
    const missing: string[] = [];
    for (const field of config.fields) {
      const state = fieldStates[field.id];
      if (state?.isVisible && state?.isRequired && !selectedValues[field.id]) {
        missing.push(field.label);
      }
    }
    return missing;
  }, [config.fields, fieldStates, selectedValues]);

  const hasFieldErrors = useMemo(
    () => Object.values(fieldErrors).some(Boolean),
    [fieldErrors]
  );

  const canGenerate = missingRequiredLabels.length === 0 && !hasFieldErrors;

  // Non-blocking warning banners (e.g. PZN / Journey Builder notices)
  const activeWarnings = useMemo(() => {
    return config.dependencies.filter(
      rule => rule.ruleType === 'warning' && evaluateSourceCondition(rule, selectedValues[rule.sourceField])
    );
  }, [config.dependencies, selectedValues]);

  const generatedUrl = useMemo(() => {
    return generateUTMUrl(baseUrl, selectedValues, config);
  }, [baseUrl, selectedValues, config]);

  const handleCopy = async () => {
    if (generatedUrl && await copyToClipboard(generatedUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  const handleFieldChange = (fieldId: string, rawValue: string) => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field) return;

    // Fields with their own static pattern (e.g. utm_id accepting OS or
    // Affiliate ID) keep exactly what the user typed; other free-text fields
    // get live-sanitized (accents stripped, spaces -> underscore, safe charset)
    // the same way the v1 desktop tool did.
    const value = field.fieldType === 'string' && !field.pattern ? sanitizeUtmText(rawValue) : rawValue;

    setSelectedValues(prev => ({ ...prev, [fieldId]: value }));
    setFieldErrors(prev => ({ ...prev, [fieldId]: '' }));

    // Static, field-level pattern validation (independent of dependency rules)
    if (field.pattern && value) {
      const staticValidation = validateStaticPattern(value, field);
      if (!staticValidation.valid) {
        setFieldErrors(prev => ({ ...prev, [fieldId]: staticValidation.error || 'Valor inválido' }));
      }
    }

    // Validate string fields with rules in real-time
    if (field.fieldType === 'string' && value) {
      if (validationTimeouts[fieldId]) {
        clearTimeout(validationTimeouts[fieldId]);
      }

      const timeoutId = setTimeout(() => {
        const applicableRules = getApplicableDependencyRules(fieldId, { ...selectedValues, [fieldId]: value }, config);

        if (applicableRules.length > 0) {
          const validation = validateStringAgainstRules(value, applicableRules);
          if (!validation.valid) {
            setFieldErrors(prev => ({
              ...prev,
              [fieldId]: validation.error || 'Valor inválido',
            }));
          }
        }
      }, 300);

      setValidationTimeouts(prev => ({ ...prev, [fieldId]: timeoutId }));
    }
  };

  const renderField = (field: UTMField) => {
    const state = fieldStates[field.id];
    if (!state?.isVisible) return null;

    const availableOptions = getAvailableOptionsForField(field.id, selectedValues, config);
    const applicableRules = getApplicableDependencyRules(field.id, selectedValues, config);
    const hasActiveRules = applicableRules.length > 0;
    const effectiveFieldType = state.currentFieldType;
    const attnClass = fieldErrors[field.id] ? 'attn' : '';

    return (
      <div className="field" key={field.id}>
        <label htmlFor={field.id}>
          {field.label}
          {state.isRequired ? (
            <span className="badge req">obrigatório</span>
          ) : (
            <span className="badge opt">opcional</span>
          )}
          {state.hasConflict && (
            <Tooltip content="Múltiplas regras conflitantes detectadas">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--amber)' }} />
            </Tooltip>
          )}
          {field.description && (
            <Tooltip content={field.description}>
              <Info className="w-3.5 h-3.5" style={{ color: 'var(--muted)', cursor: 'help' }} />
            </Tooltip>
          )}
        </label>

        {effectiveFieldType === 'dropdown' && (
          <select
            id={field.id}
            value={selectedValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          >
            <option value="">{translations.generator.selectFieldPlaceholder(field.label)}</option>
            {availableOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}

        {effectiveFieldType === 'string' && (
          <input
            type="text"
            id={field.id}
            className={attnClass}
            value={selectedValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={translations.generator.enterFieldPlaceholder(field.label)}
          />
        )}

        {effectiveFieldType === 'integer' && (
          <input
            type="number"
            id={field.id}
            step="1"
            value={selectedValues[field.id] || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={translations.generator.enterFieldPlaceholder(field.label)}
          />
        )}

        {fieldErrors[field.id] && <p className="hint err">{fieldErrors[field.id]}</p>}
        {hasActiveRules && applicableRules.map(rule => {
          const sourceField = config.fields.find(f => f.id === rule.sourceField);
          return <RuleIndicator key={rule.id} rule={rule} sourceFieldLabel={sourceField?.label || ''} />;
        })}
      </div>
    );
  };

  return (
    <div className="wrap">
      <div className="header-row">
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div className="logo-badge">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <div className="eyebrow">UTM · Claro</div>
            <h1 className="title">{translations.generator.title}</h1>
            <p className="subtitle">{translations.generator.subtitle}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {activeWarnings.map(rule => (
        <div className="alert warning" key={rule.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <ShieldAlert className="w-4 h-4" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            {rule.warningTitle && <strong style={{ display: 'block', marginBottom: 2 }}>{rule.warningTitle}</strong>}
            <span style={{ whiteSpace: 'pre-line' }}>{rule.warningMessage}</span>
          </div>
        </div>
      ))}

      <div className="grid-2col">
        {/* Left column: URL base + numbered cards per section */}
        <div>
          <div className="card">
            <h2>Link</h2>
            <div className="field">
              <label htmlFor="base-url">{translations.generator.baseUrl}</label>
              <input
                type="url"
                id="base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={translations.generator.baseUrlPlaceholder}
              />
            </div>
          </div>

          {fieldGroups.map((group, idx) => (
            <div className="card" key={group.title ?? idx}>
              {group.title && <h2>{group.title}</h2>}
              {group.fields.map(renderField)}
            </div>
          ))}
        </div>

        {/* Right column: sticky output panel */}
        <div className="output-col">
          <div className="card">
            <h2>Link gerado</h2>

            {missingRequiredLabels.length > 0 && (
              <div className="alert error">
                Campos obrigatórios pendentes:
                <ul>
                  {missingRequiredLabels.map(label => <li key={label}>{label}</li>)}
                </ul>
              </div>
            )}

            <div className={`out-box ${!generatedUrl ? 'empty' : ''}`}>
              {generatedUrl || '— preencha os campos ao lado —'}
            </div>

            <button
              type="button"
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              disabled={!generatedUrl || !canGenerate}
              title={!canGenerate ? 'Preencha todos os campos obrigatórios' : ''}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? translations.generator.copiedMessage : translations.generator.copyButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
