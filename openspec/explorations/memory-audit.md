# Memory audit — pi-memory (jayzeng) vs pi-memory-md (VandeeFeng) (research)

Source: `pi install npm:pi-memory` evaluation, 2026-08-29, against the
0.9.0 catalog and the Catalog membership criteria.

## The two candidates

| | `npm:pi-memory` (jayzeng) | `npm:pi-memory-md` (VandeeFeng) |
| --- | --- | --- |
| Version / currency | 0.4.2 · 2026-08-11 | 0.1.38 · npm channel live; operator installed as git |
| What it is | "Most popular memory extension for pi" (pi.dev listed); qmd-powered keyword/semantic/hybrid search over long-term memory, daily logs, scratchpad; plain markdown in `~/.pi/agent/memory/` | Letta-like git-backed markdown memory; prompt-append index; on-demand tool reads; multi-project spaces |
| Operator status | NOT installed | **Daily driver** — memory tools + 6 skills active in sessions, git source managed outside the catalog |
| Data format | `~/.pi/agent/memory/` markdown | git-backed markdown per project |

## Verdict

- **pi-memory (jayzeng): NOT adopted.** Compelling, maintained, popular —
  but the operator's memory stack already IS pi-memory-md, with a
  different data layout and active tooling. A second memory substrate
  duplicates the daily driver; switching would force a data-format
  migration with no demonstrated need. The lean harness ships ONE memory
  implementation (the "exactly one mention" precedent, generalized).
  Recorded here so a future audit doesn't re-litigate without new
  evidence (e.g. the operator actually wanting qmd semantic search).
- **pi-memory-md: promoted to the optional tier** (change
  2026-08-29-memory-optional-tier) — npm source per catalog convention,
  git form as legacy source (operator install migrated live), Dropped
  list amended, docs/counts updated.