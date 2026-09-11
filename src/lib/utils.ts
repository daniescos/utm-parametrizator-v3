import type { AppConfig, DependencyRule, UTMFieldState } from './types';

export function validateFieldValue(
  value: string,
  fieldType: 'dropdown' | 'string' | 'integer'
): { valid: boolean; sanitized: string; error?: string } {
  if (!value || !value.trim()) {
    return { valid: true, sanitized: '' };
  }

  switch (fieldType) {
    case 'dropdown':
    case 'string':
      return { valid: true, sanitized: value.trim() };

    case 'integer': {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return {
          valid: false,
          sanitized: value,
          error: 'Value must be a valid integer'
        };
      }
      return { valid: true, sanitized: parsed.toString() };
    }

    default:
      return { valid: true, sanitized: value.trim() };
  }
}

export function generateUTMUrl(
  baseUrl: string,
  selectedValues: Record<string, string>,
  config: AppConfig
): string {
  if (!baseUrl.trim()) {
    return '';
  }

  // Fields sharing a `group` (e.g. ferramenta/formato/bloco all grouped under
  // "utm_medium") are concatenated with "_" into ONE query param, in field
  // `order` — mirroring how the v1 desktop tool built utm_medium=gam_banner_tp.
  // Ungrouped fields emit individually under their own `name`.
  const sortedFields = [...config.fields].sort((a, b) => a.order - b.order);
  const groupValues = new Map<string, string[]>();
  const singleParams: Array<{ name: string; value: string }> = [];

  sortedFields.forEach(field => {
    const raw = selectedValues[field.id];
    if (!raw || !raw.trim()) return;

    const validation = validateFieldValue(raw, field.fieldType);
    if (!validation.valid || !validation.sanitized) return;

    if (field.group) {
      const existing = groupValues.get(field.group) || [];
      existing.push(validation.sanitized);
      groupValues.set(field.group, existing);
    } else {
      singleParams.push({ name: field.name, value: validation.sanitized });
    }
  });

  const params = new URLSearchParams();
  singleParams.forEach(({ name, value }) => params.append(name, value));
  groupValues.forEach((values, groupName) => {
    if (values.length > 0) {
      params.append(groupName, values.join('_'));
    }
  });

  const separator = baseUrl.includes('?') ? '&' : '?';
  const queryString = params.toString();

  return queryString ? `${baseUrl}${separator}${queryString}` : baseUrl;
}

export function getAvailableOptionsForField(
  fieldId: string,
  selectedValues: Record<string, string>,
  config: AppConfig
): string[] {
  const field = config.fields.find(f => f.id === fieldId);
  if (!field) return [];

  let availableOptions = [...field.options];

  // Apply dependency rules (optionally AND-ed with a second source condition,
  // e.g. ferramenta=X AND formato=Y -> bloco restricted)
  const applicableRules = config.dependencies.filter(rule => {
    if (rule.targetField !== fieldId || rule.targetFieldType !== 'dropdown') return false;
    if (selectedValues[rule.sourceField] !== rule.sourceValue) return false;
    if (rule.sourceField2 && selectedValues[rule.sourceField2] !== rule.sourceValue2) return false;
    return true;
  });

  if (applicableRules.length > 0) {
    // If there are applicable rules, restrict to their allowed values
    const ruleAllowedValues = new Set<string>();
    applicableRules.forEach(rule => {
      if (rule.allowedValues) {
        rule.allowedValues.forEach(val => ruleAllowedValues.add(val));
      }
    });
    availableOptions = availableOptions.filter(opt => ruleAllowedValues.has(opt));
  }

  return availableOptions;
}

export function validateDependency(
  rule: DependencyRule,
  config: AppConfig
): { valid: boolean; error?: string } {
  // Use enhanced validation that supports all rule types
  return validateDependencyEnhanced(rule, config);
}

