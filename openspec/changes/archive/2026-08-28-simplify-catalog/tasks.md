# Tasks — Simplify Catalog and Fork as @tommy-ca/lazypi

## 1. Catalog and installer

- [x] 1.1 Re-categorize to core/tools/research/themes and define the 18-package catalog in `bin/lazypi.mjs`
- [x] 1.2 Drop compound, todos, powerbar, extension-settings, plannotator, slopchop, usage, raw-paste, autoresearch
- [x] 1.3 Add goal (`@narumitw/pi-goal`) and context-usage (`pi-context-usage`)
- [x] 1.4 Remove compound machinery (constants, manifest/legacy state, install/remove paths, doctor section, bun check, dependency map) and the package load-order repair

## 2. CI and tests

- [x] 2.1 Remove COMPOUND_ID exclusion from `scripts/assert-installed-packages.mjs`
- [x] 2.2 Delete `test/compound-migration.test.mjs` and `test/load-order.test.mjs`; update agent-dir, assert-installed-packages, and ci-workflows expectations
- [x] 2.3 Drop the bun step from `test.yml`; collapse `windows-smoke.yml` to one job; gate `release-please.yml` to `workflow_dispatch`
- [x] 2.4 `npm test` green (21/21) and packed CLI smoke green

## 3. Fork identity and docs

- [x] 3.1 Rename npm package to `@tommy-ca/lazypi` (package.json, help text, README, docs references)
- [x] 3.2 Remove `docs/CNAME`; trim docs site to the catalog (drop 9 package pages, rechain prev/next, add Goal + Context Usage pages, update landing grid)
- [x] 3.3 Push to the fork `tommy-ca/LazyPi` and validate CI (verified 18 expected sources)
- [x] 3.4 Migrate `planning/` docs into the OpenSpec tree