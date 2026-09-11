# Deployment Guide — GitHub Pages

This app is fully static (no backend) and deploys for free on GitHub Pages, the same
way as [plan-type-parametrizador](https://github.com/daniescos/PLAN_TYPE-Parametrizador).

## How it works

1. `.github/workflows/deploy.yml` runs on every push to `main`: `npm ci && npm run build`,
   then publishes the `dist/` folder to GitHub Pages.
2. GitHub Pages free tier requires the repository to be **public** (private Pages needs a
   paid GitHub plan). `public/config.json` (the UTM rules) is part of that public build —
   see the README's "What's public" note.

## One-time setup (already done for this repo)

1. Repository → **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. `vite.config.ts` has `base: '/utm-parametrizator-v3/'` (must match the repo name,
   since GitHub Pages serves project sites under that subpath).

If you ever fork/rename the repo, update `base` in `vite.config.ts` to match the new name.

## Publishing a change

```bash
git add -A
git commit -m "sua mensagem"
git push
```

Watch the build at `https://github.com/daniescos/utm-parametrizator-v3/actions`. Live in
~1-2 minutes at `https://daniescos.github.io/utm-parametrizator-v3/`.

## Updating UTM rules specifically

See [MANUAL.md](./MANUAL.md) — no code knowledge required beyond editing
`public/config.json` and following the examples there.

## Rolling back a bad deploy

```bash
git revert <commit-sha>
git push
```

The workflow rebuilds and republishes automatically.
