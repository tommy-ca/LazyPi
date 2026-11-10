## Implementation

- [x] Add RED coverage for symlinked and non-regular settings targets, control characters in printed sources, a failed atomic write, same-second backup collisions, wrong-shaped documents, `--version` with an invalid argument, a non-object `auth.json`, and the duplicate interactivity policy.
- [x] Refuse to write a settings target that is a symlink or a non-regular file.
- [x] Escape control characters in every string printed from settings or auth.
- [x] Replace the in-place settings write with a same-directory temp file, fsync, and rename.
- [x] Make backup names collision-free within one second.
- [x] Validate the settings document shape and fail closed with a printed error and exit 2.
- [x] Require a valid argument set before `--version` reports the version.
- [x] Treat a non-object `auth.json` as no providers rather than as provider names.

## Verification

- [x] `node --test` passes, including the new `test/settings-integrity.test.mjs`.
- [x] `npm run spec:validate` passes.
- [x] Every rejected input leaves the settings file byte-identical and creates no backup.
- [x] A differential run over `update`, `update --local`, `remove <id>`, `remove <source>`, `remove` with no target, `status`, `status --local`, `install --local --yes`, `install --yes --only subagents`, and `doctor` shows no unrequested change to stdout, stderr, exit code, or stored bytes.
