# Tasks — Simplify the harness-extras integration

## 1. Code folds

- [x] 1.1 Hoist the duplicated sourcesMatch query in `packageInstallStatus` (one const, one Set scan per call)
- [x] 1.2 `cmdStatus` others filter reuses `isLegacySourceForPackage`
- [x] 1.3 `sourcesMatch` comment: drop the contradicting git sentence, keep the pin rationale

## 2. Self-deriving e2e

- [x] 2.1 `scripts/e2e-install.mjs` install-count assertions derive from `PACKAGES.length` (three hardcoded 12s gone)

## 3. Docs sweep completion

- [x] 3.1 `docs/faq.html` + `docs/docs/first-steps.html` enumerations extended to the 12-package set
- [x] 3.2 `docs/docs/index.html` core-row grammar fixed

## 4. Verification

- [x] 4.1 `npm test` green
- [x] 4.2 Local packed-CLI e2e green (proves derived counts)
- [x] 4.3 `openspec validate` green

## 5. Ship

- [x] 5.1 Archived (2026-08-29); `npm run spec:validate` green on master
- [ ] 5.2 Commit and push; CI green via dispatch (push events do not trigger Actions on this fork)