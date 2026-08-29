# Autoresearch moves to the npm source

## Why

The optional-tier change (2026-08-29) cataloged autoresearch as a pinned
git source (`git:github.com/davebcn87/pi-autoresearch@00062fb9…`). The
author publishes the same extension to npm as `pi-autoresearch`
(1.6.2 · 2026-07-09, same repository). An npm source is the catalog
convention for every other entry — floating, so installs pick up releases
instead of freezing at a snapshot — so autoresearch should match. The git
form becomes a legacy source so existing installs (the operator's included)
migrate automatically instead of lingering as duplicates.

## What Changes

- `bin/lazypi.mjs`: `autoresearch` source → `npm:pi-autoresearch` with
  `legacySources: ["git:github.com/davebcn87/pi-autoresearch"]` (the
  pinned-git form matches via the existing `@`-suffix rule)
- `docs/docs/packages/autoresearch.html`: npm source note + migration
  wording
- Operator install migrated and verified: `pi remove
  git:github.com/davebcn87/pi-autoresearch@0006…` → `pi install
  npm:pi-autoresearch`, settings hold only `npm:pi-autoresearch`

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model — Optional sources scenario: the
  autoresearch source becomes `npm:pi-autoresearch` with the git form in
  `legacySources`

## Impact

- `bin/lazypi.mjs`, `docs/docs/packages/autoresearch.html`
- No CI/e2e changes (counts and sources derive from `PACKAGES`)