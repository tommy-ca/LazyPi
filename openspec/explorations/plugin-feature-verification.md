# Plugin Feature Verification — 2026-08-31

Companion change: `2026-08-31-plugin-feature-verification`.

## Why

After `2026-08-31-catalog-version-refresh` moved seven catalog packages to
npm `latest`, the refreshed plugins were verified statically and
functionally. The auditing session cannot verify fresh code in-process
(extensions import at session startup), so functional verification ran in a
spawned fresh pi session against the on-disk v-latest store.

## Static verification (all 17 catalog packages)

- package.json + `pi` manifest present at the npm store root at the
  refreshed versions (pi-subagents 0.62.0 … pi-memory-md 0.1.38).
- Declared runtime dependencies resolvable at the store root (hoisted or
  nested). Three scoped deps flagged by an initial resolution probe
  (@zigai/pi-extension-settings, @narumitw/pi-tui-kit) were confirmed
  present by filesystem check — probe artifact, not a defect.

## Fresh-session functional verification (8 packages)

| package | version | verdict |
| --- | --- | --- |
| @ff-labs/pi-fff | 0.10.6 | ✅ PASS — healthCheck ok, v0.10.6, 216 files |
| @quintinshaw/pi-dynamic-workflows | 3.10.0 | ✅ PASS — workflow tool + 2 skills |
| @zigai/pi-mention-skill | 0.9.0 | ✅ PASS — `$` trigger configured |
| @narumitw/pi-goal | 0.54.4 | ✅ PASS — 3 goal tools present (not invoked; no active `/goal`) |
| @narumitw/pi-btw | 0.56.0 | ✅ PASS — `/btw` command registered |
| pi-web-access | 0.27.0 | ✅ PASS — web_search + fetch_content present |
| pi-autoresearch | 1.7.0 | ✅ PASS — 3 skills + extension loaded |
| pi-subagents | 0.62.0 | ✅ PASS — `runs.run` live (PONG in 4.4s) |

## Notes

- pi-subagents `runs.run` verified for a second time in a fresh session —
  the workflow child bridge fix holds across sessions at v0.62.0.
- Goal gate tools were present but intentionally not invoked (no active
  `/goal`); fff ran its own self-check command (`/fff-health`).
- No failures recorded; no regression to file upstream.