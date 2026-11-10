## Implementation

- [x] Replace the Linux workflow's bare `--only optional` install with a gate that asserts the empty optional selection contract.
- [x] Add `--tier core|optional|all` to `scripts/assert-installed-packages.mjs`, derived from each package's category, with `all` as the default.
- [x] Reject a category name passed to `--except`, which previously excluded nothing and let a full-core profile pass.
- [x] Resolve the assertion's default settings path through `PI_CODING_AGENT_DIR`, keeping `--settings` as an override.
- [x] Add `scripts/cli-surface.mjs` and fail `npm test` when an accepted command or flag has no verification feature-map entry, a coverage entry names a surface item the parser does not accept, or a mapped doc is missing, unlisted, or silent.
- [x] Add feature docs for `doctor`, `update`, `remove`, and `--local`, following the existing structure and recording the isolation recipe, the exact commands, the assertions, and the unverified surface.
- [x] State the manual-versus-suite split once in the feature map README and remove the conflicting coverage claims from `catalog.md` and `install-orchestration.md`.
- [x] Move native-proof fixture evidence from `.atl/evidence/...` inside the checkout to a system temporary directory that the test process removes on exit.
- [x] Record each workflow's actual trigger in `test/ci-workflows.test.mjs`, including the dispatch-only Windows workflow, without changing the trigger.
- [x] Extend the verify skill so stub-first drives of `install`, `status`, `update`, `doctor`, and `remove` are authorized, and so extension execution and the live e2e driver stay out of scope.

## Verification

- [x] `node --test` passes.
- [x] `npm run spec:validate` passes.
- [x] The empty-optional gate failed against the unmodified workflow before the workflow change and passed after it.
- [x] `--tier optional` and `--except core` both fail against a full-core profile; `--tier core` and the default pass.
- [x] `PI_CODING_AGENT_DIR` alone selects the asserted settings file, and a missing explicit `--settings` path still fails closed.
- [x] `node --test test/native-pstack-proof.test.mjs` leaves no directory under `.atl/evidence/strict-minimal-pstack/runtime/native-proof-prep/writer/correction-fixtures` and no `lazypi-native-proof-*` directory in the system temporary directory.
- [x] `node scripts/cli-surface.mjs` reports incomplete coverage against the previous feature map and complete coverage after the new docs.
- [x] Every command, assertion, and output quoted in the new feature docs was run with stub `pi` and stub `npm` first on `PATH` in a private temporary sandbox.
- [x] No product behavior, catalog entry, help text, or `bin/` file changed.
