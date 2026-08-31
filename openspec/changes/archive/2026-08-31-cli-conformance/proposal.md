# Conform the CLI help and no-pi behavior to the Dropped-packages stance

## Why

A help/audit pass (2026-08-31) found two CLI behaviors that contradict the
repo's settled contract, plus one gate gap:

1. The help text still lists `skill-args`, `mcp`, `ralph-wiggum`, and
   `curated-themes` as "Non-catalog extras" with `pi install npm:<source>`
   instructions, but those npm names do not resolve to Pi packages:
   `npm:skill-args` and `npm:curated-themes` 404, `npm:mcp` is the Model
   Context Protocol SDK, and `npm:ralph-wiggum` is an unrelated 0.0.0
   placeholder. The Dropped packages scenario, the FAQ, and the philosophy
   page say the opposite: these are outside the catalog, "not LazyPi
   extras", and `pi install` still works for them. The help contradicts the
   docs and misdirects users to wrong or missing packages.
2. With no `pi` executable on PATH, a non-TTY run (CI, cron, pipe) blocks
   forever on a clack confirm prompt instead of failing. Reproduced with
   `</dev/null` on a stripped PATH: the prompt renders and hangs until
   killed. Non-interactive runs SHALL fail fast with exit 127.
3. CI never runs `npm run spec:validate` — the release gate from the
   Release Flow requirement — so spec drift (like the help text) passes CI.

## What Changes

- CLI help: drop the "Non-catalog extras" stanza that merchandised Dropped
  packages with wrong `npm:` sources; the Categories block instead notes
  that those packages are outside the catalog and `pi install` still works.
- `ensurePi`: gate the install-Pi confirm on interactivity; a non-TTY run
  without `--yes` prints an error and exits 127 instead of prompting.
- Dropped packages scenario: pin that the CLI help SHALL NOT advertise
  Dropped packages as installable extras.
- Re-scope the dead "Skill arguments source" scenario (its WHEN can never
  fire while `skill-args` is Dropped) to the promotion path: the canonical
  source for a future catalog promotion. The scenario name stays — a
  MODIFIED requirement replaces the whole block and archive refuses to
  drop it.
- New Commands scenario: `install`/`update` without `pi` SHALL NOT prompt
  on a non-TTY and SHALL exit 127.
- Self-Deriving CI: pin that CI SHALL run `npm run spec:validate`, and add
  the step to the linux test job so spec drift fails CI.
- CHANGELOG Unreleased entry.

No new CLI flags, no catalog membership change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `installer` — Catalog Model: Dropped packages scenario pins the help
  text; "Skill arguments source" becomes the promotion-path scenario.
- `installer` — Commands: new "Missing pi" scenario.
- `installer` — Self-Deriving CI: "Catalog shape pin" adds the
  `spec:validate` CI gate.