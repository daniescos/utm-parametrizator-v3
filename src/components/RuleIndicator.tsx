import { AlertCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';
import type { DependencyRule, RuleType } from '../lib/types';
import { translations } from '../lib/translations';

interface RuleIndicatorProps {
  rule: DependencyRule;
  sourceFieldLabel: string;
}

export function RuleIndicator({ rule, sourceFieldLabel }: RuleIndicatorProps) {
  const ruleType = rule.ruleType || 'filter';

  const getDefaultExplanation = (): string => {
    const ruleTypeLabel = translations.admin.ruleTypes[ruleType] || ruleType;

    switch (ruleType) {
      case 'filter':
        return `${ruleTypeLabel}: Este campo está restrito porque ${sourceFieldLabel} = "${rule.sourceValue}"`;
      case 'validation':
        return `${ruleTypeLabel}: Este campo deve seguir um padrão específico quando ${sourceFieldLabel} = "${rule.sourceValue}"`;
      case 'transform':
        return `${ruleTypeLabel}: O tipo deste campo muda para ${rule.transformTo?.fieldType} quando ${sourceFieldLabel} = "${rule.sourceValue}"`;
      case 'visibility':
        return `${ruleTypeLabel}: Este campo fica ${rule.visibilityAction === 'hide' ? 'oculto' : 'visível'} quando ${sourceFieldLabel} = "${rule.sourceValue}"`;
      case 'required':
        return `${ruleTypeLabel}: Este campo fica ${rule.requiredAction === 'make_required' ? 'obrigatório' : 'opcional'} quando ${sourceFieldLabel} = "${rule.sourceValue}"`;
      case 'autofill':
        return `${ruleTypeLabel}: Este campo é preenchido automaticamente com "${rule.autofillValue}" quando ${sourceFieldLabel} = "${rule.sourceValue}"`;
      case 'cross_validation':
        return `${ruleTypeLabel}: ${rule.explanation || 'Validação cruzada ativa'}`;
      case 'warning':
        return rule.explanation || rule.warningMessage || 'Aviso ativo';
      default:
        return `Regra ativa: ${sourceFieldLabel} = "${rule.sourceValue}"`;
    }
  };

  const explanation = rule.explanation || getDefaultExplanation();

  return (
    <Tooltip content={explanation}>
      <span className="badge rule" style={{ marginTop: 6, cursor: 'help' }}>
        <AlertCircle className="w-3 h-3" style={{ marginRight: 4 }} />
        {translations.admin.ruleTypes[ruleType as RuleType] || 'Regra ativa'}
      </span>
    </Tooltip>
  );
}
