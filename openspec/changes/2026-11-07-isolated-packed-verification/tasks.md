## Implementation

- [x] Add public-script RED evidence with offline executable fixtures.
- [x] Route setup, npm, Pi seeds, and packed-bin invocations through one private run context.
- [x] Pack into the private root and cover setup failures with cleanup or `--keep`.
- [x] Reject missing or failing Pi before any npm installation.
- [x] Preserve core-then-optional assertions, migration stages, and Node packed-bin invocation.
- [x] Document stub-only usage and distinguish private state from OS containment.

## Verification

- [x] Run `node --test test/e2e-harness.test.mjs` with sanitized private state and fake executables only.
- [x] Run `node --check scripts/e2e-install.mjs`.
- [ ] Parent runs the full test and OpenSpec validation seam after both prerequisite writers finish.
