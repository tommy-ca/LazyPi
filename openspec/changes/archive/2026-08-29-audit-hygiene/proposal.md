# Audit hygiene: simplify dead code and align docs with the catalog

## Why

A three-lens audit (code simplicity, spec truth, docs hygiene; 2026-08-28)
found no blockers — main specs match the 16-entry catalog — but flagged real
leftovers and drift: unreachable npm-prefix update machinery from a superseded
feature, dead `skipped` accounting in install, a redundant status filter, a
stale test regex referencing a dropped package, a doctor Node threshold that
disagreed with `engines >= 20`, and docs claims for dropped features (Claude
Code CLI hero claim, stale Node 18 floors) plus duplicated catalog
enumerations that drifted apart.

Per OpenSpec Recipe 5 this is a pure refactor/tooling pass with zero spec
deltas, so the change declares `skip_specs: true`.

## What Changes

- Remove unreachable npm-prefix update machinery from `bin/lazypi.mjs`
  (`findPackageRoot`, `inferNpmPrefixFromPiPackageRoot`,
  `inferNpmPrefixFromPiShim`, `isNamedPackageRoot`, `isPiShimInNpmPrefix`,
  `getActivePiNpmPrefix`, `updatePiCoreViaNpmLatest`,
  `updatePiCoreAndExtensions`, `PI_CORE_LATEST_SPEC` — zero callers; `update`
  delegates to `pi update` since v0.6.2) and their four tests.
- Drop the unused `export` on `spawnCommand`; remove dead `skipped` install
  accounting and its unreachable branch; simplify the `others` filter; reduce
  `cmdUpdate` to settings-parse + delegate (dead `resolveUpdateCatalogIds`
  `ids` output removed); export and share `parseList` with the CI script;
  doctor requires Node >= 20.
- Docs hygiene: remove the stale Claude Code CLI hero claim, add `doctor` to
  the overview commands table, add missing `simplify`/`skill arguments` to
  catalog enumerations, Node 20 floors, reword the themes preview claim,
  drop the dead `plans/` Jekyll exclude.

## Capabilities

No capability changes (specs unmodified).

## Impact

- `bin/lazypi.mjs` (−127 lines), `scripts/assert-installed-packages.mjs`,
  `test/spawn-command.test.mjs`, `test/update-selection.test.mjs`
- `docs/` (index, first-steps, overview, themes, faq, installation,
  `_config.yml`), `CHANGELOG.md`
- Accepted as-is from the audits: `mcp-adapter.html` slug vs catalog id
  `mcp`, no `curated-themes.html` (themes page is the gallery), footer credit
  to upstream, spec redundancy notes (Skill Arguments vs Skill Parameters are
  catalog-control vs harness-capability statements; review scenarios live in
  different requirement contexts).