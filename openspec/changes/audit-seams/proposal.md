# Fail closed at installer seams

## Why

A quality audit found four seams that contradict the installer contract.
Empty `--except` installs the full catalog. A claimed no-op still rewrites
`settings.json`. Windows `shell: true` interpolates user sources into
`cmd.exe`. Corrupt settings is warn-and-continue on install.

## What Changes

- **BREAKING (usage):** `--only` or `--except` with a missing or empty list
  SHALL print help and exit 2. Passing both flags together SHALL do the same.
  `--except` with a valid list still subtracts from the full catalog.
- **BREAKING (usage):** invalid `settings.json` SHALL fail
  install, status, update, remove, and doctor with exit 2. Install SHALL NOT
  treat a parse error as an empty inventory.
- No-op install SHALL NOT write `settings.json` or a `.bak` when selected
  sources are already present and builtin empty-model overrides are already
  applied. Existing extra keys on those override objects SHALL be kept.
- Windows `pi`/`npm` spawns SHALL NOT join unsanitized source strings into a
  shell command line.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lazypi/installer`: Commands (empty selectors, both flags), Idempotent
  Install (settings untouched on re-run; corrupt JSON fail-closed), Subagent
  Overrides (merge, skip write when applied), spawn/trust for local and
  remove sources

## Impact

- `bin/lazypi.mjs`
- unit tests for parse/select/overrides/spawn
- `openspec/specs/lazypi/installer/spec.md`
