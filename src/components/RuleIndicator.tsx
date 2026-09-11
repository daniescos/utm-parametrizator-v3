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

  // Color scheme for each rule type
  const getRuleTypeColor = (type: RuleType): { bg: string; text: string } => {
    switch (type) {
      case 'filter':
        return { bg: 'bg-blue-900/30', text: 'text-blue-400' };
      case 'validation':
        return { bg: 'bg-yellow-900/30', text: 'text-yellow-400' };
      case 'transform':
        return { bg: 'bg-cyan-900/30', text: 'text-cyan-400' };
      case 'visibility':
        return { bg: 'bg-purple-900/30', text: 'text-purple-400' };
      case 'required':
        return { bg: 'bg-red-900/30', text: 'text-red-400' };
      case 'autofill':
        return { bg: 'bg-green-900/30', text: 'text-green-400' };
      case 'cross_validation':
        return { bg: 'bg-orange-900/30', text: 'text-orange-400' };
      case 'warning':
        return { bg: 'bg-amber-900/30', text: 'text-amber-400' };
      default:
        return { bg: 'bg-gray-900/30', text: 'text-gray-400' };
    }
  };

  // Auto-generate explanation based on rule type
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
      default:
        return `Regra ativa: ${sourceFieldLabel} = "${rule.sourceValue}"`;
    }
  };

  const colors = getRuleTypeColor(ruleType);
  const explanation = rule.explanation || getDefaultExplanation();

  return (
    <Tooltip content={explanation}>
      <div className={`flex items-center gap-1 text-xs ${colors.text} mt-1 cursor-help ${colors.bg} px-2 py-1 rounded`}>
        <AlertCircle className="w-3 h-3" />
        <span>{translations.admin.ruleTypes[ruleType] || 'Regra ativa'}</span>
      </div>
    </Tooltip>
  );
}
