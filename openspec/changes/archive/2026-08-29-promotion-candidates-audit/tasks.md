# Tasks — Promotion candidates audit: pi-lsp, interactive-shell, autoresearch

## 1. Research

- [x] 1.1 `@narumitw/pi-lsp`: npm metadata, README, release cadence
      (0.49.6 · 2026-08-26), author family (btw, goal), install target
- [x] 1.2 `pi-interactive-shell`: npm currency (0.15.1 · 2026-08-26),
      operator usage (auth/overlay flows)
- [x] 1.3 `davebcn87/pi-autoresearch`: repo activity (pushed 2026-07-15),
      unpinned git source, dropped-list alignment

## 2. Grounded installation

- [x] 2.1 `pi install npm:@narumitw/pi-lsp` on the operator's install;
      confirmed in settings + `pi list`
- [x] 2.2 node-pty install-script gate assessed: prebuilt bindings verified
      at runtime (`build/Release/pty.node` + PTY spawn probe succeeds)

## 3. Evaluation

- [x] 3.1 Verdicts against Catalog membership criteria: pi-lsp conditional
      (fails only demonstrated-use), interactive-shell dropped
      (re-confirmed), autoresearch dropped (re-confirmed)
- [x] 3.2 Exploration record `promotion-candidates-audit.md` written

## 4. Spec + docs

- [x] 4.1 Catalog membership scenario gains evidence floors (installed-and-
      exercised, maintenance currency, native-binding runtime path)
- [x] 4.2 `docs/docs/index.html` extras table gains the LSP row

## 5. Validation

- [x] 5.1 `npx openspec validate --changes` green
- [x] 5.2 `npx openspec archive <name> --yes` merges the delta
- [x] 5.3 `npm run spec:validate` green

## 6. Ship

- [x] 6.1 Fresh review of the diff
- [x] 6.2 Commit and push to the fork; CI green