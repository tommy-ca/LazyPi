# Fix local-project installs and unknown-arg exit code

## Why

The npx/bunx audit of the published fork against a real pi (0.84.3) found two
behavior gaps. `install --local` fails on every un-approved project: pi
rejects local config modification with "Project is not trusted" unless
`--approve` is passed, so the documented `-l/--local` flag is broken for new
projects. And an unknown command or argument prints help but exits 0,
masking usage errors (the `switch` default of 2 is unreachable).

## What Changes

- `bin/lazypi.mjs`: local mode (`-l/--local`) appends `--approve` to every pi
  spawn that touches project config — install, remove, and legacy-source
  migration removals. Global mode is untouched, so the security gate for
  shared environments is preserved; `--approve` is pi's own per-command
  mechanism for the project the operator explicitly targeted.
- `bin/lazypi.mjs`: unknown arguments print help and exit 2 instead of 0.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Commands gains two scenarios (local trust, unknown
  argument exit code)

## Impact

- `bin/lazypi.mjs` — two command paths
- `openspec/specs/lazypi/installer/spec.md` — delta applied at archive
- Released as patch 0.6.5; the runner audit (npx + bunx) re-runs against the
  registry artifact