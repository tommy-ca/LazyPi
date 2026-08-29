# Memory joins the optional tier; pi-memory evaluated, not adopted

## Why

Audit of `npm:pi-memory` (jayzeng, 0.4.2, "the most popular memory
extension for pi", qmd-powered semantic search) against the Catalog
membership criteria. Verdict: compelling, but the operator's memory
daily-driver is already `pi-memory-md` (VandeeFeng — memory tools and six
skills active across sessions, installed as an out-of-catalog git
source). A second memory substrate would duplicate the installed
implementation with a different data format. The lean harness ships one
memory implementation — so the audit **does not adopt pi-memory**, and
instead promotes the installed daily driver `pi-memory-md` to the
optional tier, following the autoresearch/todos pattern: npm source
(0.1.38 exists) with the git form as a legacy source.

## What Changes

- `bin/lazypi.mjs`: optional entry `memory` → `npm:pi-memory-md` with
  `legacySources: ["git:github.com/VandeeFeng/pi-memory-md"]`; help text
  lists markdown memory in the optional category
- Live migration: `pi remove git:github.com/VandeeFeng/pi-memory-md` →
  `pi install npm:pi-memory-md`; skills intact under the npm install;
  settings hold only the npm source; catalog 17/17
- Docs: new `memory.html` page (with the pi-memory comparison),
  sidebar (including the previously-missed Todos link from the
  2026-08-29 todos change — found during this sweep), packages index
  (17, card), landing grid + stat (17), "What it installs" optional row,
  README + installation page
- Spec: Lean shape 17 entries (12 core + 5 optional); Optional sources
  gains `memory`; Dropped list amended (memory removed — re-audited, not
  dropped)
- Exploration `memory-audit.md` records the pi-memory comparison and the
  one-memory-substrate rule

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model — 17 entries, `memory` optional
  source added, Dropped list amended

## Impact

- `bin/lazypi.mjs`, `docs/` (memory.html, sidebar, packages index,
  landing, docs index, installation, README)
- No CI/e2e changes (counts and sources derive from `PACKAGES`)