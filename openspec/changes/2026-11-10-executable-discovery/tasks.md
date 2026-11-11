## Implementation

- [x] Resolve commands by walking `PATH` entries in order, skipping empty entries.
- [x] Require a regular file with an execute bit, following a symlink to the file it names.
- [x] Resolve nothing for an unset `PATH`.
- [x] Keep the win32 `where` branch, the exported helper signatures, and the return shape.
- [x] Replace the `which`-dependent fixtures with `PATH`-staged stubs.
- [x] State the resolution contract in the installer spec delta.

## Verification

- [x] `node --test test/executable-discovery.test.mjs` passes, 7 of 7, after a RED run in which all 7 failed on the `which`-dependent lookup.
- [x] `node --test` passes, 226 of 226, none skipped.
- [x] `npm run spec:validate` passes.
- [x] A differential run of `doctor`, `status`, `update`, `update --local`, and three `install` shapes against the base commit showed identical stdout, stderr, exit code, stub invocation log, settings bytes, and backup count.
- [ ] Native Windows resolution was not exercised on this host.
- [ ] The verification skill's feature docs still describe the removed `which` lookup; recorded as a follow-up outside this change.
