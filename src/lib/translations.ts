// Portuguese (Brazil) translations for UTM Parametrizator
export const translations = {
  // UserGenerator Component
  generator: {
    title: 'Gerador de Links UTM',
    subtitle: 'Gere parâmetros UTM formatados corretamente',
    baseUrl: 'URL Base',
    baseUrlPlaceholder: 'https://example.com',
    utmParameters: 'Parâmetros UTM',
    generatedUrl: 'URL Gerada',
    copyButton: 'Copiar',
    copiedMessage: 'Copiado para área de transferência!',
    selectFieldPlaceholder: (fieldLabel: string) => `Selecione ${fieldLabel}...`,
    enterFieldPlaceholder: (fieldLabel: string) => `Digite ${fieldLabel}...`,
  },

  // Labels for active-rule badges shown inline on the generator (RuleIndicator)
  admin: {
    ruleTypes: {
      filter: 'Filtrar Opções (Dropdown)',
      validation: 'Validar String',
      transform: 'Transformar Tipo de Campo',
      visibility: 'Mostrar/Ocultar Campo',
      required: 'Campo Obrigatório',
      autofill: 'Preencher Automaticamente',
      cross_validation: 'Validação Cruzada',
      warning: 'Aviso',
    },
  },
};
