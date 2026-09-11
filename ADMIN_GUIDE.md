# Guia do Administrador - UTM Generator

## 📋 Visão Geral

O UTM Generator é uma plataforma para criar e gerenciar parâmetros UTM com regras de dependência avançadas. Este guia explica como usar o painel administrativo para configurar campos, dependências e sincronizar mudanças com todos os usuários.

---

## 🔐 Acessando o Painel Administrativo

1. Acesse a plataforma UTM Generator
2. Clique no botão **"Admin"** no canto inferior esquerdo
3. Digite a **senha do administrador**
4. Clique em **"Acessar Painel"**

Você será redirecionado para o painel administrativo com 4 abas principais:
- **Campos**: Gerenciar campos UTM
- **Opções**: Editar opções de dropdowns
- **Dependências**: Criar e gerenciar regras
- **Configurações**: Sincronizar configuração global

---

## 📝 Gerenciando Campos UTM

### Adicionando um Campo Personalizado

1. Vá para a aba **"Campos"**
2. Clique em **"Adicionar Campo Personalizado"**
3. Preencha:
   - **Nome do Campo**: Nome técnico do parâmetro (ex: `utm_custom`)
   - **Rótulo de Exibição**: Texto mostrado aos usuários (ex: "Campanha Especial")
   - **Tipo de Campo**:
     - `Dropdown`: Seleção entre opções pré-definidas
     - `Entrada de Texto`: Texto livre
     - `Entrada de Número`: Apenas números
   - **Descrição** (opcional): Tooltip informativo
4. Clique em **"Adicionar Campo"**

### Editando um Campo

1. Vá para a aba **"Campos"**
2. Encontre o campo na lista
3. Clique no ícone de edição (✏️)
4. Altere os dados conforme necessário
5. Clique em **"Salvar Alterações"**

### Deletando um Campo

**⚠️ Aviso:** Apenas campos personalizados podem ser deletados. Campos UTM padrão não podem ser removidos.

1. Vá para a aba **"Campos"**
2. Encontre o campo personalizado
3. Clique no ícone de lixeira (🗑️)
4. O campo será deletado imediatamente

---

## 🎯 Gerenciando Opções

### Editando Opções de um Dropdown

1. Vá para a aba **"Opções"**
2. Selecione o campo dropdown na lista
3. Na caixa de texto, digite as opções (uma por linha):
   ```
   opção_1
   opção_2
   opção_3
   ```
4. Clique em **"Salvar Opções"**

**Exemplo:**
```
sms
rcs
push
email
whatsapp
```

---

## 🔗 Criando Regras de Dependência

### O que são Regras de Dependência?

Regras definem comportamentos condicionais entre campos. Por exemplo:
- "Se Source = email, então Campaign deve ser um texto livre"
- "Se Medium = journey_builder, ocultar o campo Content"
- "Se Source = email, tornar o campo Campaign obrigatório"

### Tipos de Regras Disponíveis

#### 1. **Filtrar Opções (Dropdown)**
Restringe as opções disponíveis em um dropdown baseado na seleção de outro campo.

**Exemplo:** Se `medium = journey_builder`, mostrar apenas campanhas específicas no campo `campaign`.

#### 2. **Validar String**
Valida a entrada de um campo de texto contra restrições (padrão regex, comprimento, etc).

**Exemplo:** Se `source = email`, o campo `campaign` deve seguir o padrão `^[a-z0-9_]+$`.

**Tipos de validação:**
- `Corresponde ao padrão (regex)`: Valida contra expressão regular
- `Contém`: Deve conter a string
- `Começa com`: Começa com a string
- `Termina com`: Termina com a string
- `É exatamente`: Valor exato
- `Comprimento mínimo`: Mínimo de caracteres
- `Comprimento máximo`: Máximo de caracteres

#### 3. **Transformar Tipo de Campo** ⭐ (Uso Principal)
Transforma dinamicamente um campo de dropdown para texto livre (ou vice-versa).

**Exemplo:**
- Quando `medium = journey_builder`, o campo `campaign` muda de dropdown para texto livre
- Quando muda para outro valor, volta a ser dropdown
- O valor anteriormente digitado é limpo automaticamente

#### 4. **Mostrar/Ocultar Campo**
Exibe ou oculta um campo condicionalmente.

**Exemplo:** Se `source ≠ email`, ocultar o campo `email_template`.

#### 5. **Campo Obrigatório**
Torna um campo obrigatório ou opcional condicionalmente.

**Exemplo:** Se `source = email`, tornar o campo `campaign` obrigatório.

#### 6. **Preencher Automaticamente**
Preenche automaticamente um campo com um valor sugerido.

**Exemplo:** Se `source = email`, preencher `medium` com "email" automaticamente (usuário pode alterar).

#### 7. **Validação Cruzada**
Valida relacionamento entre múltiplos campos.

**Exemplo:** Se `source = email`, então `medium` deve ser um dos valores: ["email", "newsletter"].

---

### Passo a Passo: Criar uma Regra de Transformação (Caso Principal)

