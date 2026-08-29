# Tasks — Release-ops reality: codify the actual release flow, cut dead spec

## 1. Research / audit

- [x] 1.1 Git history: release-please produced releases only through 0.6.4
      (`chore(master): release 0.6.4 (#75)`); 0.6.5→0.9.0 all manual
- [x] 1.2 Secrets audit: `gh secret list` empty — no `NPM_TOKEN`, so
      `npm publish --provenance` in the workflow cannot authenticate
- [x] 1.3 npm auth findings from the 0.9.0 cycle: E404 masks invalid
      tokens on scoped publish, ENEEDAUTH without any token, 2FA requires
      interactive OTP/device auth
- [x] 1.4 Spec cruft flagged: "Skill arguments source" scenario is a dead
      conditional (`skill-args` is Dropped, never cataloged); removal
      blocked by the OpenSpec scenario guard — flagged in exploration +
      proposal instead of fighting the validator

## 2. Spec delta

- [x] 2.1 ADDED `Requirement: Release Flow` (version-bump convention,
      interactive publish, token-expiry recovery, unprovisioned CI path)

## 3. Docs + agent contract

- [x] 3.1 README "Releasing" rewritten to the real manual process +
      automation gap (workflow needs `NPM_TOKEN` before it can publish)
- [x] 3.2 AGENTS.md: spec-delta discipline for PACKAGES/CLI/release
      changes (rg before skip_specs) + release checkpoint order
- [x] 3.3 Exploration `release-ops-audit.md` with the evidence

## 4. Validation

- [x] 4.1 `npm test` green (20/20)
- [x] 4.2 `npx openspec validate --changes` green; `openspec archive --yes`
- [x] 4.3 `npm run spec:validate` green (21/21 → 22/22)

## 5. Ship

- [x] 5.1 Fresh review of the diff
- [x] 5.2 Commit and push to the fork; CI green