function validateDropdownDependency(
  rule: DependencyRule,
  targetField: any
): { valid: boolean; error?: string } {
  if (!rule.allowedValues || rule.allowedValues.length === 0) {
    return { valid: false, error: 'Dropdown dependency must have allowed values' };
  }

  // Check all allowed values exist in target field options
  const invalidValues = rule.allowedValues.filter(
    val => !targetField.options.includes(val)
  );
  if (invalidValues.length > 0) {
    return { valid: false, error: `Invalid target values: ${invalidValues.join(', ')}` };
  }

  return { valid: true };
}

function validateStringDependency(
  rule: DependencyRule
): { valid: boolean; error?: string } {
  if (!rule.stringConstraint) {
    return { valid: false, error: 'String dependency must have a constraint' };
  }

  const sc = rule.stringConstraint;

  if (!sc.type) {
    return { valid: false, error: 'String constraint must have a type' };
  }

  if (!sc.value && !['minLength', 'maxLength'].includes(sc.type)) {
    return { valid: false, error: 'String constraint must have a value' };
  }

  // Validate regex pattern if type is 'pattern'
  if (sc.type === 'pattern') {
    try {
      new RegExp(sc.value);
    } catch (e) {
      return { valid: false, error: `Invalid regex pattern: ${sc.value}` };
    }
  }

  // Validate length constraints
  if (['minLength', 'maxLength'].includes(sc.type)) {
    const length = parseInt(sc.value);
    if (isNaN(length) || length < 0) {
      return { valid: false, error: 'Length constraint must be a non-negative number' };
    }
  }

  return { valid: true };
}

/**
 * Get applicable dependency rules for a field based on current selections
 */
export function getApplicableDependencyRules(
  fieldId: string,
  selectedValues: Record<string, string>,
  config: AppConfig
): DependencyRule[] {
  return config.dependencies.filter(
    rule => rule.targetField === fieldId && selectedValues[rule.sourceField] === rule.sourceValue
  );
}

/**
 * Validate a string value against dependency rules
 */
export function validateStringAgainstRules(
  value: string,
  applicableRules: DependencyRule[]
): { valid: boolean; error?: string; violatedRule?: DependencyRule } {
  for (const rule of applicableRules) {
    if (rule.targetFieldType !== 'string' || !rule.stringConstraint) continue;

    const sc = rule.stringConstraint;
    const testValue = sc.caseSensitive ? value : value.toLowerCase();
    const constraintValue = sc.caseSensitive ? sc.value : sc.value.toLowerCase();

    let valid = true;
    let error = '';

    switch (sc.type) {
      case 'pattern':
        try {
          const regex = new RegExp(sc.value, sc.caseSensitive ? '' : 'i');
          valid = regex.test(value);
          error = valid ? '' : `Deve corresponder ao padrão: ${sc.value}`;
        } catch (e) {
          valid = false;
          error = 'Padrão inválido';
        }
        break;

      case 'contains':
        valid = testValue.includes(constraintValue);
        error = valid ? '' : `Deve conter: ${sc.value}`;
        break;

      case 'startsWith':
        valid = testValue.startsWith(constraintValue);
        error = valid ? '' : `Deve começar com: ${sc.value}`;
        break;

      case 'endsWith':
        valid = testValue.endsWith(constraintValue);
        error = valid ? '' : `Deve terminar com: ${sc.value}`;
        break;

      case 'equals':
        valid = testValue === constraintValue;
        error = valid ? '' : `Deve ser exatamente: ${sc.value}`;
        break;

      case 'minLength':
        const minLen = parseInt(sc.value);
        valid = value.length >= minLen;
        error = valid ? '' : `Deve ter pelo menos ${minLen} caracteres`;
        break;

      case 'maxLength':
        const maxLen = parseInt(sc.value);
        valid = value.length <= maxLen;
        error = valid ? '' : `Deve ter no máximo ${maxLen} caracteres`;
        break;
    }

    if (!valid) {
      return { valid: false, error, violatedRule: rule };
    }
  }

  return { valid: true };
}

/**
 * Evaluate if a rule should be active based on source condition
 */
