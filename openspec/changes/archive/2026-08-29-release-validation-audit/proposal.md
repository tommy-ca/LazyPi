# Release validation audit: npx/bunx 0.8.0 and cache quirks

## Why

The 0.8.0 release (tagged but unpublished since Aug 29) was published to npm
and validated end-to-end from the registry. The audit reproduced two real
user-facing quirks: (a) `npx` reuses the extracted copy in `~/.npm/_npx`, so
stale versions persist exactly like the documented `bunx` cache; and (b)
running `npx @tommy-ca/lazypi` *inside the LazyPi checkout* fails with
`sh: 1: lazypi: not found` because npm exec matches the spec against the
local tree — the checkout itself is `@tommy-ca/lazypi@<version>` — and then
tries to run the bin from `./node_modules/.bin`, which never exists for a
project's own name. Only README/FAQ troubleshooting is affected; the
published artifact itself passed all checks.

## What Changes

- README Troubleshooting: fold the `bunx`-only stale-cache entry into a
  runner-agnostic one covering `npx` (`~/.npm/_npx`) too; add a short entry
  for the repo-directory `lazypi: not found` quirk with the "run from any
  other directory" remedy.
- `docs/faq.html`: mirror both entries (FAQ parity, same language as the
  README).

## Capabilities

No capability changes — docs-only, no spec delta (Recipes: `skip_specs: true`).

## Impact

- `README.md`, `docs/faq.html`
- No code or catalog changes; 0.8.0 artifact untouched.