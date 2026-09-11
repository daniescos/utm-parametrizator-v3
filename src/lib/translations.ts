// Portuguese (Brazil) translations for UTM Generator
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

  // AdminPanel Component
  admin: {
    title: 'Painel Administrativo',
    subtitle: 'Configure campos UTM e dependências',
    logout: 'Sair',
    saveChanges: 'Salvar Todas as Alterações',

    tabs: {
      fields: 'Campos',
      options: 'Opções',
      dependencies: 'Dependências',
      config: 'Configurações',
    },

    // Fields Tab
    addCustomField: 'Adicionar Campo Personalizado',
    fieldName: 'Nome do Campo (parâmetro UTM)',
    fieldNamePlaceholder: 'ex: utm_custom',
    displayLabel: 'Rótulo de Exibição',
    displayLabelPlaceholder: 'ex: Campo Personalizado',
    fieldType: 'Tipo de Campo',
    fieldTypeDropdown: 'Dropdown (selecionar entre opções)',
    fieldTypeString: 'Entrada de Texto (texto livre)',
    fieldTypeInteger: 'Entrada de Número (apenas inteiros)',
    description: 'Descrição (para tooltip)',
    descriptionPlaceholder: 'Descrição que aparecerá ao passar o mouse sobre o ícone ℹ️',
    addField: 'Adicionar Campo',
    saveChangesField: 'Salvar Alterações',
    cancel: 'Cancelar',
    deleteField: 'Deletar campo',
    editField: 'Editar campo',
    cannotDeleteStandardField: 'Não é possível deletar campos UTM padrão',
    fieldUpdatedSuccessfully: 'Campo atualizado com sucesso!',

    // Options Tab
    selectField: 'Selecionar Campo',
    chooseField: 'Escolha um campo...',
    options: 'Opções (uma por linha)',
    optionsPlaceholder: 'Opção 1\nOpção 2\nOpção 3',
    saveOptions: 'Salvar Opções',
    optionsUpdated: 'Opções atualizadas!',
    noteNonDropdownField: 'Nota: Este campo é do tipo {fieldType} e não usa opções. Opções são usadas apenas em campos dropdown.',

    // Dependencies Tab
    addDependencyRule: 'Adicionar Regra de Dependência',
    ifField: 'Se Campo',
    selectSourceField: 'Selecionar campo...',
    equals: 'Igual a',
    selectValue: 'Selecionar valor...',
    thenLimitField: 'Então Limitar Campo',
    toTheseValues: 'Para Estes Valores (uma por linha)',
    addRule: 'Adicionar Regra',
    deleteDependency: 'Deletar regra',
    allDependencyFieldsRequired: 'Todos os campos de dependência são obrigatórios',
    dependencyAddedSuccessfully: 'Regra de dependência adicionada com sucesso!',

    // Rule Types
    selectRuleType: 'Selecione o tipo de regra',
    ruleType: 'Tipo de Regra',
    ruleTypes: {
      filter: 'Filtrar Opções (Dropdown)',
      validation: 'Validar String',
      transform: 'Transformar Tipo de Campo',
      visibility: 'Mostrar/Ocultar Campo',
      required: 'Campo Obrigatório',
      autofill: 'Preencher Automaticamente',
      cross_validation: 'Validação Cruzada',
      warning: 'Exibir Aviso',
    },

    // Rule Type Descriptions
    ruleTypeDescriptions: {
      filter: 'Restringe opções disponíveis em dropdown baseado em seleção',
      validation: 'Valida entrada de string contra restrições (padrão, comprimento, etc)',
      transform: 'Transforma dinamicamente o tipo de campo (dropdown ↔ string)',
      visibility: 'Mostra ou oculta campo baseado em condição',
      required: 'Torna campo obrigatório ou opcional condicionalmente',
      autofill: 'Preenche automaticamente campo com valor sugerido',
      cross_validation: 'Valida relacionamento entre múltiplos campos',
      warning: 'Exibe um banner de aviso não-bloqueante (ex: regras PZN/Journey Builder)',
    },

    // Rule Configuration
    priority: 'Prioridade',
    priorityHelp: 'Maior prioridade = aplicada primeiro (0-100)',
    sourceCondition: 'Tipo de Condição',
    sourceConditionTypes: {
      equals: 'Igual a',
      not_equals: 'Diferente de',
      in: 'Um de',
      not_in: 'Nenhum de',
    },

    // Transform Configuration
    transformFieldType: 'Transformar campo para tipo',
    clearValueOnTransform: 'Limpar valor ao transformar',
    addValidationToString: 'Adicionar validação de string? (opcional)',

    // Visibility Configuration
    visibilityAction: 'Ação',
    hideField: 'Ocultar campo',
    showField: 'Mostrar campo',

    // Required Configuration
    requiredAction: 'Ação',
    makeRequired: 'Tornar obrigatório',
    makeOptional: 'Tornar opcional',

    // Autofill Configuration
    autofillValueLabel: 'Valor para preencher',
    allowUserToOverride: 'Permitir que usuário altere o valor',

    // Cross-validation Configuration
    validationRuleDescription: 'Descrição da regra',
    allowedCombinations: 'Combinações permitidas',
    addCombination: 'Adicionar combinação',

    // String Constraints
    selectAllowedValues: 'Selecionar Valores Permitidos',
    selectedValues: 'Valores selecionados',
    stringConstraintType: 'Tipo de Restrição',
    selectConstraintType: 'Selecionar tipo...',
    matchesPattern: 'Corresponde ao padrão (regex)',
    contains: 'Contém',
    startsWith: 'Começa com',
    endsWith: 'Termina com',
    exactlyEquals: 'É exatamente',
    minLength: 'Comprimento mínimo',
    maxLength: 'Comprimento máximo',
    caseSensitive: 'Diferenciar maiúsculas/minúsculas',
    constraintValue: 'Valor da Restrição',

    // Rule Explanation
    ruleExplanation: 'Explicação da Regra',
    optional: 'opcional',
    ruleExplanationPlaceholder: 'ex: Campanhas de email devem seguir nosso padrão de nomenclatura',
    ruleExplanationHelp: 'Esta mensagem será mostrada aos usuários quando a regra estiver ativa',

    // Config Tab
    changeAdminPassword: 'Alterar Senha do Admin',
    newPassword: 'Nova senha',
    updatePassword: 'Atualizar Senha',
    passwordUpdated: 'Senha atualizada!',
    configuration: 'Configuração',
    exportConfig: 'Exportar Configuração',
    importConfig: 'Importar Configuração',
    configurationImportedSuccessfully: 'Configuração importada com sucesso!',
    exportConfigGlobal: 'Salvar Configuração Global',
    saveConfigGlobalHelp: 'Baixe sua configuração atual e substitua o arquivo public/config.json no repositório para compartilhar com todos os usuários',
    configGlobalInstructions: 'Instruções:\n1. Clique no botão abaixo para fazer download\n2. Vá para seu repositório GitHub\n3. Substitua o arquivo public/config.json\n4. Faça commit e push\n5. O Render fará redeploy automaticamente\n6. Todos os usuários verão a nova configuração!',
    dangerousActions: 'Ações Perigosas',
    resetToDefaults: 'Restaurar Padrões',
    resetConfirmation: 'Restaurar para configuração padrão? Esta ação não pode ser desfeita.',
    configurationResetToDefaults: 'Configuração restaurada para os padrões',

    // Messages
    errorMessages: {
      fieldNameAndLabelRequired: 'Nome do campo e rótulo são obrigatórios',
      passwordCannotBeEmpty: 'A senha não pode estar vazia',
      importFailed: 'Falha ao importar',
    },

    successMessages: {
      configurationSavedSuccessfully: 'Configuração salva com sucesso! Todos os usuários verão estas mudanças quando acessarem a plataforma.',
    },

    versioningInfo: {
      title: 'Sincronização de Configuração',
      description: 'Quando você clica em "Salvar Todas as Alterações", a versão da configuração é incrementada automaticamente. Isso avisa a todos os usuários que existe uma nova versão e eles receberão a configuração atualizada no próximo acesso.',
      howItWorks: 'Como funciona: (1) Admin faz alterações → (2) Clica "Salvar" → Versão incrementa → (3) Usuários acessam plataforma → (4) Detectam versão diferente → (5) Carregam configuração global atualizada',
    },
  },

  // PasswordGuard Component
  passwordGuard: {
    title: 'Acesso Administrativo',
    subtitle: 'Digite a senha para gerenciar configurações UTM',
    passwordPlaceholder: 'Digite a senha',
    unlock: 'Acessar Painel',
    invalidPassword: 'Senha inválida',
  },

  // App Component
  app: {
    admin: 'Admin',
  },
};
