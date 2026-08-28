# Release-ops polish: --version, CI e2e, bunx staleness docs

## Why

The npx/bunx release audit of 0.6.5 surfaced three release-operability gaps.
The CLI cannot report its own version (`--version` is an unknown arg), so a
stale cached run is indistinguishable from the current release — exactly the
bunx cache-staleness trap found in the audit (bare `bunx` served 0.6.4 until
`bun pm cache rm`). The packed-CLI e2e harness (`scripts/e2e-install.mjs`,
which covers migration and remove against a real pi) exists but is not wired
into CI, unlike the packed smoke and full-install assertions already there.
And the bun cache quirk is documented nowhere, so it will confuse the next
release too.

## What Changes

- `bin/lazypi.mjs`: `-V/--version` prints the version (read from
  `package.json` at runtime — works in the packed artifact) and exits 0;
  help text lists it.
- `.github/workflows/test.yml`: run `node scripts/e2e-install.mjs` after the
  packed smoke (CI already installs real pi; the e2e runs in a sandbox and
  asserts migration + remove + status/doctor).
- README Troubleshooting + `docs/faq.html`: note that after a LazyPi release,
  `bunx` may serve a stale cached version until `bun pm cache rm` (or pin
  `@tommy-ca/lazypi@latest`), and that `lazypi --version` shows which release
  is running.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Commands gains a version-flag scenario; Self-Deriving
  CI gains an e2e-regression scenario

## Impact

- `bin/lazypi.mjs`, `.github/workflows/test.yml`, `README.md`, `docs/faq.html`
- Spec delta applied at archive