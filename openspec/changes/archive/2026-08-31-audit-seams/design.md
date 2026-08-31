# Design: audit seams

## Context

Stay in `bin/lazypi.mjs`. Do not split the file. Tests already import
`parseList` and `buildSpawnOptions`.

## Synthesis

Base is the **minimal-guards** sketch. Graft Result-style returns only
where tests need them. `parseArgs` grows `usageError`. Helpers do not call
`process.exit` for selector validation. `writeSubagentOverrides` returns
`changed: false` when the six `{ model: "" }` slots already exist and
merges into existing objects. Windows resolves `.cmd` then uses
`shell: false` for `pi`/`npm` (root cause), not a metacharacter denylist
(incomplete).

Rejected: a full Result type rewrite of every cmd. Too large for four
seams. Rejected: keep `shell: true` and deny `|` `&`. Prefix-match
legacy strings can still smuggle cmd syntax.

## Next step

TDD: export `parseArgs`/`resolveSelection`/`writeSubagentOverrides` or
spawn the CLI for usage-exit 2, then fill the bodies.
