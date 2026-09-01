## 1. Spec

- [x] 1.1 Write installer MODIFIED Catalog Model (except from full catalog), Commands (spawn argv, doctor warn, status counts), and REMOVED Search Tools
      Evidence: `openspec/changes/remaining-seams/specs/lazypi/installer/spec.md`
- [x] 1.2 `npx openspec validate remaining-seams` green
      Evidence: `npx openspec validate remaining-seams` → Change 'remaining-seams' is valid

## 2. Tests first

- [x] 2.1 `windowsSpawnArgv` wraps `C:\npm.cmd` as ComSpec `/d /s /c` plus path plus args; a non-cmd path stays file plus args
      Evidence: `test/spawn-command.test.mjs`
- [x] 2.2 `--except todos` selects 16 ids
      Evidence: `test/remaining-seams.test.mjs`
- [x] 2.3 doctor with no settings file does not fail from `warn()` default
      Evidence: `test/remaining-seams.test.mjs`

## 3. Code

- [x] 3.1 Export `windowsSpawnArgv`; `spawnCommand` uses it; `commandPath` probes via `spawnCommand`
      Evidence: `bin/lazypi.mjs`
- [x] 3.2 packed-cli-smoke spawns `npm.cmd` through the same helper
      Evidence: `scripts/packed-cli-smoke.mjs`
- [x] 3.3 `warn()` defaults `{ fatal: false }`; git missing, settings missing, empty `pi --version` stay warnings
      Evidence: `bin/lazypi.mjs` `cmdDoctor`
- [x] 3.4 `status` prints core and optional counts after the catalog header; export `resolveSelection`
      Evidence: `bin/lazypi.mjs` `cmdStatus`

## 4. Docs

- [x] 4.1 CHANGELOG Unreleased bullets for spawn, doctor, status, spec
      Evidence: `CHANGELOG.md`

## 5. Verify

- [x] 5.1 `npm test` green
      Evidence: `npm test` → 52 pass, 0 fail
- [x] 5.2 `npm run spec:validate` green for the live change
      Evidence: `openspec validate --all` → spec/harness/control-plane, spec/lazypi/installer, change/remaining-seams valid
- [x] 5.3 Archive `remaining-seams` with tasks complete
      Evidence: `npx openspec archive remaining-seams --yes` → `2026-09-01-remaining-seams`, 2 modified, 1 removed
- [x] 5.4 `npm run spec:validate` green after archive
      Evidence: 2 live specs + 35 archived, including `2026-09-01-remaining-seams`
