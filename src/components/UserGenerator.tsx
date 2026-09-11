import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Info, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
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
import type { AppConfig, UTMFieldState } from '../lib/types';
import { DEFAULT_CONFIG } from '../lib/types';
import { Tooltip } from './Tooltip';
import { RuleIndicator } from './RuleIndicator';

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

  // Check if URL can be generated (validation)
  const canGenerate = useMemo(() => {
    // Check all required, currently-visible fields are filled
    for (const field of config.fields) {
      const state = fieldStates[field.id];
      if (state?.isVisible && state?.isRequired && !selectedValues[field.id]) {
        return false;
      }
    }

    // Cross-validation rules (deprecated - commented out for backwards compatibility)
    // const activeRules = getActiveRules(selectedValues, config);
    // for (const [, rules] of activeRules) {
    //   for (const rule of rules) {
    //     if (rule.ruleType === 'cross_validation') {
    //       const validation = validateCrossField(rule, selectedValues);
    //       if (!validation.valid) {
    //         return false;
    //       }
    //     }
    //   }
    // }

    // Check all string validations pass
    for (const fieldId in fieldErrors) {
      if (fieldErrors[fieldId]) {
        return false;
      }
    }

    return true;
  }, [config, fieldStates, selectedValues, fieldErrors]);

  const sortedFields = useMemo(() => {
    return [...config.fields].sort((a, b) => a.order - b.order);
  }, [config.fields]);

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
      setTimeout(() => setCopied(false), 2000);
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

    // Update value immediately
    setSelectedValues(prev => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear previous error
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
      // Cancel previous timeout if it exists
      if (validationTimeouts[fieldId]) {
        clearTimeout(validationTimeouts[fieldId]);
      }

      // Create new timeout to validate after 300ms of inactivity
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-red-900/50 shadow-2xl">
          {/* Header */}
          <div className="border-b border-red-900/50 p-6">
            <h1 className="text-3xl font-bold text-white">{translations.generator.title}</h1>
            <p className="text-gray-400 mt-2">{translations.generator.subtitle}</p>
          </div>

          {/* Main Content */}
          <div className="p-6 space-y-6">
            {/* Warning Banners (e.g. PZN / Journey Builder) */}
            {activeWarnings.map(rule => (
              <div
                key={rule.id}
                className="flex gap-3 items-start bg-amber-950/40 border border-amber-700/50 rounded-lg p-4"
              >
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  {rule.warningTitle && (
                    <p className="text-amber-300 font-semibold text-sm">{rule.warningTitle}</p>
                  )}
                  <p className="text-amber-200/90 text-sm whitespace-pre-line">{rule.warningMessage}</p>
                </div>
              </div>
            ))}

            {/* Base URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.generator.baseUrl}
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={translations.generator.baseUrlPlaceholder}
                className="w-full px-4 py-3 bg-gray-900 border border-red-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-500/50 transition-all duration-300"
              />
            </div>

            {/* UTM Fields */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                {translations.generator.utmParameters}
              </label>
              <div className="space-y-3">
                {sortedFields.map(field => {
                  const state = fieldStates[field.id];

                  // Skip hidden fields entirely
                  if (!state?.isVisible) {
                    return null;
                  }

                  const availableOptions = getAvailableOptionsForField(
                    field.id,
                    selectedValues,
                    config
                  );
                  const applicableRules = getApplicableDependencyRules(
                    field.id,
                    selectedValues,
                    config
                  );
                  const hasActiveRules = applicableRules.length > 0;
                  const effectiveFieldType = state.currentFieldType;

                  return (
                    <div key={field.id}>
                      {field.sectionTitle && (
                        <p className="text-xs font-bold uppercase tracking-widest text-red-500/80 mt-5 mb-2 first:mt-0">
                          {field.sectionTitle}
                        </p>
                      )}
                      <label htmlFor={field.id} className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                        {field.label}
                        {state?.isRequired && <span className="text-red-500">*</span>}
                        {state?.hasConflict && (
                          <Tooltip content="Múltiplas regras conflitantes detectadas">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          </Tooltip>
                        )}
                        {field.description && (
                          <Tooltip content={field.description}>
                            <Info className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors cursor-help" />
                          </Tooltip>
                        )}
                      </label>

                      {effectiveFieldType === 'dropdown' && (
                        <>
                          <select
                            id={field.id}
                            value={selectedValues[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className={`w-full px-4 py-2 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                              hasActiveRules
                                ? 'border-yellow-500/50 focus:border-yellow-600 focus:ring-yellow-500/50'
                                : 'border-red-900/50 focus:border-red-600 focus:ring-red-500/50'
                            }`}
                          >
                            <option value="">{translations.generator.selectFieldPlaceholder(field.label)}</option>
                            {availableOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          {hasActiveRules && applicableRules.map(rule => {
                            const sourceField = config.fields.find(f => f.id === rule.sourceField);
                            return (
                              <RuleIndicator
                                key={rule.id}
                                rule={rule}
                                sourceFieldLabel={sourceField?.label || ''}
                              />
                            );
                          })}
                        </>
                      )}

                      {effectiveFieldType === 'string' && (
                        <>
                          <input
                            type="text"
                            id={field.id}
                            value={selectedValues[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={translations.generator.enterFieldPlaceholder(field.label)}
                            className={`w-full px-4 py-2 bg-gray-900 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                              fieldErrors[field.id]
                                ? 'border-red-500/50 focus:border-red-600 focus:ring-red-500/50'
                                : hasActiveRules
                                ? 'border-yellow-500/50 focus:border-yellow-600 focus:ring-yellow-500/50'
                                : 'border-red-900/50 focus:border-red-600 focus:ring-red-500/50'
                            }`}
                          />
                          {fieldErrors[field.id] && (
                            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {fieldErrors[field.id]}
                            </p>
                          )}
                          {hasActiveRules && !fieldErrors[field.id] && applicableRules.map(rule => {
                            const sourceField = config.fields.find(f => f.id === rule.sourceField);
                            return (
                              <RuleIndicator
                                key={rule.id}
                                rule={rule}
                                sourceFieldLabel={sourceField?.label || ''}
                              />
                            );
                          })}
                        </>
                      )}

                      {effectiveFieldType === 'integer' && (
                        <input
                          type="number"
                          id={field.id}
                          value={selectedValues[field.id] || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          placeholder={translations.generator.enterFieldPlaceholder(field.label)}
                          step="1"
                          className="w-full px-4 py-2 bg-gray-900 border border-red-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-500/50 transition-all duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generated URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {translations.generator.generatedUrl}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-900 border border-red-900/50 rounded-lg text-white font-mono text-sm focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  disabled={!generatedUrl || !canGenerate}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  title={!canGenerate ? 'Preencha todos os campos obrigatórios' : ''}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && (
                <p className="text-green-400 text-sm mt-2">{translations.generator.copiedMessage}</p>
              )}
              {!canGenerate && generatedUrl && (
                <p className="text-orange-400 text-xs mt-2">Resolva as validações de regras antes de copiar</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
