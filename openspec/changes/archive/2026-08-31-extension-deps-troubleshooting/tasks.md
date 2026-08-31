# Tasks — Troubleshooting docs for broken extension dependency footprints

## 1. Exploration record

- [x] 1.1 `openspec/explorations/extension-deps-audit.md` written with the
  evidence chain and residual risk

## 2. Spec delta

- [x] 2.1 Installer `Troubleshooting` requirement ADDED delta
- [x] 2.2 `npx openspec validate 2026-08-31-extension-deps-troubleshooting`
  green

## 3. Docs

- [x] 3.1 FAQ repair item added
- [x] 3.2 `updating.html` "Repairing a broken package" section added
- [x] 3.3 Both pages contain the new sections

## 4. Land

- [x] 4.1 `npx openspec archive 2026-08-31-extension-deps-troubleshooting --yes`
- [x] 4.2 `npm run spec:validate` green after archive
- [x] 4.3 `npm test` green after archive (41/41)

Landed under conventional commits (docs + spec change).