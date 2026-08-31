## 1. Spec

- [x] 1.1 Write installer deltas for empty selectors, corrupt settings, no-op settings, spawn argv, override merge
      Evidence: `openspec/changes/audit-seams/specs/lazypi/installer/spec.md` (Empty selector, Corrupt settings, Re-run, Spawn argv, Override merge)
- [x] 1.2 `npx openspec validate --changes` green
      Evidence: `npx openspec validate --changes` → `change/audit-seams` valid; `npx openspec validate audit-seams` → valid

## 2. Tests first

- [x] 2.1 CLI: missing/empty `--only`/`--except` and both flags exit 2
      Evidence: `test/audit-seams.test.mjs` (`lazypi --only`, `--except`, `--only=`, `--except=`, both flags → status 2 + Usage)
- [x] 2.2 CLI: corrupt settings.json exits 2 for install/status/update/remove/doctor
      Evidence: same file; status/update/doctor/`--yes`/`--yes --only fff`/`remove fff` → status 2, empty `PI_TEST_CALLS`
- [x] 2.3 writeSubagentOverrides does not write when six empty models exist; keeps extra keys
      Evidence: unit tests in `test/audit-seams.test.mjs` (no-op + planner merge)
- [x] 2.4 spawn does not set `shell: true` for `pi` argv on win32
      Evidence: `test/spawn-command.test.mjs` Windows default has no `shell`; explicit `shell: true`/`false` kept

## 3. Implement

- [x] 3.1 parseArgs usageError; validateSelectors returns; resolveSelection
      Evidence: `bin/lazypi.mjs` `usageError` on missing/empty/both; `validateSelectors` returns boolean; `main` prints help and returns 2
- [x] 3.2 fail-closed settings; merge overrides
      Evidence: install/status/update/remove/doctor return 2 before `pi`; mutate returns false when six `model === ""`; merge keeps extra keys
- [x] 3.3 resolve `.cmd` then `shell: false` for pi/npm
      Evidence: `spawnCommand` resolves `pi`/`npm` via `commandPath`, then `spawnSync` with `buildSpawnOptions` (no win32 `shell: true` default)

## 4. Verify

- [x] 4.1 `npm test` green
      Evidence: `npm test` → 35 pass, 0 fail
- [x] 4.2 archive the change
      Evidence: archived as `2026-08-31-audit-seams`
- [x] 4.3 `npm run spec:validate` green
      Evidence: `openspec validate --all && openspec validate --changes --archived` → 3 + 26 passed