export function evaluateSourceCondition(
  rule: DependencyRule,
  sourceValue: string | undefined
): boolean {
  if (!sourceValue) return false;

  const condition = rule.sourceCondition || 'equals';

  switch (condition) {
    case 'equals':
      return sourceValue === rule.sourceValue;

    case 'not_equals':
      return sourceValue !== rule.sourceValue;

    case 'in':
      return (rule.sourceValues || []).includes(sourceValue);

    case 'not_in':
      return !(rule.sourceValues || []).includes(sourceValue);

    default:
      return false;
  }
}

/**
 * Get all active rules for the current state
 */
export function getActiveRules(
  selectedValues: Record<string, string>,
  config: AppConfig
): Map<string, DependencyRule[]> {
  const activeRulesByField = new Map<string, DependencyRule[]>();

  for (const rule of config.dependencies) {
    const isActive = evaluateSourceCondition(
      rule,
      selectedValues[rule.sourceField]
    );

    if (isActive) {
      const existing = activeRulesByField.get(rule.targetField) || [];
      existing.push(rule);
      activeRulesByField.set(rule.targetField, existing);
    }
  }

  // Sort by priority (higher first)
  for (const [field, rules] of activeRulesByField) {
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    activeRulesByField.set(field, rules);
  }

  return activeRulesByField;
}

/**
 * Check if multiple rules conflict with each other
 */
export function checkRuleConflicts(rules: DependencyRule[]): boolean {
  if (rules.length <= 1) return false;

  // Check for conflicting visibility rules
  const visibilityRules = rules.filter(r => r.ruleType === 'visibility');
  if (visibilityRules.length > 1) {
    const actions = new Set(visibilityRules.map(r => r.visibilityAction));
    if (actions.size > 1) return true;
  }

  // Check for conflicting required rules
  const requiredRules = rules.filter(r => r.ruleType === 'required');
  if (requiredRules.length > 1) {
    const actions = new Set(requiredRules.map(r => r.requiredAction));
    if (actions.size > 1) return true;
  }

  // Check for conflicting transform rules
  const transformRules = rules.filter(r => r.ruleType === 'transform');
  if (transformRules.length > 1) {
    const types = new Set(transformRules.map(r => r.transformTo?.fieldType));
    if (types.size > 1) return true;
  }

  return false;
}

/**
 * Compute field states based on active rules
 */
export function computeFieldStates(
  selectedValues: Record<string, string>,
  config: AppConfig
): Record<string, UTMFieldState> {
  const activeRules = getActiveRules(selectedValues, config);
  const states: Record<string, UTMFieldState> = {};

  for (const field of config.fields) {
    const rules = activeRules.get(field.id) || [];

    // Determine visibility: explicit hide always wins; otherwise an explicit
    // show rule overrides a field that defaults to hidden (e.g. cascading
    // sub-fields like totem's estado/cidade/loja); everything else defaults visible.
    const hideRule = rules.find(r => r.ruleType === 'visibility' && r.visibilityAction === 'hide');
    const showRule = rules.find(r => r.ruleType === 'visibility' && r.visibilityAction === 'show');
    const isVisible = hideRule ? false : showRule ? true : field.defaultVisible !== false;

    // Determine current field type (apply transforms)
    const transformRule = rules.find(r => r.ruleType === 'transform');
    const currentFieldType = transformRule?.transformTo?.fieldType || field.fieldType;

    // Determine if required: an active rule overrides the field's own default
    const requiredRule = rules.find(r => r.ruleType === 'required');
    const isRequired = requiredRule
      ? requiredRule.requiredAction === 'make_required'
      : field.defaultRequired ?? false;

    // Check for conflicts
    const hasConflict = checkRuleConflicts(rules);

    states[field.id] = {
      fieldId: field.id,
      originalFieldType: field.fieldType,
      currentFieldType,
      isVisible,
      isRequired,
      appliedRules: rules.map(r => r.id),
      hasConflict,
    };
  }

  return states;
}

/**
 * Validate cross-field relationships
 */
