# Tasks — Release-ops polish: --version, CI e2e, bunx staleness docs

## 1. Collect (done)

- [x] 1.1 Audit finding: no `--version` (stale-cache runs indistinguishable from current release)
- [x] 1.2 Audit finding: packed-CLI e2e harness not wired into CI
- [x] 1.3 Audit finding: bunx dist-tag cache staleness undocumented

## 2. Code

- [x] 2.1 Add `-V/--version` (runtime read of package.json version; help text updated)
- [x] 2.2 Add `node scripts/e2e-install.mjs` step to the CI test workflow
- [x] 2.3 README Troubleshooting + docs/faq.html bunx-cache note
- [x] 2.4 `npm test` green; `node scripts/e2e-install.mjs` green locally

## 3. Spec delta

- [x] 3.1 Commands: "Version flag" scenario
- [x] 3.2 Self-Deriving CI: "E2E regression" scenario
- [x] 3.3 `npm run spec:validate` green

## 4. Close out

- [x] 4.1 Archive the change (deltas applied to main specs)
- [x] 4.2 Commit and push