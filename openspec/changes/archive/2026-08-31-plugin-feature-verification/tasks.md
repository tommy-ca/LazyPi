# Tasks — Verify the refreshed catalog plugins

## 1. Static verification

- [x] 1.1 All 17 catalog packages: package.json + pi manifest present at
  the store root at the refreshed versions
- [x] 1.2 Dependency footprint: declared deps present at the store root
  (nested or hoisted; verified by filesystem check)

## 2. Fresh-session functional verification

- [x] 2.1 Spawned fresh pi session reports per-package verdicts for the 8
  refreshed/audited packages (registration + self-check/tools)
- [x] 2.2 Any failure captured verbatim into the exploration

## 3. Record

- [x] 3.1 Exploration `plugin-feature-verification.md` with verdict table
- [x] 3.2 CHANGELOG entry
- [x] 3.3 Archive with `skip_specs: true`; `npm run spec:validate` green;
  `npm test` green
- [x] 3.4 Conventional commit

Landed under conventional commits (docs for the verification record).
