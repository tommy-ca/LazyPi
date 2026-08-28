# Tasks — Simplify the installer (drop dead git/fork paths)

## 1. Code

- [x] 1.1 Remove the `git:` install branch in `cmdInstall` (ignore-scripts env no longer needed)
- [x] 1.2 Reword the `doctor` unpinned-git warning (pin the source; drop the owned-fork reference)
- [x] 1.3 Delete the unused `PI_CORE_PACKAGE` constant
- [x] 1.4 Drop the unused `local` parameter from `packageInstallStatus` / `isPackageInstalled` / `isPackagePresent` and their call sites
- [x] 1.5 Make `hasCmd` delegate to `commandPath` (single implementation)

## 2. Specs

- [x] 2.1 Delta: MODIFIED Catalog Model (drop `forked` from MAY list)
- [x] 2.2 Delta: REMOVED Git Sources requirement (Reason + Migration)
- [x] 2.3 `npm run spec:validate` green

## 3. Verify and close

- [x] 3.1 `npm test` green (spawn/status/doctor paths still covered)
- [x] 3.2 Archive the change (deltas applied to main specs)