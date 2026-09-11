# UTM Parametrizator v3 (Claro)

Ferramenta de parametrização de links UTM para as campanhas da Claro — unifica as regras de negócio do
Parametrizator v1 (desktop) com a taxonomia usada no v2 (web), 100% estática (sem backend/custo), no ar via
GitHub Pages, mesmo modelo do [plan-type-parametrizador](https://github.com/daniescos/PLAN_TYPE-Parametrizador).

**No ar em:** https://daniescos.github.io/utm-parametrizator-v3/

## Features

✅ **Sem login** — qualquer um do ambiente Claro gera link na hora
✅ **Dropdowns condicionais** — hierarquia completa (ferramenta→formato→bloco, totem estado→cidade→loja, DMA, PZN/Journey Builder)
✅ **Copiar link** com um clique
✅ **Tema Claro** — vermelho `#E63027`, fontes Barlow/Barlow Condensed
✅ **Responsivo**

Não tem painel de admin visual. As regras (dropdowns, condicionais) ficam em
[`public/config.json`](./public/config.json) e são editadas direto no repositório — veja
**[MANUAL.md](./MANUAL.md)** para o passo a passo.

## O que é público

Esse repositório é público (exigência do GitHub Pages gratuito). Isso expõe o
**código-fonte e a estrutura/taxonomia das regras de UTM** (nomes de ferramentas, formatos,
canais, categorias de campanha) — não expõe dados de campanhas reais nem nada sensível de
cliente. Se algum valor específico não puder ficar público, avise antes de publicar uma
mudança em `config.json`.

## Quick Start (rodar local)

```bash
npm install
npm run dev
```

Abre em http://localhost:5173.

## Tech Stack

- **React 19** + TypeScript
- **Vite 7**
- **Tailwind CSS**
- **Lucide React** (ícones)
- Zero backend — `public/config.json` é a fonte única de verdade, lido direto pelo browser

## Deploy

Automático via GitHub Actions a cada push em `main`. Detalhes em [DEPLOY.md](./DEPLOY.md).

## Documentação

- [MANUAL.md](./MANUAL.md) — como atualizar regras de UTM (substitui o admin panel)
- [DEPLOY.md](./DEPLOY.md) — como o deploy funciona / como reverter
- [SETUP.md](./SETUP.md) — troubleshooting de instalação local
