# Catalog Version Refresh Audit — 2026-08-31

Companion change: `2026-08-31-catalog-version-refresh`.

## Why

The extension-deps audit proved `pi update` respects version pins, so
pinned catalog packages accumulate upstream fixes only through explicit
reinstalls. A version audit of the operator install found 7 of 17 catalog
packages pinned below npm `latest` (the stable dist-tag).

## Audit table (npm view latest vs installed pin)

| package | installed | latest | refresh |
| --- | --- | --- | --- |
| pi-subagents | 0.62.0 | 0.62.0 | — (already updated) |
| pi-ask-user | 0.14.0 | 0.14.0 | — |
| pi-skillful | 0.4.0 | 0.4.0 | — |
| @zigai/pi-mention-skill | 0.8.0 | 0.9.0 | → 0.9.0 |
| @narumitw/pi-goal | 0.54.3 | 0.54.4 | → 0.54.4 |
| @narumitw/pi-btw | 0.55.4 | 0.56.0 | → 0.56.0 |
| pi-context-usage | 1.0.2 | 1.0.2 | — |
| pi-simplify | 0.2.3 | 0.2.3 | — |
| pi-web-access | 0.26.0 | 0.27.0 | → 0.27.0 |
| @ff-labs/pi-fff | 0.10.5 | 0.10.6 | → 0.10.6 |
| @quintinshaw/pi-dynamic-workflows | 3.7.0 | 3.10.0 | → 3.10.0 |
| @dietrichgebert/ponytail | 4.9.0 | 4.9.0 | — |
| @narumitw/pi-lsp | 0.49.6 | 0.49.6 | — |
| pi-interactive-shell | 0.15.1 | 0.15.1 | — |
| pi-autoresearch | 1.6.2 | 1.7.0 | → 1.7.0 |
| pi-manage-todo-list | 0.4.0 | 0.4.0 | — |
| pi-memory-md | 0.1.38 | 0.1.38 | — |

## Operations applied

`pi install npm:<pkg>@<latest>` for the seven stale packages (the only path
that advances an existing pin). Each install replaces the settings entry and
updates the npm store (single entries, no duplicates — same behavior
verified in the pi-subagents upgrade). No legacy sources were present for
the refreshed packages; the catalog sources in `PACKAGES` are unpinned and
unchanged.

## Verification

- `settings.json` holds all 17 pins at their npm latest versions.
- `node bin/lazypi.mjs status` lists 17/17 with the fresh pins (the
  pin-visibility change from `2026-08-31-pin-visible-recovery` now earns
  its keep: every row shows what is actually installed).
- `node bin/lazypi.mjs doctor`: all checks passed.
- Refreshed package manifests/spawn entries resolve from the npm store
  (spot-checked for all seven: valid package.json + entry points).

## Learnings carried forward

- "Latest" for the catalog = npm `latest` dist-tag (stable; no prereleases
  were promoted in this sweep).
- The operator install pins every catalog source; advancing them is a
  deliberate `pi install npm:<pkg>@<version>` action. If unpinned tracking
  is ever preferred, `pi install npm:<pkg>` (no version) and future
  `pi update` runs will advance it automatically — that trade-off is
  documented in the FAQ/updating pages.
- Two of the seven refreshed packages were the ones with past workflow
  churn (pi-dynamic-workflows 3.7.0 → 3.10.0, pi-subagents already at
  0.62.0); the fresh-session workflow fan-out verification from the
  extension-deps audit stands as the baseline for those.