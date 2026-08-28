# Simplify Catalog and Fork as @tommy-ca/lazypi

## Why

The upstream catalog shipped 25 packages including a checkbox todo list (an
explicit anti-pattern in the harness spec), two unpinned git heads, and
Compound Engineering — the most complex code path in the installer (bun
dependency, manifest/legacy state machinery, doctor/install/remove
special-cases, package dependency map, load-order repair for
extension-settings/powerbar). The operator's harness philosophy (3 layers,
≈10-package control plane) and the repo audit called for a lean, owned fork.

## What Changes

- Catalog reduced 25 → 18 packages across new categories
  `core / tools / research / themes`.
- Dropped: compound, todos, powerbar, extension-settings, plannotator,
  slopchop, usage, raw-paste, autoresearch.
- Added: `goal` (`npm:@narumitw/pi-goal`, long-objective gate replacing the
  checkbox todo) and `context-usage` (`npm:pi-context-usage`, context budget
  replacing the usage dashboard).
- Installer shed the compound machinery, the dependency map, and the package
  load-order repair (~425 lines). Doctor's bun check and compound health
  section removed.
- npm package renamed to `@tommy-ca/lazypi` (`package.json`, help text,
  README, docs). Release-please gated to manual. `docs/CNAME` removed (fork
  does not own lazypi.org).
- Planning docs migrated into the OpenSpec tree.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: catalog model, dropped-package exclusion, bun absence
- `harness/control-plane`: control-plane catalog (goal + context budget
  adopted, checkbox-todo anti-pattern)

## Impact

- `bin/lazypi.mjs` — catalog, categories, removed machinery
- `scripts/assert-installed-packages.mjs` — COMPOUND_ID exclusion removed
- `test/` — compound-migration + load-order suites deleted; agent-dir,
  assert-installed-packages, ci-workflows expectations updated (21/21 green)
- `.github/workflows/` — test.yml drops bun; windows-smoke single job;
  release-please manual-only
- `package.json`, `README.md`, `docs/` — fork identity and trimmed catalog
- `planning/*` — superseded by `openspec/` (kept in git history)