**Objetivo:** Quando `medium = journey_builder`, transformar `campaign` de dropdown para texto livre com validação.

1. Vá para a aba **"Dependências"**
2. Clique em **"Adicionar Regra de Dependência"**
3. Preencha:
   - **Tipo de Regra**: `Transformar Tipo de Campo`
   - **Se Campo**: `Medium` (ou qual campo é a condição)
   - **Igual a**: `journey_builder` (valor que dispara a regra)
   - **Então Limitar Campo**: `Campaign` (campo que será transformado)
   - **Transformar campo para tipo**: `String (Texto Livre)`
   - **Prioridade**: `100` (maior = aplicada primeiro)
   - **Explicação** (opcional): "Campanhas do Journey Builder usam nomenclatura livre"

4. **Adicionar Validação Opcional** (recomendado):
   - Campo será transformado para texto
   - Você pode adicionar validação: "Deve seguir padrão ^[a-z0-9_]+$"
   - Isso garante que usuários digitam valores corretos

5. Clique em **"Adicionar Regra"**

---

### Passo a Passo: Criar uma Regra de Filtro

**Objetivo:** Se `source = sms`, mostrar apenas campanhas específicas no dropdown de `campaign`.

1. Vá para a aba **"Dependências"**
2. Clique em **"Adicionar Regra de Dependência"**
3. Preencha:
   - **Tipo de Regra**: `Filtrar Opções (Dropdown)`
   - **Se Campo**: `Source`
   - **Igual a**: `sms`
   - **Então Limitar Campo**: `Campaign`
   - **Selecionar Valores Permitidos**: Selecione as opções que devem aparecer
   - **Prioridade**: `50`
   - **Explicação** (opcional): "Campanhas SMS têm limitações"

4. Clique em **"Adicionar Regra"**

---

## 💾 Sincronizando Configuração com Todos os Usuários

### ⚠️ Importante: Como Funciona a Sincronização

Quando você faz alterações no painel admin (campos, opções, regras), **elas são salvas apenas em seu navegador (localStorage)** até você clicar em **"Salvar Todas as Alterações"**.

Ao clicar em "Salvar":
1. ✅ Configuração é salva no seu navegador
2. ✅ **Versão é incrementada automaticamente**
3. ✅ Todos os outros usuários detectam a versão diferente
4. ✅ Ao próximo acesso, carregam a nova configuração

### 📋 Passo a Passo: Salvar e Sincronizar Alterações

1. **Faça todas as alterações necessárias:**
   - Adicione/edite/delete campos
   - Atualize opções de dropdowns
   - Crie/edite/delete regras de dependência
   - Altere senha do admin se necessário

2. **Clique em "Salvar Todas as Alterações"** (botão vermelho, canto inferior direito)

3. **Verá a mensagem:**
   > "Configuração salva com sucesso! Todos os usuários verão estas mudanças quando acessarem a plataforma."

4. **Todos os usuários receberão a atualização:**
   - Na próxima vez que acessarem a plataforma
   - Ou ao recarregar a página (F5 / Ctrl+R)
   - A versão será detectada e a nova configuração carregada

### 🔍 Monitorando a Versão

Na aba **"Configurações"**, você verá:
```
Versão atual da configuração: 5
```

Cada vez que clica em "Salvar", este número incrementa:
- Versão 1 → 2 → 3 → 4 → 5 → etc.

Esta versão é a chave para sincronizar com todos os usuários.

---

## ⚙️ Gerenciando Configuração Global (Repositório)

### Exportar Configuração para GitHub

Se você quiser **fazer backup permanente** ou **manter todas as máquinas sincronizadas**:

1. Vá para a aba **"Configurações"**
2. Clique em **"Salvar Configuração Global"** (botão verde)
3. Um arquivo `config.json` será baixado para seu computador
4. **Commit e push para o repositório:**
   ```bash
   git add public/config.json
   git commit -m "Update config: add new rules and fields"
   git push
   ```
5. O servidor (Render) fará redeploy automaticamente
6. Todos os usuários receberão a nova configuração

### Importar Configuração

Para carregar um arquivo `config.json` anterior:

1. Vá para a aba **"Configurações"**
2. Clique em **"Importar Configuração"**
3. Selecione o arquivo JSON
4. A configuração será carregada
5. Clique em **"Salvar Todas as Alterações"** para sincronizar

---

## 🔒 Segurança: Alterando Senha do Admin

1. Vá para a aba **"Configurações"**
2. Seção "Alterar Senha do Admin"
3. Digite a **nova senha**
4. Clique em **"Atualizar Senha"**
5. Clique em **"Salvar Todas as Alterações"**

**⚠️ Aviso:** Todos os usuários receberão a nova senha ao próximo acesso. Compartilhe com segurança.

---

## 🚨 Ações Perigosas

### Restaurar Padrões

**⚠️ AVISO: Esta ação não pode ser desfeita!**

Restaura TODA a configuração para o padrão original:
- Remove todos os campos personalizados
- Remove todas as opções customizadas
- Remove todas as regras de dependência

