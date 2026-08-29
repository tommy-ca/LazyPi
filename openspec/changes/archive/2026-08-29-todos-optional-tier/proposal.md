# Todos joins the optional tier

## Why

Re-audit of the todo-list need on real evidence: across the operator's
session history the structured todo tool logged 75 call sites in 4 session
directories — multi-step work genuinely uses visible tracking, and this
harness's own change flow just exercised it for the optional-tier work.
The original drop rationale ("checkbox anti-pattern") applied to verbatim
checklist contracts, which is not how the tracker is used (items close the
moment a step finishes).

`pi-manage-todo-list` also publishes to npm (0.4.0, same tintinweb repo) —
consistent with the floating-npm convention of every other catalog entry.
Verdict: worth catalog management, not a core default → joins the optional
tier, exactly like autoresearch and interactive-shell before it.

## What Changes

- `bin/lazypi.mjs`: optional entry `todos` → `npm:pi-manage-todo-list`
  with `legacySources: ["git:github.com/tintinweb/pi-manage-todo-list"]`
  (the operator's pinned git form matches via the `@`-suffix rule); help
  text lists todo tracking in the optional category
- Docs: new `todos.html` package page, sidebar, packages index (16, card),
  landing grid + stat (16), "What it installs" optional row, README +
  installation page copy
- Operator install migrated live: `pi remove
  git:github.com/tintinweb/pi-manage-todo-list@b75c449…` →
  `pi install npm:pi-manage-todo-list`; settings hold only the npm source

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model — Lean catalog shape becomes 16
  entries (12 core + 4 optional); Optional sources scenario gains `todos`
  (`npm:pi-manage-todo-list`, git form in `legacySources`); Dropped
  packages list amended (todos removed)

## Impact

- `bin/lazypi.mjs`, `docs/` (todos.html, sidebar, packages index, landing,
  docs index, installation, README)
- No CI/e2e changes (counts and sources derive from `PACKAGES`)