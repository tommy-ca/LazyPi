# Keep the essential packages: the pi harness core

## Why

The catalog drifted back to 16 packages; six are not part of the harness
spec's Layer-3 control plane. A categorization audit (2026-08-28, cross-checked
against the published set in explorations/harness-spec-audit.md) maps the
spec's "Catalog — source harness (10 packages)" to the catalog one-to-one:
subagents (P1), pi-skillful (P2), ask (P3), simplify (P4), $ mention (P5),
web research (P6), goal (P7), context-usage (P8), btw (P9), fff (P10). Those
ten are the harness core — the packages vital to build the three-layer model
(AGENTS.md discipline is files, not packages; the skill surface is visibility
+ mention; the control plane is the ten). The remaining six (skill-args,
memory, mcp, interactive-shell, ralph-wiggum, curated-themes) are optional
extras not in the spec, installable directly with `pi install` but no longer
cataloged.

## What Changes

- Catalog trimmed 16 → 10, all in the single `core` category. Each entry is
  tagged `essential: true` (the categorization is recorded in the catalog
  model: non-essential packages SHALL NOT be cataloged).
- Dropped from the catalog (still directly installable): skill-args
  (@juicesharp/rpiv-args), memory (VandeeFeng/pi-memory-md), mcp
  (pi-mcp-adapter), interactive-shell (pi-interactive-shell), ralph-wiggum
  (@tmustier/pi-ralph-wiggum), curated-themes (the only theme package — the
  themes category, themes.html site page, and nav entry go with it).
- Harness spec: "Control Plane Catalog" explicitly covers skill visibility,
  $ mention, and a search substrate; "Skill Parameters" is re-scoped from a
  shipped capability to an optional capability (when a parameters package is
  installed) since skill-args leaves the catalog.
- Docs: categories table, counts (10), hero/compare/stats, nav, and package
  page inventory updated; the six optional extras are documented on the docs
  overview with their direct install sources.

## Categorization (recorded)

| Essential (harness core) | Spec ref | Non-essential (dropped, direct install) |
| --- | --- | --- |
| subagents (pi-subagents) | P1 | skill-args (@juicesharp/rpiv-args) |
| pi-skillful | P2 | memory (VandeeFeng/pi-memory-md) |
| pi-ask-user | P3 | mcp (pi-mcp-adapter) |
| simplify | P4 | interactive-shell (pi-interactive-shell) |
| mention-skill (@zigai) | P5 | ralph-wiggum (@tmustier/pi-ralph-wiggum) |
| web-access | P6 | curated-themes |
| goal (@narumitw) | P7 |  |
| context-usage | P8 |  |
| btw (@narumitw) | P9 |  |
| fff (@ff-labs) | P10 |  |

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model (10 entries, single core category,
  `essential` tag; dropped list extended to 21)
- `harness/control-plane`: Control Plane Catalog (skill surface + search
  substrate explicit); Skill Parameters re-scoped to optional

## Impact

- `bin/lazypi.mjs` — 10 tagged entries, one category, help text
- `test/agent-dir.test.mjs` — assertions keyed to dropped ids (mcp, memory)
- `docs/` — delete 5 package pages + themes.html + themes.css, nav/sidebar/
  cards/chains, counts 10, optional-extras table on the overview, hero/og
- `README.md`, `docs/faq.html`, `docs/docs/first-steps.html`,
  `docs/docs/installation.html`
- `openspec/changes/fork-pi-packages` — installer delta resynced to the
  10-shape; fork-set notes for dropped packages become moot (memory,
  interactive-shell, ralph-wiggum, themes no longer cataloged)