## Implementation

- [x] Add a shared child-environment helper whose `PATH` holds one private stub directory only.
- [x] Start every stub through an absolute interpreter shebang and record each invocation as JSON argv plus exit status.
- [x] Fail a test when a requested command has no stub, and allow absence only when the test declares it.
- [x] Migrate every test that spawns the CLI onto the helper.
- [x] Add an enforceable guard test over `test/`, proven against sample sources.
- [x] State the same isolation rule in the verification skill.
- [x] Reconcile the active installer contract that required a fixture to retain the system PATH.

## Verification

- [x] `node --test test/cli-isolation-guard.test.mjs` passes, 6 of 6.
- [x] `node --test` passes, 219 of 219, none skipped.
- [x] `npm run spec:validate` passes.
- [x] The guard fails on a planted `process.env.PATH` fixture and on a planted literal CLI spawn, then passes after removing them.
- [x] A stubbed tool with no `PATH` entry breaks the test with a printed message and reaches no real tool.
- [ ] Windows `.cmd` launcher behaviour was not exercised on this host.
