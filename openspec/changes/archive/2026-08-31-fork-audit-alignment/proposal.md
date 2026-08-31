# Align the fork audit with the live catalog

## Why

A fork-vs-upstream audit found the installer already matches the lean
17-package catalog, while the live specs still describe dropped
`skill-args`, a lost `curated-themes` drop, a "full `--yes`" CI path that
never existed after the optional tier, and a harness that still forbids
optional todos. `openspec validate` stays green through that because it
does not pin `PACKAGES`.

## What Changes

- Drop the installer Skill Arguments requirement. `skill-args` stays on
  the Dropped list. Skill parameters remain a harness concern when the
  operator installs `npm:@juicesharp/rpiv-args` with `pi install`.
- Keep the Catalog Model "Skill arguments source" scenario. OpenSpec
  MODIFIED cannot drop a scenario; the WHEN is vacuously true because
  `skill-args` is dropped. The Skill Arguments *requirement* still goes.
- Put `curated-themes` back on the Dropped packages list (lost in a
  full-copy MODIFIED).
- Describe full-catalog CI as `--yes` then `--yes --only optional`, and
  require a unit pin of `PACKAGES` ids against that catalog.
- Harness default install stays the twelve core packages. Optional catalog
  entries install with `lazypi --only optional` (or the picker). Non-catalog
  extras stay `pi install`. Optional `todos` is a progress widget, not the
  checkbox-todo anti-pattern.
- Windows smoke installs the optional tier before the full-catalog assert.
- Docs, help, README, and CHANGELOG match the 12+5 catalog and the
  `@narumitw/pi-btw` source.

No breaking CLI flags. Default `--yes` remains core-only.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lazypi/installer`: Catalog Model (dropped list, drop dead skill-args
  scenario), Self-Deriving CI (two-step full catalog + catalog pin),
  remove Skill Arguments
- `harness/control-plane`: Control Plane Catalog (optional tier via
  lazypi, todos allowed as optional)

## Impact

- `openspec/specs/lazypi/installer/spec.md`
- `openspec/specs/harness/control-plane/spec.md`
- `test/catalog-contract.test.mjs` (new pin)
- `test/ci-workflows.test.mjs`
- `.github/workflows/windows-smoke.yml`
- `docs/` landing BTW card, package prev/next, installation copy
- `README.md`, `CHANGELOG.md`, `bin/lazypi.mjs` doctor git warning
- `openspec/config.yaml` fork-direction context
