export interface UTMField {
  id: string;
  name: string;           // e.g., "utm_source"
  label: string;          // e.g., "Source"
  fieldType: 'dropdown' | 'string' | 'integer';  // field input type
  options: string[];      // dropdown values (only for dropdown type)
  order: number;          // display order
  isCustom: boolean;      // true if admin-created
  description?: string;   // tooltip description shown on hover
  defaultVisible?: boolean;      // NEW: false = hidden unless a 'visibility' show rule fires (default true)
  defaultRequired?: boolean;     // NEW: whether the field is required with no dependency rule active (default false)
  pattern?: string;              // NEW: always-on regex validation for string fields, independent of dependency rules
  patternErrorMessage?: string;  // NEW: message shown when `pattern` fails
  group?: string;                // NEW: composite UTM param name (e.g. "utm_medium"). Fields sharing a
                                  // group are joined with "_" into ONE query param, in `order`, mirroring
                                  // the v1 desktop tool's ferramenta_formato_bloco style concatenation.
                                  // Fields without a group emit individually as their own `name` param.
  sectionTitle?: string;         // NEW: visual section header shown above this field when it starts a new group
}

export type RuleType =
  | 'filter'              // Existing: restrict dropdown options
  | 'validation'          // Existing: validate string fields
  | 'transform'           // NEW: change field type dynamically
  | 'visibility'          // NEW: show/hide fields
  | 'required'            // NEW: make fields required/optional
  | 'autofill'            // NEW: automatically populate field values
  | 'cross_validation'    // NEW: validate relationships between fields
  | 'warning';            // NEW: show a non-blocking banner (e.g. PZN/Journey Builder notices)

export type SourceCondition = 'equals' | 'not_equals' | 'in' | 'not_in';

export interface StringConstraint {
  type: 'pattern' | 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'minLength' | 'maxLength';
  value: string;
  caseSensitive?: boolean;
}

export interface TransformRuleConfig {
  fieldType: 'dropdown' | 'string' | 'integer';
  dropdownOptions?: string[];
  stringConstraint?: StringConstraint;
  clearValueOnTransform?: boolean;
}

export interface CrossValidationConfig {
  validationRule: string;
  allowedCombinations?: Array<{
    targetValue: string;
    targetValue2?: string;
  }>;
}

export interface DependencyRule {
  id: string;
  ruleType: RuleType;                    // NEW: discriminator for rule type
  priority?: number;                     // NEW: for conflict resolution (higher = first)

  // Source condition
  sourceField: string;                   // field ID that triggers rule
  sourceValue: string;                   // value that triggers rule
  sourceCondition?: SourceCondition;     // NEW: condition type (default: 'equals')
  sourceValues?: string[];               // NEW: for 'in'/'not_in' conditions

  // NEW: optional second AND-ed condition (e.g. ferramenta=X AND formato=Y -> bloco filtered)
  sourceField2?: string;
  sourceValue2?: string;

  // Target configuration
  targetField: string;                   // field affected by rule
  targetFieldType?: 'dropdown' | 'string' | 'integer';

  // EXISTING: Dropdown filtering (ruleType: 'filter')
  allowedValues?: string[];

  // EXISTING: String validation (ruleType: 'validation')
  stringConstraint?: StringConstraint;

  // NEW: Transform configuration (ruleType: 'transform')
  transformTo?: TransformRuleConfig;

  // NEW: Visibility configuration (ruleType: 'visibility')
  visibilityAction?: 'show' | 'hide';

  // NEW: Required field configuration (ruleType: 'required')
  requiredAction?: 'make_required' | 'make_optional';

  // NEW: Autofill configuration (ruleType: 'autofill')
  autofillValue?: string;
  autofillAllowOverride?: boolean;

  // NEW: Cross-field validation (ruleType: 'cross_validation')
  crossValidation?: CrossValidationConfig;

  // NEW: Warning banner configuration (ruleType: 'warning')
  warningTitle?: string;
  warningMessage?: string;

  // User-facing explanation
  explanation?: string;
}

export interface UTMFieldState {
  fieldId: string;
  originalFieldType: 'dropdown' | 'string' | 'integer';
  currentFieldType: 'dropdown' | 'string' | 'integer';
  isVisible: boolean;
  isRequired: boolean;
  appliedRules: string[];
  hasConflict: boolean;
}

export interface AppConfig {
  fields: UTMField[];
  dependencies: DependencyRule[];
  version: number;
}

// Admin password is no longer part of AppConfig: config.json is served as a
// static asset (readable by anyone), so credentials live server-side only
// (see server.js ADMIN_PASSWORD_HASH).
export const DEFAULT_CONFIG: AppConfig = {
  version: 3,
  fields: [
    {
      id: "source",
      name: "utm_source",
      label: "Source",
      fieldType: "dropdown",
      options: ["google", "facebook", "email", "direct"],
      order: 1,
      isCustom: false,
    },
    {
      id: "medium",
      name: "utm_medium",
      label: "Medium",
      fieldType: "dropdown",
      options: ["cpc", "social", "email", "organic", "journey_builder"],
      order: 2,
      isCustom: false,
    },
    {
      id: "campaign",
      name: "utm_campaign",
      label: "Campaign",
      fieldType: "dropdown",
      options: [],
      order: 3,
      isCustom: false,
    },
    {
      id: "term",
      name: "utm_term",
      label: "Term",
      fieldType: "dropdown",
      options: [],
      order: 4,
      isCustom: false,
    },
    {
      id: "content",
      name: "utm_content",
      label: "Content",
      fieldType: "dropdown",
      options: [],
      order: 5,
      isCustom: false,
    },
  ],
  dependencies: [],
};
