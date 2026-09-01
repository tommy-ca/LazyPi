# Close remaining installer seams

## Why

Windows `.cmd` still spawns as a file plus argv. That hits `EINVAL` without
a cmd.exe wrapper. `doctor` `warn()` still counts as a failure by default,
so a missing git or missing settings file fails a healthy npm-only setup.
`status` prints `n/PACKAGES.length` without saying how many of those are
core versus optional. `--except todos` already subtracts from all 17, but
nothing pins 16. Search Tools is a live installer requirement this CLI
does not implement.

## What Changes

- On win32, a resolved `.cmd` or `.bat` SHALL spawn as ComSpec argv
  (`/d /s /c` plus the program plus the args), `shell: false`. Sources stay
  extra argv elements. Unix spawn stays argv. `spawnSync` SHALL NOT default
  `shell: true`.
- `doctor` `warn()` is non-fatal by default. Missing git, missing settings,
  and unread `pi --version` SHALL NOT fail the run. Node below 20, missing
  npm, and missing pi still fail. Corrupt JSON still exits 2 before checks.
- After the `Installed from LazyPi catalog (n/PACKAGES.length)` header,
  `status` SHALL print core and optional installed counts from PACKAGES
  categories. The empty missing line stays
  `none — full catalog is installed` when `missing.length === 0`.
- `--except` keeps subtracting from the full catalog. `--except todos`
  selects 16 ids.
- Remove the installer Search Tools requirement. Catalog Model Search
  substrate source and harness Search substrate stay. Skill arguments
  source WHEN stays the promotion path.

No `--yes` 12 versus TTY 17 change. No `bin/lazypi.mjs` split. No fat
catalog restore.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lazypi/installer`: Catalog Model (`--except` subtracts from the full
  catalog), Commands (spawn argv, doctor warn, status counts), remove
  Search Tools

## Impact

- `bin/lazypi.mjs`
- `test/spawn-command.test.mjs`
- `test/remaining-seams.test.mjs`
- `scripts/packed-cli-smoke.mjs`
- `openspec/specs/lazypi/installer/spec.md`
- `CHANGELOG.md`
