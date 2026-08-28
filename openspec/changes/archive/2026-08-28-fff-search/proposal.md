# Add the FFF search substrate

## Why

The harness spec's Step-5 pain table names `@ff-labs/pi-fff` for the
"find/grep floods context" failure — the last deferred essential. Audit
(2026-08-28, source: pi.dev + npm registry + official README): 0.10.5
published 2026-08-16, ~6.2K downloads/wk, MIT with SLSA provenance, active
dev/nightly cadence, peers exactly `@earendil-works/pi-coding-agent` +
`@earendil-works/pi-tui` + `@sinclair/typebox`. The default `tools-and-ui`
mode is additive: it registers `fffind` / `ffgrep` / `fff-multi-grep`
alongside built-in `find`/`grep` (only `override` mode replaces their names),
so a catalog install is non-invasive. The surrounding landscape (fork
releases, pi-fzf, pi-reflag, pi-multi-grep) confirms no competing package
matches its approach — native in-memory index, no subprocess per call,
frecency/history ranking, SIMD grep, cursor pagination.

## What Changes

- Add `fff` (`npm:@ff-labs/pi-fff`) to `tools`. Catalog 15 → 16 (tools 4 → 5).
- Default mode stays `tools-and-ui`; built-in `find`/`grep` remain available.
- The harness's Context Hygiene requirement gains a search-substrate scenario
  (paged cursor output instead of unbounded dumps).

## Capabilities

### Modified Capabilities

- `lazypi/installer`: catalog model (16 entries, tools +1) and an ADDED
  Search Tools requirement
- `harness/control-plane`: Context Hygiene gains a search-substrate scenario

## Impact

- `bin/lazypi.mjs` — one tools entry; help text
- `docs/` — fff page, sidebar + cards, counts 15 → 16; copy describes
  "additive search tools" not "replaces find/grep" (override-only)
- `openspec/changes/fork-pi-packages` — installer delta resynced to the
  16-shape
- Note for operators: default home-directory indexing on `$HOME`-launched
  sessions can be disabled with `FFF_ENABLE_HOME_SCAN=0` or
  `--fff-enable-home-scan=false`.