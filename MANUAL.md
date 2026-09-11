# Manual — Como atualizar as regras de UTM

Esta ferramenta **não tem painel de admin**. Todas as regras (campos, opções de dropdown,
condicionais) ficam em um único arquivo: [`public/config.json`](./public/config.json).
Para mudar qualquer regra, você edita esse arquivo, testa localmente e publica com
`git commit` + `git push` — o GitHub Actions builda e coloca no ar sozinho em ~1-2 minutos.

Não precisa saber programar de verdade — é só seguir os padrões dos exemplos abaixo com
cuidado. O ponto mais importante: **é um arquivo JSON, então vírgulas e chaves `{}` `[]`
precisam fechar certinho** (peça pra IA revisar se tiver dúvida, ou use um validador
online tipo jsonlint.com antes de publicar).

## 1. Estrutura do arquivo

```json
{
  "version": 1,
  "fields": [ ... ],        // cada campo que aparece na tela
  "dependencies": [ ... ]   // regras que conectam campos entre si
}
```

## 2. Adicionar uma opção nova em um dropdown existente

Ache o campo pelo `"id"` em `fields` e adicione o valor na lista `"options"`. Exemplo —
adicionar um novo canal em Source:

```json
{
  "id": "source",
  "options": ["app_unificado", "app_residencial", "site_minhas", "dma", "cautivo", "totem", "NOVO_CANAL"],
  ...
}
```

**Convenção de valor:** sempre `snake_case` minúsculo, sem acento, sem espaço (é o que
vira o parâmetro na URL — precisa bater com o que GAM/PZN/Datorama já usam).

## 3. Criar um campo novo

Copie um campo parecido e ajuste. Exemplo de campo de texto livre simples:

```json
{
  "id": "meu_campo",
  "name": "utm_meu_campo",
  "label": "Meu Campo",
  "fieldType": "string",
  "options": [],
  "order": 55,
  "isCustom": true,
  "description": "Texto de ajuda mostrado no tooltip (ícone i)"
}
```

- `id`: identificador único (não pode repetir nenhum outro `id` do arquivo).
- `order`: número que define a posição na tela (menor aparece primeiro).
- `fieldType`: `"dropdown"` (lista), `"string"` (texto livre) ou `"integer"` (só número).
- `group` (opcional): se você quer que este campo se junte a outros num único parâmetro
  de URL (como Source+Estado+Cidade+Loja viram um só `utm_source`), coloque o mesmo
  `group` nos campos que devem se juntar. Sem `group`, o campo vira seu próprio parâmetro
  (usa o `name`).
- `defaultVisible: false` (opcional): campo começa escondido, só aparece quando uma regra
  de visibilidade (`"visibilityAction": "show"`) mandar mostrar.
- `defaultRequired: true` (opcional): campo é obrigatório sempre, a menos que uma regra
  `required` diga o contrário.

## 4. Regras (`dependencies`) — como funcionam

Toda regra tem essa base:

```json
{
  "id": "nome-unico-da-regra",
  "ruleType": "filter",
  "sourceField": "id_do_campo_gatilho",
  "sourceValue": "valor_que_ativa",
  "sourceCondition": "equals",
  "targetField": "id_do_campo_afetado"
}
```

Ou seja: "**quando** `sourceField` = `sourceValue`, **faz algo** em `targetField`". O que
esse "algo" é depende do `ruleType`:

### `filter` — restringe as opções de um dropdown
```json
{ "id": "ferramenta-por-source-dma", "ruleType": "filter", "sourceField": "source", "sourceValue": "dma",
  "targetField": "ferramenta", "targetFieldType": "dropdown", "allowedValues": ["gerenciador", "hardcode"] }
```
Se quiser condicionar por **dois** campos ao mesmo tempo (ex: Ferramenta E Formato juntos
definindo o Bloco), adicione `sourceField2`/`sourceValue2`:
```json
{ "id": "bloco-gam-banner", "ruleType": "filter", "sourceField": "formato", "sourceValue": "banner",
  "sourceField2": "ferramenta", "sourceValue2": "gam", "targetField": "bloco",
  "targetFieldType": "dropdown", "allowedValues": ["tp", "md", "ft"] }
```

### `visibility` — mostra ou esconde um campo
```json
{ "id": "totem-show-estado", "ruleType": "visibility", "sourceField": "source", "sourceValue": "totem",
  "targetField": "estado", "visibilityAction": "show" }
```
(o campo alvo precisa ter `"defaultVisible": false` pra isso funcionar como esperado)

### `required` — torna um campo obrigatório condicionalmente
```json
{ "id": "totem-require-estado", "ruleType": "required", "sourceField": "source", "sourceValue": "totem",
  "targetField": "estado", "requiredAction": "make_required" }
```

### `warning` — mostra um banner de aviso (não bloqueia nada)
```json
{ "id": "pzn-warning", "ruleType": "warning", "sourceField": "ferramenta", "sourceValue": "pzn",
  "targetField": "ferramenta", "warningTitle": "Atenção — Campanha PZN",
  "warningMessage": "Texto do aviso que aparece pro usuário." }
```

### `transform` — muda o tipo do campo (ex: vira texto livre com um padrão específico)
```json
{ "id": "jb-campaign-transform", "ruleType": "transform", "sourceField": "ferramenta", "sourceValue": "journey_builder",
  "targetField": "campaign", "targetFieldType": "dropdown",
  "transformTo": { "fieldType": "string", "stringConstraint": { "type": "pattern", "value": "^[a-z0-9_]+$" } } }
```

## 5. Validação própria de um campo (independente de regra)

Alguns campos têm uma validação fixa que não depende de outro campo — hoje só o **ID**
(aceita OS de 5 dígitos OU Affiliate ID alfanumérico):

```json
{ "id": "id", "pattern": "^(\\d{5}|[A-Za-z0-9]{4,20})$",
  "patternErrorMessage": "Informe a OS (5 dígitos) ou o Affiliate ID (alfanumérico)." }
```

## 6. Testar antes de publicar

```bash
npm install       # só na primeira vez
npm run dev
```

Abre em `http://localhost:5173`. Testa o fluxo que você mudou. Se `npm run build` passar
sem erro, o JSON tá válido:

```bash
npm run build
```

## 7. Publicar

```bash
git add public/config.json
git commit -m "regras: descreva o que mudou"
git push
```

O GitHub Actions builda e publica sozinho — acompanhe em
`https://github.com/daniescos/utm-parametrizator-v3/actions`. Em ~1-2 min a mudança
aparece no site.

## 8. Se precisar voltar a ter painel admin visual

Essa versão trocou o admin visual (login + botão "Salvar") por edição direta do JSON pra
poder rodar 100% grátis no GitHub Pages (sem servidor). Se no futuro precisar do painel
visual de novo, dá pra reativar: o código do admin panel + backend com autenticação real
existe no histórico do git (commit anterior a essa mudança) e pode rodar em qualquer host
que suporte Node (Render, Glitch etc). É só pedir.
