# Simplify catalog cuts: dead essential field and runPi wrapper

## Why

The simplify/ponytail audit (2026-08-29, following the 0.8.0 release
validation) found two dead-weight items in `bin/lazypi.mjs` and one style
nit: every `PACKAGES` entry carried `essential: true` with zero readers in
code, tests, or spec (14 removals, a vestige of the superseded catalog-trim
where the field drove selection); the `runPi` wrapper delegated to
`spawnCommand` for exactly one caller; and `test/sources-match.test.mjs`
lacked a trailing newline. Pure deletion — no behavior change, no spec delta.

## What Changes

- `bin/lazypi.mjs`: drop `essential: true` from all 14 catalog entries
  (including the multiline `btw` entry); delete the single-caller `runPi`
  wrapper and inline the `cmdUpdate` delegate as a one-line
  `spawnCommand(...).status ?? 1`.
- `test/sources-match.test.mjs`: add the missing trailing newline.

## Capabilities

No capability changes — refactor/cleanup only (`skip_specs: true`, Recipe 5).

## Impact

- `bin/lazypi.mjs` (−17 lines), `test/sources-match.test.mjs`
- The `essential` concept KEEPS its prose meaning ("12 essential packages")
  in README/docs — only the dead data field goes away.