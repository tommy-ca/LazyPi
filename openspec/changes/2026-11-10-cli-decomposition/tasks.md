## Implementation

- [x] Delete `legacySourcesForPackage`, `isLegacySourceForPackage`, `findLegacyInstalledSources`, `removeLegacy`, `packageInstallStatus.legacy`, and `isPackagePresent`, and collapse `packageInstallStatus` to a single installed predicate.
- [x] Remove every legacy call site: install's legacy-only and migrate-only computation, the migrate-only loop, the post-install migration call, status's legacy filter, remove's legacy fan-out, and doctor's legacy clause.
- [x] Remove the always-empty "Installed with legacy catalog sources (0)" section from `status`.
- [x] Remove `doctor`'s git warning about migrating legacy sources.
- [x] Delete `buildSpawnOptions`, inline its three call sites, and remove the three tautologies from `test/spawn-command.test.mjs`.
- [x] Add a message-value output adapter so each message carries its clack and plain rendering, and choose the renderer once per command.
- [x] Drop the `interactive` parameter from `printNextSteps` and `printCheatsheet`.
- [x] Separate the interactivity predicate (`stdin.isTTY && stdout.isTTY`) from the colour predicate (`stdout.isTTY`).
- [x] Split `bin/catalog.mjs` (catalog, selectors, source matching, installed predicate) out of the executable.
- [x] Split `bin/pi-host.mjs` (spawning, quoting, path math, settings, auth probing) out of the executable, with no prompt import and no printing.
- [x] Keep `bin/lazypi.mjs` as the executable and re-export every name the tests and CI scripts import from it.
- [x] Rename `pickWindowsWhereHit`'s parameter so it no longer shadows the `stdout` import.

## Verification

- [x] `node --test` passes, including the new `test/module-boundaries.test.mjs`.
- [x] `npm run spec:validate` passes.
- [x] Help text, `PACKAGES` content and order, and packaged file modes are unchanged.
- [x] `bin/pi-host.mjs` imports without loading `@clack/prompts`, prints nothing, and starts no entrypoint work.
- [x] The installed predicate is asserted directly for a pinned source, an unpinned catalog source, and a source that must not match.
- [x] A differential run over `--help`, `--version`, an unknown argument, conflicting and empty selectors, a rejected selector id, non-install selectors, `status`, `status --local`, a corrupt settings file, `install --yes`, `install --yes --only subagents`, `install --yes --only optional`, an idempotent re-install, `install --local --yes`, a missing `pi`, `remove <id>`, `remove <source>`, `remove` with no target, `remove --local`, `update`, `update --local`, `doctor`, and `doctor` with unpinned git heads shows no change to stdout, stderr, exit code, stored bytes, backups, or Pi calls, except the two deliberate removals above.