Apenas use se tiver certeza e se tiver um backup da configuração anterior.

1. Vá para a aba **"Configurações"**
2. Seção "Ações Perigosas"
3. Clique em **"Restaurar Padrões"**
4. Confirme a ação
5. Clique em **"Salvar Todas as Alterações"**

---

## 📊 Exemplos de Fluxo Completo

### Exemplo 1: Adicionar Novo Campo de Campanha

**Objetivo:** Adicionar um campo personalizado para campanhas do Journey Builder.

**Passos:**

1. **Adicionar campo:**
   - Aba: Campos
   - Nome: `utm_jb_campaign`
   - Rótulo: "Campanha JB"
   - Tipo: Texto Livre
   - Descrição: "Use nomenclatura lowercase com underscore"

2. **Criar regra de transformação:**
   - Aba: Dependências
   - Tipo: Transformar Tipo de Campo
   - Se: `medium = journey_builder`
   - Então: `campaign` → String
   - Validação: `^[a-z0-9_]+$`
   - Prioridade: 100

3. **Salvar:**
   - Clique "Salvar Todas as Alterações"
   - Todos os usuários receberão a atualização

### Exemplo 2: Implementar Fluxo de Email Marketing

**Objetivo:** Quando fonte é email, tornar campaign obrigatório e preencher medium automaticamente.

**Passos:**

1. **Regra 1 - Autofill:**
   - Tipo: Preencher Automaticamente
   - Se: `source = email`
   - Então: `medium` = "email"
   - Permitir override: ✅ Sim

2. **Regra 2 - Obrigatoriedade:**
   - Tipo: Campo Obrigatório
   - Se: `source = email`
   - Então: `campaign` → Obrigatório
   - Prioridade: 60

3. **Regra 3 - Validação:**
   - Tipo: Validar String
   - Se: `source = email`
   - Então: `campaign` → Padrão: `^[a-z0-9_]+$`
   - Prioridade: 50

4. **Salvar:**
   - Clique "Salvar Todas as Alterações"
   - Versão incrementa (ex: 3 → 4)
   - Usuários receberão atualização

---

## 🐛 Troubleshooting

### Problema: Usuários não veem minhas mudanças

**Causa provável:** Você esqueceu de clicar em "Salvar Todas as Alterações"

**Solução:**
1. Clique em **"Salvar Todas as Alterações"** (botão vermelho, canto inferior direito)
2. Peça aos usuários para recarregar a página (F5 / Ctrl+R)
3. Verifique se versão foi incrementada (aba Configurações)

### Problema: Campo sumiu para alguns usuários

**Causa provável:** Versão desincronizada

**Solução:**
1. Vá para aba **"Configurações"**
2. Clique em **"Exportar Configuração"** (fazer backup)
3. Clique em **"Salvar Todas as Alterações"** novamente
4. Peça aos usuários para limpar cache (Ctrl+Shift+Delete) e recarregar

### Problema: Regra não está funcionando

**Verificar:**
1. A regra foi criada? (Aba Dependências, lista de regras)
2. Clicou em "Salvar Todas as Alterações"?
3. A condição está correta? (ex: `medium = journey_builder`)
4. O campo alvo é o correto?
5. Validar prioridade (maior = aplicada primeiro)

**Debug:** Testar na aba do usuário e verificar se a regra aparece com tooltip.

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique este guia
2. Faça um export da configuração (backup)
3. Verifique a versão (aba Configurações)
4. Tente "Salvar Todas as Alterações" novamente

---

## 📚 Conceitos Importantes

### Campo vs. Parâmetro

- **Campo**: Elemento visual no formulário (ex: "Source", "Campaign")
- **Parâmetro UTM**: Nome técnico na URL (ex: `utm_source`, `utm_campaign`)

### Dropdown vs. Texto Livre

- **Dropdown**: Seleção entre opções pré-definidas, restritivo
- **Texto Livre**: Usuário digita qualquer valor, flexível

### Prioridade de Regras

Se múltiplas regras afetam o mesmo campo:
- Maior prioridade é aplicada primeiro
- Recomendado: 0-100 (0 = menor, 100 = maior)
- Default: 50

### Sincronização Automática

- Alterações são salvas **localmente** até clicar "Salvar"
- Ao clicar "Salvar", versão **incrementa**
- Versão diferente = aviso para recarregar config
- Usuários receberão atualização no próximo acesso

---

## ✅ Checklist para Implementar Novo Sistema

1. ☐ Criar campos necessários (Aba: Campos)
2. ☐ Adicionar opções (Aba: Opções)
3. ☐ Criar regras de dependência (Aba: Dependências)
4. ☐ Testar regras na aba de usuário
5. ☐ Clicar "Salvar Todas as Alterações"
6. ☐ Verificar versão incrementou
7. ☐ Comunicar aos usuários
8. ☐ Fazer backup (Export em Configurações)

---

**Versão:** 1.0
**Data:** 2026-02-11
**Autor:** UTM Generator Admin Team