export function validateCrossField(
  rule: DependencyRule,
  selectedValues: Record<string, string>
): { valid: boolean; error?: string } {
  if (!rule.crossValidation) {
    return { valid: true };
  }

  const cv = rule.crossValidation;

  if (cv.allowedCombinations && cv.allowedCombinations.length > 0) {
    const targetValue = selectedValues[rule.targetField];

    const isAllowed = cv.allowedCombinations.some(combo =>
      combo.targetValue === targetValue
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: cv.validationRule || 'Combinação de campos inválida'
      };
    }
  }

  return { valid: true };
}

/**
 * Validate transform rule at creation time
 */
export function validateTransformRule(
  rule: DependencyRule,
  config: AppConfig
): { valid: boolean; error?: string } {
  if (!rule.transformTo) {
    return { valid: false, error: 'Transform rule must have transformTo configuration' };
  }

  const { fieldType, dropdownOptions, stringConstraint } = rule.transformTo;

  if (!fieldType) {
    return { valid: false, error: 'Target field type must be specified' };
  }

  // Validate transform to dropdown
  if (fieldType === 'dropdown' && dropdownOptions) {
    const targetField = config.fields.find(f => f.id === rule.targetField);
    if (targetField && targetField.fieldType === 'dropdown') {
      const invalidOptions = dropdownOptions.filter(
        opt => !targetField.options.includes(opt)
      );
      if (invalidOptions.length > 0) {
        return { valid: false, error: `Invalid dropdown options: ${invalidOptions.join(', ')}` };
      }
    }
  }

  // Validate transform to string with constraint
  if (fieldType === 'string' && stringConstraint) {
    const constraintValidation = validateStringDependency({ ...rule, stringConstraint });
    if (!constraintValidation.valid) {
      return constraintValidation;
    }
  }

  // Validate transform to integer
  if (fieldType === 'integer') {
    // Integer type requires no additional validation at transform creation time
    // Runtime validation handled by validateFieldValue()
    return { valid: true };
  }

  return { valid: true };
}

/**
 * Validate visibility rule at creation time
 */
export function validateVisibilityRule(
  rule: DependencyRule
): { valid: boolean; error?: string } {
  if (!rule.visibilityAction) {
    return { valid: false, error: 'Visibility rule must have an action (show/hide)' };
  }

  if (!['show', 'hide'].includes(rule.visibilityAction)) {
    return { valid: false, error: 'Invalid visibility action' };
  }

  return { valid: true };
}

/**
 * Validate required rule at creation time
 */
export function validateRequiredRule(
  rule: DependencyRule
): { valid: boolean; error?: string } {
  if (!rule.requiredAction) {
    return { valid: false, error: 'Required rule must have an action (make_required/make_optional)' };
  }

  if (!['make_required', 'make_optional'].includes(rule.requiredAction)) {
    return { valid: false, error: 'Invalid required action' };
  }

  return { valid: true };
}

/**
 * Validate autofill rule at creation time
 */
export function validateAutofillRule(
  rule: DependencyRule,
  config: AppConfig
): { valid: boolean; error?: string } {
  if (!rule.autofillValue) {
    return { valid: false, error: 'Autofill rule must have a value to fill' };
  }

  const targetField = config.fields.find(f => f.id === rule.targetField);
  if (!targetField) {
    return { valid: false, error: 'Target field not found' };
  }

  // If target is dropdown, validate value exists in options
  if (targetField.fieldType === 'dropdown') {
    if (!targetField.options.includes(rule.autofillValue)) {
      return { valid: false, error: `Autofill value "${rule.autofillValue}" not in target field options` };
    }
  }

  return { valid: true };
}

/**
 * Validate warning rule at creation time
 */
export function validateWarningRule(
  rule: DependencyRule
): { valid: boolean; error?: string } {
  if (!rule.warningMessage) {
    return { valid: false, error: 'Regra de aviso precisa de uma mensagem' };
  }
  return { valid: true };
}

/**
 * Validate cross-validation rule at creation time
 */
