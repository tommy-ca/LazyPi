# Troubleshooting docs for broken extension dependency footprints

## Why

An audit of the 2026-08-31 workflow-tool failure found the root cause was not
LazyPi but the operator's pi-subagents install: the extension code lived in a
git checkout at `~/.pi/agent/extensions/subagent` (pi-subagents hardcodes its
config path there), but the checkout never got its runtime dependencies
(`acorn`, `jiti`, `typebox`, `yaml`) — so `scripted-workflow.ts` could not
`require.resolve("acorn")` and the `workflow` tool failed with the cryptic
`Cannot find module 'acorn'` for every script. `lazypi status` reported the
catalog 17/17 healthy the whole time: presence and runtime health are
different facts.

The fix (install the checkout's deps) is environment-side, but the lesson is
repo-side and durable:

1. A catalog package can be installed on paper and broken at runtime when
   its footprint is incomplete.
2. The repair path (`pi update`, reinstall, or removing a stale
   `~/.pi/agent/extensions/<name>` checkout that shadows the npm store) was
   not documented anywhere in the docs.
3. `pi list` resolves every package to `~/.pi/agent/npm/node_modules/<name>`;
   a stale `extensions/<name>` checkout can shadow in-flight module
   resolution while remaining invisible to `pi list`.

## What Changes

- New `Troubleshooting` requirement in the installer spec, pinning that the
  FAQ covers the missing-dependency failure mode and that the updating docs
  give the repair steps (update, reinstall, stale-checkout removal).
- FAQ: new item — "Why does Pi error with `Cannot find module 'acorn'`?" —
  with the incomplete-footprint explanation and repair steps.
- `updating.html`: new "Repairing a broken package" section with the two
  repair paths.
- Exploration record `openspec/explorations/extension-deps-audit.md` with
  the full evidence chain (root cause, exact fix, verification, residual).

No CLI behavior, PACKAGES, or catalog changes. No new capabilities.

## Capabilities

### New Capabilities

- `installer` — `Troubleshooting` requirement: repair guidance for broken
  package footprints.

### Modified Capabilities

None.