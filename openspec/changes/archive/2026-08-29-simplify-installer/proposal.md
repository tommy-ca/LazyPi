# Simplify the installer (drop dead git/fork paths)

## Why

The catalog is 100% pinned npm sources — zero `git:` entries — and the
owned-fork migration is dead (change discarded). The installer still carries
the dead paths: a `git:` install branch with ignore-scripts env handling, a
doctor warning pointing at the "owned-fork migration", a `forked` schema
mention in the spec, plus unused plumbing (`PI_CORE_PACKAGE`, `local`
parameters threaded through status helpers, a duplicated `hasCmd`
implementation).

## What Changes

- `bin/lazypi.mjs`: every install runs identically (`pi install <source>`);
  the `git:` special case is removed.
- `doctor`: the unpinned-git warning advises pinning the source; no dead
  fork-migration reference.
- Dead code out: `PI_CORE_PACKAGE` constant, the unused `local` parameter of
  `packageInstallStatus` / `isPackageInstalled` / `isPackagePresent`, and the
  duplicate `hasCmd` (delegates to `commandPath`).
- Spec: `lazypi/installer` drops `forked` from the catalog entry MAY list and
  removes the now-moot Git Sources requirement.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: catalog schema without `forked`; Git Sources
  requirement removed; behavioral simplification as above

## Impact

- `bin/lazypi.mjs` — ~20 lines removed
- `openspec/specs/lazypi/installer/spec.md` — delta applied at archive
- No catalog, docs-site, or CI contract changes