export function validateCrossValidationRule(
  rule: DependencyRule,
  config: AppConfig
): { valid: boolean; error?: string } {
  if (!rule.crossValidation) {
    return { valid: false, error: 'Cross-validation rule must have configuration' };
  }

  const cv = rule.crossValidation;

  if (!cv.validationRule && (!cv.allowedCombinations || cv.allowedCombinations.length === 0)) {
    return { valid: false, error: 'Cross-validation must have either a description or allowed combinations' };
  }

  if (cv.allowedCombinations && cv.allowedCombinations.length > 0) {
    const targetField = config.fields.find(f => f.id === rule.targetField);
    if (targetField && targetField.fieldType === 'dropdown') {
      const invalidCombos = cv.allowedCombinations.filter(
        combo => !targetField.options.includes(combo.targetValue)
      );
      if (invalidCombos.length > 0) {
        return { valid: false, error: 'Some allowed combinations have invalid target values' };
      }
    }
  }

  return { valid: true };
}

/**
 * Update validateDependency to handle all rule types
 */
export function validateDependencyEnhanced(
  rule: DependencyRule,
  config: AppConfig
): { valid: boolean; error?: string } {
  // Check source and target fields exist
  const sourceField = config.fields.find(f => f.id === rule.sourceField);
  if (!sourceField) {
    return { valid: false, error: `Source field ${rule.sourceField} not found` };
  }

  const targetField = config.fields.find(f => f.id === rule.targetField);
  if (!targetField) {
    return { valid: false, error: `Target field ${rule.targetField} not found` };
  }

  // Source field must be dropdown (only dropdowns trigger rules)
  if (sourceField.fieldType !== 'dropdown') {
    return {
      valid: false,
      error: `Source field must be a dropdown type (current: ${sourceField.fieldType})`
    };
  }

  // For 'in' and 'not_in', check sourceValues exist
  const condition = rule.sourceCondition || 'equals';
  if ((condition === 'in' || condition === 'not_in') && rule.sourceValues) {
    const invalidValues = rule.sourceValues.filter(
      val => !sourceField.options.includes(val)
    );
    if (invalidValues.length > 0) {
      return { valid: false, error: `Invalid source values: ${invalidValues.join(', ')}` };
    }
  }

  // For 'equals' and 'not_equals', check sourceValue exists
  if ((condition === 'equals' || condition === 'not_equals') && !sourceField.options.includes(rule.sourceValue)) {
    return { valid: false, error: `Source value ${rule.sourceValue} not in source field options` };
  }

  // Type-specific validation
  const ruleType = rule.ruleType || 'filter';
  switch (ruleType) {
    case 'filter':
      return validateDropdownDependency(rule, targetField);

    case 'validation':
      return validateStringDependency(rule);

    case 'transform':
      return validateTransformRule(rule, config);

    case 'visibility':
      return validateVisibilityRule(rule);

    case 'required':
      return validateRequiredRule(rule);

    case 'autofill':
      return validateAutofillRule(rule, config);

    case 'cross_validation':
      return validateCrossValidationRule(rule, config);

    case 'warning':
      return validateWarningRule(rule);

    default:
      return { valid: false, error: `Unknown rule type: ${ruleType}` };
  }
}

/**
 * Sanitize free-text UTM input as the user types: strip accents, collapse
 * whitespace to underscores, and drop anything outside [a-z0-9_-]. Mirrors
 * the v1 desktop tool's live input sanitizer so values stay tracker-safe.
 */
export function sanitizeUtmText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
}

/**
 * Validate a field's own static `pattern` (set on the field definition itself,
 * not via a dependency rule). Used for constraints that never depend on other
 * fields, e.g. utm_id accepting either a 5-digit OS or an alphanumeric Affiliate ID.
 */
export function validateStaticPattern(
  value: string,
  field: { pattern?: string; patternErrorMessage?: string }
): { valid: boolean; error?: string } {
  if (!field.pattern || !value) return { valid: true };
  try {
    const regex = new RegExp(field.pattern);
    if (!regex.test(value)) {
      return { valid: false, error: field.patternErrorMessage || 'Formato inválido' };
    }
  } catch {
    return { valid: true };
  }
  return { valid: true };
}

export function copyToClipboard(text: string): Promise<boolean> {
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
