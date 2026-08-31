# Refresh installed catalog versions to the latest proven releases

## Why

The 2026-08-31 extension-deps audit established two facts: (1) `pi update`
respects version pins in `settings.json` and does not advance them, and (2)
upstream fixes (the pi-subagents workflow/permit bridge, now verified on
v0.62.0) only reach pinned installs through an explicit reinstall at a newer
version. A version audit of the operator install found 7 of the 17 catalog
packages pinned below their npm `latest` (stable) release:

| package | installed | latest |
| --- | --- | --- |
| @zigai/pi-mention-skill | 0.8.0 | 0.9.0 |
| @narumitw/pi-goal | 0.54.3 | 0.54.4 |
| @narumitw/pi-btw | 0.55.4 | 0.56.0 |
| pi-web-access | 0.26.0 | 0.27.0 |
| @ff-labs/pi-fff | 0.10.5 | 0.10.6 |
| @quintinshaw/pi-dynamic-workflows | 3.7.0 | 3.10.0 |
| pi-autoresearch | 1.6.2 | 1.7.0 |

(The other 10, pi-subagents included, are already at latest.)

## What Changes

- Operator install: the 7 stale packages move from their pinned versions to
  the npm `latest` release via `pi install npm:<pkg>@<version>` (the only
  path that advances a pin). settings.json pins and the npm store update to
  match; the catalog sources in `PACKAGES` are unchanged (they are unpinned).
- Exploration `catalog-refresh-audit.md` records the audit table, the
  upgrade commands, and the verification.
- CHANGELOG entry under the refresh theme.

No installer behavior, PACKAGES membership, or spec changes. This is an
operator-environment operation ratified through the change flow for the
audit trail.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.