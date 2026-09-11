import { useState } from 'react';
import type { AppConfig, DependencyRule, RuleType, UTMField } from '../lib/types';
import { generateId } from '../lib/utils';
import { translations } from '../lib/translations';

interface DependencyFormProps {
  config: AppConfig;
  onAddRule: (rule: DependencyRule) => void;
  onError: (error: string) => void;
  sortedFields: UTMField[];
}

export function DependencyForm({ config, onAddRule, onError, sortedFields }: DependencyFormProps) {
  const [ruleType, setRuleType] = useState<RuleType>('filter');
  const [sourceField, setSourceField] = useState('');
  const [sourceValue, setSourceValue] = useState('');
  const [targetField, setTargetField] = useState('');
  const [filterAllowedValues, setFilterAllowedValues] = useState<string[]>([]);
  const [transformFieldType, setTransformFieldType] = useState<'dropdown' | 'string' | 'integer'>('string');
  const [visibilityAction, setVisibilityAction] = useState<'show' | 'hide'>('hide');
  const [requiredAction, setRequiredAction] = useState<'make_required' | 'make_optional'>('make_required');
  const [autofillValue, setAutofillValue] = useState('');
  const [autofillAllowOverride, setAutofillAllowOverride] = useState(true);
  const [warningTitle, setWarningTitle] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [explanation, setExplanation] = useState('');

  const resetForm = () => {
    setRuleType('filter');
    setSourceField('');
    setSourceValue('');
    setTargetField('');
    setFilterAllowedValues([]);
    setTransformFieldType('string');
    setVisibilityAction('hide');
    setRequiredAction('make_required');
    setAutofillValue('');
    setAutofillAllowOverride(true);
    setWarningTitle('');
    setWarningMessage('');
    setExplanation('');
  };

  const handleSubmit = () => {
    if (!sourceField || !sourceValue || !targetField) {
      onError(translations.admin.allDependencyFieldsRequired);
      return;
    }

    if (ruleType === 'filter' && filterAllowedValues.length === 0) {
      onError('Selecione pelo menos uma opção permitida para a regra de filtro');
      return;
    }

    if (ruleType === 'warning' && !warningMessage.trim()) {
      onError('Informe a mensagem do aviso');
      return;
    }

    const rule: DependencyRule = {
      id: generateId(),
      ruleType,
      sourceField,
      sourceValue,
      sourceCondition: 'equals',
      targetField,
      targetFieldType: (config.fields.find(f => f.id === targetField)?.fieldType as 'dropdown' | 'string' | 'integer'),
      explanation: explanation || undefined,
    };

    // Type-specific properties
    switch (ruleType) {
      case 'filter':
        rule.allowedValues = filterAllowedValues;
        break;

      case 'transform':
        rule.transformTo = {
          fieldType: transformFieldType,
          clearValueOnTransform: true,
        };
        break;

      case 'visibility':
        rule.visibilityAction = visibilityAction;
        break;

      case 'required':
        rule.requiredAction = requiredAction;
        break;

      case 'autofill':
        rule.autofillValue = autofillValue;
        rule.autofillAllowOverride = autofillAllowOverride;
        break;

      case 'warning':
        rule.warningTitle = warningTitle || undefined;
        rule.warningMessage = warningMessage;
        break;
    }

    onAddRule(rule);
    resetForm();
  };


  return (
    <div className="border border-red-900/50 rounded-lg p-4 space-y-4">
      {/* Source Field */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Se campo
        </label>
        <select
          value={sourceField}
          onChange={(e) => {
            setSourceField(e.target.value);
            setSourceValue('');
          }}
          className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
        >
          <option value="">{translations.admin.selectSourceField}</option>
          {sortedFields.filter(f => f.fieldType === 'dropdown').map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Source Value */}
      {sourceField && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            igual a
          </label>
          <select
            value={sourceValue}
            onChange={(e) => setSourceValue(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
          >
            <option value="">{translations.admin.selectValue}</option>
            {config.fields.find(f => f.id === sourceField)?.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      {/* Rule Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          qual tipo de regra
        </label>
        <select
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as RuleType)}
          className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
        >
          <option value="filter">{translations.admin.ruleTypes.filter}</option>
          <option value="transform">{translations.admin.ruleTypes.transform}</option>
          <option value="visibility">{translations.admin.ruleTypes.visibility}</option>
          <option value="required">{translations.admin.ruleTypes.required}</option>
          <option value="autofill">{translations.admin.ruleTypes.autofill}</option>
          <option value="warning">{translations.admin.ruleTypes.warning}</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {translations.admin.ruleTypeDescriptions[ruleType]}
        </p>
      </div>

      {/* Target Field */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          então limitar campo
        </label>
        <select
          value={targetField}
          onChange={(e) => setTargetField(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
        >
          <option value="">{translations.admin.selectSourceField}</option>
          {sortedFields.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Multi-Select for Filter Rule */}
      {ruleType === 'filter' && targetField &&
       config.fields.find(f => f.id === targetField)?.fieldType === 'dropdown' && (
        <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-900/10 rounded">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            a (selecione múltiplos)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-900 border border-red-900/50 rounded p-3">
            {config.fields.find(f => f.id === targetField)?.options.map(option => (
              <label
                key={option}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-1 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={filterAllowedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilterAllowedValues(prev => [...prev, option]);
                    } else {
                      setFilterAllowedValues(prev => prev.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-gray-300">{option}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filterAllowedValues.length === 1
              ? '1 opção selecionada'
              : `${filterAllowedValues.length} opções selecionadas`}
          </p>
        </div>
      )}

      {/* Type-Specific Configuration */}
      {ruleType === 'transform' && (
        <div className="border-l-4 border-cyan-500 pl-4 py-2 bg-cyan-900/10 rounded">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {translations.admin.transformFieldType}
          </label>
          <select
            value={transformFieldType}
            onChange={(e) => setTransformFieldType(e.target.value as 'dropdown' | 'string' | 'integer')}
            className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
          >
            <option value="dropdown">Dropdown</option>
            <option value="string">String (Texto Livre)</option>
            <option value="integer">Integer (Números Inteiros)</option>
          </select>
        </div>
      )}

      {ruleType === 'visibility' && (
        <div className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-900/10 rounded">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {translations.admin.visibilityAction}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={visibilityAction === 'hide'}
                onChange={() => setVisibilityAction('hide')}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-gray-300">{translations.admin.hideField}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={visibilityAction === 'show'}
                onChange={() => setVisibilityAction('show')}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-gray-300">{translations.admin.showField}</span>
            </label>
          </div>
        </div>
      )}

      {ruleType === 'required' && (
        <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-900/10 rounded">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {translations.admin.requiredAction}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={requiredAction === 'make_required'}
                onChange={() => setRequiredAction('make_required')}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-gray-300">{translations.admin.makeRequired}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={requiredAction === 'make_optional'}
                onChange={() => setRequiredAction('make_optional')}
                className="w-4 h-4 accent-red-600"
              />
              <span className="text-sm text-gray-300">{translations.admin.makeOptional}</span>
            </label>
          </div>
        </div>
      )}

      {ruleType === 'autofill' && (
        <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-900/10 rounded space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {translations.admin.autofillValueLabel}
            </label>
            <input
              type="text"
              value={autofillValue}
              onChange={(e) => setAutofillValue(e.target.value)}
              placeholder="ex: email"
              className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autofillAllowOverride}
              onChange={(e) => setAutofillAllowOverride(e.target.checked)}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm text-gray-300">{translations.admin.allowUserToOverride}</span>
          </label>
        </div>
      )}

      {ruleType === 'warning' && (
        <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-900/10 rounded space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Título do aviso <span className="text-gray-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={warningTitle}
              onChange={(e) => setWarningTitle(e.target.value)}
              placeholder="ex: Atenção PZN"
              className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mensagem do aviso
            </label>
            <textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="ex: Campanhas PZN são parametrizadas pela equipe de Martech."
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>
      )}

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {translations.admin.ruleExplanation} <span className="text-gray-500">({translations.admin.optional})</span>
        </label>
        <input
          type="text"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder={translations.admin.ruleExplanationPlaceholder}
          className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
        />
        <p className="text-xs text-gray-500 mt-1">{translations.admin.ruleExplanationHelp}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          {translations.admin.addRule}
        </button>
        <button
          onClick={resetForm}
          className="px-4 py-2 bg-slate-700 hover:bg-gray-800 text-white rounded transition-colors"
        >
          {translations.admin.cancel}
        </button>
      </div>
    </div>
  );
}
