# Release-ops audit — what the release flow really is (research)

Source: the 0.9.0 release cycle (2026-08-29), verified against git history,
repo secrets, and live npm behavior.

## Findings

### 1. Release-please stopped at 0.6.4

| Era | Mechanism | Evidence |
| --- | --- | --- |
| ≤ 0.6.4 | Release Please PRs | `chore(master): release 0.6.4 (#75)` (and 0.6.1–0.6.3) |
| 0.6.5 → 0.9.0 | Manual | version-bump commits authored directly (`0.7.0`, `0.8.0`, `0.8.1`, `0.9.0`), tags + npm publish by hand |

The repository has **no** `release-please-config.json` / `.release-please-manifest.json`
and **no** repo secrets (`gh secret list` is empty), so the
`.github/workflows/release-please.yml` `npm publish --provenance` step
cannot authenticate. The workflow is the intended automation but is
unprovisioned — README claimed the Release Please flow was active.

### 2. npm auth mechanics (learned at cost)

- An **expired/revoked device token** makes `npm publish` fail with
  **E404 "not found or permission"** on the scoped package — npm masks
  unauthorized scoped writes. `npm whoami` surfaces the truth (401).
- With **no token at all**, publish refuses with ENEEDAUTH ("use npm
  adduser") — publish never auto-prompts; `npm login` does device auth.
- The account's **2FA requires a TTY** for the write: an OTP prompt or
  the device-auth browser flow. Non-TTY publish with a valid token falls
  into the device-auth URL error path.
- Working recipe (used for 0.9.0): clear stale token → `npm login`
  (browser device auth) → interactive `npm publish --access public` →
  complete OTP/device flow → verify `npm view` latest.

### 3. Spec cruft found by the same sweep

The Catalog Model "Skill arguments source" scenario is a conditional that
can never fire: `skill-args` is on the Dropped list and never cataloged.
OpenSpec's validator guards scenario removal (no scenario-level removal
syntax; MODIFIED must contain every current scenario), so the dead
conditional is flagged here instead of stripped — a requirement-level
refactor would be needed to remove it.

## Resolution

Change 2026-08-29-release-ops-reality: the spec gains a Release Flow
requirement (bump convention, interactive publish, token-expiry recovery,
unprovisioned-CI caveat), README's Releasing section is rewritten to the
real process, and AGENTS.md records the spec-delta discipline. The dead
scenario stays (validator-guarded) and is tracked here.