# Tasks — Keep the essential packages: the pi harness core

## 1. Audit and categorization

- [x] 1.1 Cross-check the essential/non-essential split against the harness spec's P1–P10 set (reviewer: 10/10 kept agree)
- [x] 1.2 Inventory every reference to the six dropped ids + themes (scout: full file:line map)

## 2. Catalog and installer

- [x] 2.1 Trim `PACKAGES` to the 10 harness-core entries, all `core`, each tagged `essential: true`; `CATEGORIES = ["core"]`
- [x] 2.2 Update help text (core line, drop tools/research/themes lines, fix the `--only` example)

## 3. Specs

- [x] 3.1 Write the harness-core deltas (installer Catalog Model 10 + essential tier; harness Control Plane Catalog + Skill Parameters re-scope)
- [x] 3.2 `openspec validate --all` green; archive the change
- [x] 3.3 Resync fork-pi-packages installer delta to the 10-shape; validate again

## 4. Docs

- [x] 4.1 Delete skill-args/memory/mcp-adapter/interactive-shell/ralph-wiggum pages + themes.html + themes.css; nav/sidebar/cards/chains
- [x] 4.2 Counts to 10; hero/og/stats/compare updated; optional-extras table on the overview
- [x] 4.3 README, FAQ, first-steps, installation enumerations

## 5. Tests

- [x] 5.1 Fix agent-dir status/remove assertions keyed to mcp/memory
- [x] 5.2 `npm test` green; packed CLI smoke green

## 6. Ship

- [x] 6.1 Fresh review of the diff; fix findings
- [x] 6.2 Commit and push to the fork; CI green