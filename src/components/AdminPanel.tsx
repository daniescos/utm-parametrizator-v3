import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Download, Upload, RotateCcw, Lock, Edit2, AlertCircle } from 'lucide-react';
import { loadConfig, loadConfigAsync, saveConfig, exportConfig, importConfig, resetConfig, saveConfigToServer } from '../lib/storage';
import type { AppConfig, UTMField, DependencyRule } from '../lib/types';
import { generateId, validateDependency } from '../lib/utils';
import { translations } from '../lib/translations';
import { DependencyForm } from './DependencyForm';

interface AdminPanelProps {
  adminToken: string;
  onLogout: () => void;
}

export function AdminPanel({ adminToken, onLogout }: AdminPanelProps) {
  const [config, setConfig] = useState<AppConfig>(loadConfig());

  useEffect(() => {
    loadConfigAsync().then(setConfig);
  }, []);
  const [activeTab, setActiveTab] = useState<'fields' | 'options' | 'dependencies' | 'config'>('fields');
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'dropdown' | 'string' | 'integer'>('dropdown');
  const [selectedFieldForOptions, setSelectedFieldForOptions] = useState<string | null>(null);
  const [fieldOptionsText, setFieldOptionsText] = useState('');
  const [showDependencyForm, setShowDependencyForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldLabel, setEditFieldLabel] = useState('');
  const [editFieldType, setEditFieldType] = useState<'dropdown' | 'string' | 'integer'>('dropdown');
  const [editFieldOptions, setEditFieldOptions] = useState('');
  const [editFieldDescription, setEditFieldDescription] = useState('');

  const handleSave = async () => {
    // Increment version to trigger client-side sync for all users
    const updatedConfig = {
      ...config,
      version: (config.version || 1) + 1,
    };

    // Save to localStorage
    saveConfig(updatedConfig);

    // Save to server (update config.json)
    const result = await saveConfigToServer(updatedConfig, adminToken);

    if (result.success) {
      setSuccess(translations.admin.successMessages.configurationSavedSuccessfully);
    } else {
      setError(result.error || 'Failed to save configuration to server');
    }

    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 3000);
  };

  // Field Management
  const handleAddField = () => {
    if (!newFieldName.trim() || !newFieldLabel.trim()) {
      setError(translations.admin.errorMessages.fieldNameAndLabelRequired);
      return;
    }

    const newField: UTMField = {
      id: generateId(),
      name: newFieldName,
      label: newFieldLabel,
      fieldType: newFieldType,
      options: [],
      order: config.fields.length + 1,
      isCustom: true,
      description: undefined,
    };

    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldType('dropdown');
    setShowNewFieldForm(false);
    setError('');
  };

  const handleDeleteField = (fieldId: string) => {
    const field = config.fields.find(f => f.id === fieldId);
    if (field && !field.isCustom) {
      setError(translations.admin.cannotDeleteStandardField);
      return;
    }

    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
      dependencies: prev.dependencies.filter(
        d => d.sourceField !== fieldId && d.targetField !== fieldId
      ),
    }));
  };

  const handleStartEditField = (field: UTMField) => {
    setEditingFieldId(field.id);
    setEditFieldName(field.name);
    setEditFieldLabel(field.label);
    setEditFieldType(field.fieldType);
    setEditFieldOptions(field.options.join('\n'));
    setEditFieldDescription(field.description || '');
  };

  const handleSaveEditField = () => {
    if (!editFieldName.trim() || !editFieldLabel.trim()) {
      setError(translations.admin.errorMessages.fieldNameAndLabelRequired);
      return;
    }

    const field = config.fields.find(f => f.id === editingFieldId);
    if (!field) return;

    const options = editFieldType === 'dropdown'
      ? editFieldOptions.split('\n').map(o => o.trim()).filter(Boolean)
      : [];

    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f =>
        f.id === editingFieldId
          ? {
              ...f,
              name: editFieldName,
              label: editFieldLabel,
              fieldType: editFieldType,
              options,
              description: editFieldDescription || undefined,
            }
          : f
      ),
    }));

    setEditingFieldId(null);
    setSuccess(translations.admin.fieldUpdatedSuccessfully);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancelEditField = () => {
    setEditingFieldId(null);
    setEditFieldName('');
    setEditFieldLabel('');
    setEditFieldType('dropdown');
    setEditFieldOptions('');
    setEditFieldDescription('');
  };

  // Options Management
  const handleUpdateFieldOptions = (fieldId: string) => {
    const options = fieldOptionsText
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean);

    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f =>
        f.id === fieldId ? { ...f, options } : f
      ),
    }));

    setFieldOptionsText('');
    setSelectedFieldForOptions(null);
    setSuccess(translations.admin.optionsUpdated);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Dependency Management

  const formatRuleDisplay = (rule: DependencyRule): string => {
    const sourceField = config.fields.find(f => f.id === rule.sourceField);
    const targetField = config.fields.find(f => f.id === rule.targetField);
    const ruleType = rule.ruleType || 'filter';

    // Mark legacy rules
    const isLegacy = ruleType === 'validation' || ruleType === 'cross_validation';
    const legacyPrefix = isLegacy ? '⚠️ [LEGADA] ' : '';

    let description = '';

    switch (ruleType) {
      case 'filter':
      case 'validation':
        let constraint = '';
        if (rule.targetFieldType === 'dropdown' && rule.allowedValues) {
          constraint = `∈ [${rule.allowedValues.join(', ')}]`;
        } else if (rule.targetFieldType === 'string' && rule.stringConstraint) {
          const sc = rule.stringConstraint;
          switch (sc.type) {
            case 'pattern': constraint = `corresponde a "${sc.value}"`; break;
            case 'contains': constraint = `contém "${sc.value}"`; break;
            case 'startsWith': constraint = `começa com "${sc.value}"`; break;
            case 'endsWith': constraint = `termina com "${sc.value}"`; break;
            case 'equals': constraint = `= "${sc.value}"`; break;
            case 'minLength': constraint = `comprimento ≥ ${sc.value}`; break;
            case 'maxLength': constraint = `comprimento ≤ ${sc.value}`; break;
          }
        }
        description = `Se ${sourceField?.label} = ${rule.sourceValue}, então ${targetField?.label} ${constraint}`;
        break;

      case 'transform':
        description = `Se ${sourceField?.label} = ${rule.sourceValue}, transforma ${targetField?.label} para ${rule.transformTo?.fieldType}`;
        break;

      case 'visibility':
        description = `Se ${sourceField?.label} = ${rule.sourceValue}, ${rule.visibilityAction === 'hide' ? 'oculta' : 'mostra'} ${targetField?.label}`;
        break;

      case 'required':
        description = `Se ${sourceField?.label} = ${rule.sourceValue}, torna ${targetField?.label} ${rule.requiredAction === 'make_required' ? 'obrigatório' : 'opcional'}`;
        break;

      case 'autofill':
        description = `Se ${sourceField?.label} = ${rule.sourceValue}, preenche ${targetField?.label} com "${rule.autofillValue}"`;
        break;

      case 'cross_validation':
        description = `Se ${sourceField?.label} = ${rule.sourceValue}, ${rule.crossValidation?.validationRule || targetField?.label + ' deve ter valor específico'}`;
        break;

      default:
        description = `Regra de tipo desconhecido`;
    }

    return legacyPrefix + description;
  };

  const handleAddDependency = (rule: DependencyRule) => {
    const validation = validateDependency(rule, config);
    if (!validation.valid) {
      setError(validation.error || 'Invalid dependency');
      return;
    }

    setConfig(prev => ({
      ...prev,
      dependencies: [...prev.dependencies, rule],
    }));

    setShowDependencyForm(false);
    setError('');
    setSuccess(translations.admin.dependencyAddedSuccessfully);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteDependency = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(d => d.id !== ruleId),
    }));
  };

  // Import/Export
  const handleExport = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utm-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportGlobal = () => {
    const json = exportConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
    setSuccess(translations.admin.configGlobalInstructions);
    setTimeout(() => setSuccess(''), 8000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const imported = importConfig(json);
        setConfig(imported);
        setSuccess(translations.admin.configurationImportedSuccessfully);
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : translations.admin.errorMessages.importFailed);
      }
    };
    reader.readAsText(file);
  };

  const sortedFields = useMemo(() => {
    return [...config.fields].sort((a, b) => a.order - b.order);
  }, [config.fields]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{translations.admin.title}</h1>
            <p className="text-gray-400 mt-1">{translations.admin.subtitle}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg border border-red-900/50 transition-colors"
          >
            <Lock className="w-4 h-4" />
            {translations.admin.logout}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300">
            {success}
          </div>
        )}

        {/* Legacy Rules Warning */}
        {config.dependencies.some(d => d.ruleType === 'validation' || d.ruleType === 'cross_validation') && (
          <div className="mb-4 p-4 bg-orange-900/30 border border-orange-700 rounded-lg text-orange-300">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5" />
              <strong>Regras Legadas Detectadas</strong>
            </div>
            <p className="text-sm">
              Este sistema contém regras de tipo "validação" ou "validação cruzada" que foram descontinuadas.
              Estas regras continuam funcionando, mas recomendamos atualizá-las ou removê-las.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-red-900/50">
          {(['fields', 'options', 'dependencies', 'config'] as const).map(tab => {
            const tabLabels: Record<typeof tab, string> = {
              fields: translations.admin.tabs.fields,
              options: translations.admin.tabs.options,
              dependencies: translations.admin.tabs.dependencies,
              config: translations.admin.tabs.config,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-red-500 border-b-2 border-red-600'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-red-900/50 p-6">
          {/* Fields Tab */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowNewFieldForm(!showNewFieldForm)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {translations.admin.addCustomField}
              </button>

              {showNewFieldForm && (
                <div className="border border-red-900/50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.fieldName}</label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder={translations.admin.fieldNamePlaceholder}
                      className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.displayLabel}</label>
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder={translations.admin.displayLabelPlaceholder}
                      className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.fieldType}</label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as 'dropdown' | 'string' | 'integer')}
                      className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
                    >
                      <option value="dropdown">{translations.admin.fieldTypeDropdown}</option>
                      <option value="string">{translations.admin.fieldTypeString}</option>
                      <option value="integer">{translations.admin.fieldTypeInteger}</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddField}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      {translations.admin.addField}
                    </button>
                    <button
                      onClick={() => setShowNewFieldForm(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-gray-800 text-white rounded transition-colors"
                    >
                      {translations.admin.cancel}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {sortedFields.map(field => (
                  <div key={field.id}>
                    {editingFieldId === field.id ? (
                      <div className="border border-red-900/50 rounded-lg p-4 space-y-3 bg-slate-700/50">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.fieldName}</label>
                          <input
                            type="text"
                            value={editFieldName}
                            onChange={(e) => setEditFieldName(e.target.value)}
                            placeholder={translations.admin.fieldNamePlaceholder}
                            className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.displayLabel}</label>
                          <input
                            type="text"
                            value={editFieldLabel}
                            onChange={(e) => setEditFieldLabel(e.target.value)}
                            placeholder={translations.admin.displayLabelPlaceholder}
                            className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.fieldType}</label>
                          <select
                            value={editFieldType}
                            onChange={(e) => setEditFieldType(e.target.value as 'dropdown' | 'string' | 'integer')}
                            className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
                          >
                            <option value="dropdown">{translations.admin.fieldTypeDropdown}</option>
                            <option value="string">{translations.admin.fieldTypeString}</option>
                            <option value="integer">{translations.admin.fieldTypeInteger}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.description}</label>
                          <textarea
                            value={editFieldDescription}
                            onChange={(e) => setEditFieldDescription(e.target.value)}
                            placeholder={translations.admin.descriptionPlaceholder}
                            className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600 font-mono text-sm h-16"
                          />
                        </div>
                        {editFieldType === 'dropdown' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">{translations.admin.options}</label>
                            <textarea
                              value={editFieldOptions}
                              onChange={(e) => setEditFieldOptions(e.target.value)}
                              placeholder={translations.admin.optionsPlaceholder}
                              className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600 font-mono text-sm h-24"
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEditField}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            {translations.admin.saveChangesField}
                          </button>
                          <button
                            onClick={handleCancelEditField}
                            className="px-4 py-2 bg-slate-700 hover:bg-gray-800 text-white rounded transition-colors"
                          >
                            {translations.admin.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-white">{field.label}</p>
                            <span className="px-2 py-0.5 text-xs rounded bg-slate-600 text-gray-300 font-mono">
                              {field.fieldType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{field.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStartEditField(field)}
                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                            title={translations.admin.editField}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {field.isCustom && (
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors ml-1"
                              title={translations.admin.deleteField}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Options Tab */}
          {activeTab === 'options' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{translations.admin.selectField}</label>
                <select
                  value={selectedFieldForOptions || ''}
                  onChange={(e) => {
                    setSelectedFieldForOptions(e.target.value);
                    setFieldOptionsText('');
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">{translations.admin.chooseField}</option>
                  {sortedFields.map(field => (
                    <option key={field.id} value={field.id}>{field.label}</option>
                  ))}
                </select>
              </div>

              {selectedFieldForOptions && (
                <>
                  {config.fields.find(f => f.id === selectedFieldForOptions)?.fieldType !== 'dropdown' && (
                    <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-300 text-sm">
                      {translations.admin.noteNonDropdownField.replace('{fieldType}', config.fields.find(f => f.id === selectedFieldForOptions)?.fieldType || '')}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {translations.admin.options}
                    </label>
                    <textarea
                      value={fieldOptionsText}
                      onChange={(e) => setFieldOptionsText(e.target.value)}
                      placeholder={translations.admin.optionsPlaceholder}
                      disabled={config.fields.find(f => f.id === selectedFieldForOptions)?.fieldType !== 'dropdown'}
                      className="w-full px-3 py-2 bg-gray-900 border border-red-900/50 rounded text-white placeholder-gray-500 focus:outline-none focus:border-red-600 font-mono text-sm h-32 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={() => handleUpdateFieldOptions(selectedFieldForOptions)}
                      disabled={config.fields.find(f => f.id === selectedFieldForOptions)?.fieldType !== 'dropdown'}
                      className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                      {translations.admin.saveOptions}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === 'dependencies' && (
            <div className="space-y-4">
              <button
                onClick={() => setShowDependencyForm(!showDependencyForm)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {translations.admin.addDependencyRule}
              </button>

              {showDependencyForm && (
                <DependencyForm
                  config={config}
                  sortedFields={sortedFields}
                  onAddRule={handleAddDependency}
                  onError={setError}
                />
              )}

              <div className="space-y-2">
                {config.dependencies.map(rule => {
                  const isLegacy = rule.ruleType === 'validation' || rule.ruleType === 'cross_validation';
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isLegacy
                          ? 'bg-orange-900/20 border border-orange-700/50'
                          : 'bg-slate-700'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-gray-300">
                          {formatRuleDisplay(rule)}
                        </p>
                        {rule.explanation && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            "{rule.explanation}"
                          </p>
                        )}
                        {isLegacy && (
                          <p className="text-xs text-orange-400 mt-1">
                            ⚠️ Esta é uma regra legada. Considere atualizar ou remover.
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteDependency(rule.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors ml-3"
                        title={translations.admin.deleteDependency}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Config Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Versioning Info */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-semibold text-blue-200 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {translations.admin.versioningInfo.title}
                </h3>
                <p className="text-sm text-blue-300">
                  {translations.admin.versioningInfo.description}
                </p>
                <div className="bg-blue-950/50 rounded p-3 border border-blue-700/50">
                  <p className="text-xs text-blue-300 font-mono">
                    {translations.admin.versioningInfo.howItWorks}
                  </p>
                </div>
                <div className="text-sm text-blue-300">
                  <strong>Versão atual da configuração:</strong> <span className="font-mono text-blue-200">{config.version || 1}</span>
                </div>
              </div>

              {/* Password Info */}
              <div className="border-b border-red-900/50 pb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{translations.admin.changeAdminPassword}</h3>
                <p className="text-sm text-gray-400">
                  A senha do admin não fica mais dentro da configuração (arquivo público). Ela é definida pela
                  variável de ambiente <code className="text-red-400">ADMIN_PASSWORD_HASH</code> no servidor —
                  peça ao responsável pelo deploy para alterá-la.
                </p>
              </div>

              {/* Import/Export */}
              <div className="border-b border-red-900/50 pb-6">
                <h3 className="text-lg font-semibold text-white mb-4">{translations.admin.configuration}</h3>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {translations.admin.exportConfig}
                  </button>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {translations.admin.importConfig}
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleExportGlobal}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {translations.admin.exportConfigGlobal}
                  </button>
                </div>
              </div>

              {/* Global Config Help Text */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-300">{translations.admin.saveConfigGlobalHelp}</p>
              </div>

              {/* Dangerous Actions */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">{translations.admin.dangerousActions}</h3>
                <button
                  onClick={() => {
                    if (confirm(translations.admin.resetConfirmation)) {
                      resetConfig();
                      setConfig(loadConfig());
                      setSuccess(translations.admin.configurationResetToDefaults);
                      setTimeout(() => setSuccess(''), 3000);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {translations.admin.resetToDefaults}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            {translations.admin.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
