# Offline registration and retirement orchestration

Run only with existing dependencies and private state under a separately approved root. No real Pi, npm install, or extension execution is authorized by this recipe. Private state is not OS containment.

From the repository root, use an allowlisted environment with private HOME, USERPROFILE, PI_CODING_AGENT_DIR, XDG directories, TMPDIR, and npm cache/config files. Use distinct user and global npm configuration files. Protect PATH with fake executables so Pi or npm fallback cannot reach real tools. Keep exact command, stdout, stderr, and exit separately, including failures. Tests create disposable fixtures under TMPDIR. Retain evidence for inspection.

## Public CLI coverage

```sh
node --test test/pstack-retirement.test.mjs test/agent-dir.test.mjs test/install-selection-effects.test.mjs test/migration-safety.test.mjs
```

The fixtures check five required registrations in order, Web Access optional selection, the audited fresh canonical argument, preserved older canonical pins without duplication, independent npm PStack identity, retired install-selector rejection, raw removal passthrough and exact-source removal, broad updates, settings scope/order/object metadata, and six builtin model resets. Rejected selectors leave settings, backups, and counters unchanged. Existing interactive cancellation, empty selection, and bootstrap sequencing remain covered.

The clean-install source assertion is exact equality to fresh install arguments, not general profile preservation. Preserved profiles have separate assertions. Selecting Subagents can change builtin model overrides even when already installed.

## Offline packed verification

```sh
node --test test/e2e-harness.test.mjs
```

This invokes `scripts/e2e-install.mjs` only with stub npm, Pi, and packed-bin executables and private PATH. Expected result is ten passes on POSIX; Windows skips POSIX fixtures. It checks private cwd/environment, tarball destination, preflight, failures, cleanup/keep behavior, and stage order. Fresh sources use `installSource` when present, otherwise identity. The builtin-model stage remains. Former BTW migration stages now test older canonical and unmanaged-object preservation, current-ID exact-pin removal, and raw unmanaged removal.

The stubs prove driver orchestration, not actual archive contents or loaded extension behavior. Do not run the live driver here. Actual network/archive/Pi execution requires separate authorization, disposable destinations, and effective OS containment. Native role binding, tool/model semantics, independent child gates, headless denial, exit/recovery, operator promotion, and readiness remain unverified. Sandbox stays disabled until explicitly configured. Ask User is not hard approval.
