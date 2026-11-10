# CLI decomposition and dead-machinery removal

## Why

`bin/lazypi.mjs` reached 1180 lines, and most of that growth was not new
behavior. An audit of the module found two subsystems that cannot run at all,
one identity wrapper kept alive only by its own test, and a command whose
rendering is authored twice.

No catalog entry declares `legacySources`, so `legacySourcesForPackage` always
returns an empty array. Everything downstream of it is therefore constant:
`isLegacySourceForPackage` is always false, `findLegacyInstalledSources` is
always empty, `removeLegacy` never enters its loop and returns 0 without
spawning, `packageInstallStatus.legacy` is always false, and `isPackagePresent`
equaled `isPackageInstalled` for every input. The dead machinery still cost
users real output: `status` printed a whole "Installed with legacy catalog
sources (0)" section that cannot be non-zero, and `doctor` warned that git was
needed "to migrate leftover git: legacy sources" for a migration the data
cannot express. Both describe work the tool cannot do.

`buildSpawnOptions` returned a copy of its first argument, ignored its second,
and existed only because a test asserted the copy. Three call sites pass an
options object that needs no help.

`cmdInstall` carried twelve `if (interactive)` branches in 147 lines: every
user-facing action was authored twice, once through clack and once through
`console`. The real missing abstraction was an output adapter, not a command
split.

The module also conflated two different TTY questions, shadowed the
module-level `stdout` import with a function parameter, and exported twelve
internals purely so the test suite could reach them from the executable.

## What changes

- The legacy-source subsystem is deleted: `legacySourcesForPackage`,
  `isLegacySourceForPackage`, `findLegacyInstalledSources`, `removeLegacy`, the
  `legacy` field of `packageInstallStatus`, and `isPackagePresent`. One
  predicate remains: an entry is installed when an installed source matches its
  identity source.
- `buildSpawnOptions` is deleted and its call sites pass their options object
  unchanged.
- `status` no longer prints the always-empty legacy section, and `doctor` no
  longer warns about the git requirement for a migration that cannot happen.
  Both are deliberate user-visible output changes.
- Messages are values that carry one rendering per mode, and a command picks
  the mode once. `printNextSteps` and `printCheatsheet` lose their
  `interactive` parameter because it existed only to select a rendering.
- Interactivity is `stdin.isTTY && stdout.isTTY`; colour is `stdout.isTTY`.
  They stay separate predicates.
- The module splits into `bin/catalog.mjs` (catalog constants, selector parsing
  and resolution, source matching, the installed predicate) and
  `bin/pi-host.mjs` (spawning, Windows quoting, agent-dir and settings path
  math, settings read/write, auth probing). `bin/pi-host.mjs` imports no prompt
  library and never prints. `bin/lazypi.mjs` stays the executable and re-exports
  the existing public names, so every import specifier keeps working.
- `pickWindowsWhereHit` names its parameter `whereOutput` instead of shadowing
  the `stdout` import.

## Impact

- Affected specs: `lazypi/installer` (Catalog Model, Idempotent Install,
  Commands)
- Affected code: `bin/lazypi.mjs`, new `bin/catalog.mjs`, new `bin/pi-host.mjs`
- Affected tests: `test/spawn-command.test.mjs` (the identity wrapper's three
  tautologies are removed), `test/pstack-retirement.test.mjs` and
  `test/fixtures/strict-minimal-head-oracles.json` (byte oracles updated for the
  removed status section), new `test/module-boundaries.test.mjs`
- Out of scope, later units: the `parseArgs` outcome enum, `hasCmd`/`which` and
  PATH resolution, `update --local` scope, `PI_CODING_AGENT_DIR` validation, the
  Windows quoting hypotheses, `docs/`, `scripts/`, `.github/`, and `.agents/`
