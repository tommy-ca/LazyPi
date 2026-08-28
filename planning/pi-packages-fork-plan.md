# LazyPi — Plan: fork the pi-packages

Status: draft · **Execution 2026-08-28: catalog simplification + repo fork DONE (see spec §6). Owned-fork publishing (Phase 0–2 below) still pending.**
Executes `requirements.md` (FR-1…FR-10) and `design.md` dispositions. Phases are sequential; each ends with acceptance evidence.

---

## Actually executed (2026-08-28) — 18-package catalog, fork pushed

- Catalog: **core** (subagents, pi-ask-user, goal, btw, context-usage, plan, simplify), **tools** (web-access, memory, mcp, add-dir, interactive-shell, claude-cli, prompt-templates), **research** (ralph-wiggum), **themes** (hackerman, curated-themes, terminal-theme). Dropped 9 packages incl. compound (bun/manifest machinery removed) and the checkbox `todos` anti-pattern (replaced by `@narumitw/pi-goal`). Added `pi-context-usage`.
- Installer: −425 lines (`bin/lazypi.mjs`); load-order and compound special-cases gone; doctor/status/update simplified; tests green (21/21); packed smoke green.
- Fork: `tommy-ca/LazyPi` created and pushed (master), release-please gated to manual, docs site trimmed to the catalog with Goal + Context Usage pages.
- **Not done — the owned forks themselves.** Phase 0–2 below remain the plan; `legacySources` migration is ready to repoint catalog sources to `@tommy-ca/pi-*` once published (D7).

## Phase 0 — Verify and scaffold (½ day)

1. Confirm decisions D1–D6 with the operator (npm scope, repo placement,
   todos/compound/gist-additions/theme dispositions).
2. Verify npm scope ownership:
   ```bash
   npm view @<scope>/pi-subagents   # expect 404 (unclaimed, not owned)
   npm whoami                       # account must control the scope
   ```
3. Scaffold `pi-packages` monorepo (per spec §2): workspaces, biome, vitest,
   tsconfig, husky, CI (node 22/24, coverage, publish-on-tag), readme-standard
   template, `scripts/sync-versions.js` + `scripts/release.mjs` (port from
   rpiv-mono).
4. Seed one canary package (e.g. the smallest fork) end-to-end: fork → rename
   scope → test → publish → `pi install npm:@<scope>/pi-canary` on a clean Pi.
   **Accept:** canary installs, loads, passes ship-manifest test; scope verified.

## Phase 1 — Tier 1 control plane (3–7 days)

Fork and publish, in order:

1. `pi-subagents` — agent contract preserved; carry `subagents.agentOverrides`
   model-blanking doc (lazypi already applies it).
2. `pi-ask-user` — typed options; stop-on-ambiguity defaults.
3. `pi-web-tools` (replaces `web-access`) — provider-pluggable fetch/search,
   keyless default provider.
4. `pi-btw` — /btw side thread; must not mutate main session.
5. `pi-todo` (own overlay) — rpiv-todo-style, survives `/reload`; NOT a checkbox
   list (spec anti-pattern).
6. `pi-memory` — fork of pi-memory-md; memory format owned.

Per package: ship-manifest test, biome clean, README front-door, `docs/` deep
docs, publish under `@<scope>/pi-*`.
**Accept:** every package passes spec §4 checklist; `pi install` + `/reload` clean
on minimum pi core; lockstep version bump tagged.

## Phase 2 — Tier 2 (2–3 days)

1. `pi-goal` (fork `@narumitw/pi-goal` surface: goal_complete/goal_blocked/
   goal_wait).
2. `pi-context-usage` (fork: /context dot grid).
3. Pin or replace `autoresearch` (`legacySources` + pinned commit, or drop in
   favor of `ralph-wiggum` + `goal` + forked `pi-subagents` loops).
**Accept:** both new forks pass checklist; unpinned-git count in catalog = 0 (FR-7).

## Phase 3 — LazyPi catalog integration (1–2 days)

In `bin/lazypi.mjs`:

1. Edit affected entries: set `source` → fork, `legacySources` → upstream
   source(s), `forked: true` (model on the existing `memory` legacy block).
2. Add new entries: `goal`, `context-usage` (and per D5: `fff`, `mention-skill`,
   `pi-skillful`).
3. `status`: grouped "Owned forks" section (FR-6). `doctor`: forked entries shown
   as reviewed-owned. Keep `expectedPackageSources()` self-deriving; fix any
   hardcoded count in tests.
4. Docs: fork package pages under `docs/docs/packages/` (template:
   `subagents.html`), update index pages, README, sidebar includes, and every
   named count (`\d+ packages`); themes page only if a theme forked (D6).
5. Run local: `npm test`, `node bin/lazypi.mjs status`, `doctor`,
   `scripts/packed-cli-smoke.mjs`.
**Accept:** catalog reflects fork set; CI test.yml passes on Linux (and Windows
smoke on dispatch); docs counts match; FR-4/5/6/8/9 evidenced.

## Phase 4 — Release and migration (½ day)

1. PR → release-please → lazypi 0.7.0 to npm.
2. On the dev machine: `npx @robzolkos/lazypi install` → verify legacy
   remove/install migration of Tier-1 sources; `status` shows forks installed;
   `pi /reload` clean (FR-10).
3. Update `add-package` skill: document fork-specific steps (fork marker,
   legacySources, status/doctor sections) so future catalog work follows the
   pattern.
4. Document the fork program in `CHANGELOG.md` and the site (docs overview +
   packages index).
**Accept:** clean install on a fresh VM (Linux + Windows), legacy migration
verified, user's settings.json migrated with zero manual edits.

---

## Ordering rationale

Control plane first (Phase 1) because the harness spec's invariants — ask-gate,
single-writer subagents, research off the writer, context hygiene — all route
through those five packages. Pinning/forks of memory close the A1 supply-chain
holes immediately. Catalog integration (Phase 3) is deliberately last: publish
first, then repoint, so at no point does a catalog source point at an unpublished
artifact.

## Out of scope until D4 resolves

- Replacing/dropping `compound` (frozen in v1; removal would also delete its
  doctor/install/migration special cases and the bun dependency).
- Forking themes (D6), `plan`, `simplify`, `ralph-wiggum`, `usage` —
  reviewed-third-party for now.

## Todo mapping (for execution tracking)

- [ ] D1–D6 confirmed · scope verified (Phase 0)
- [ ] Monorepo scaffolded; canary published (Phase 0)
- [ ] 6 Tier-1 forks published w/ ship-manifest tests (Phase 1)
- [ ] goal + context-usage published; autoresearch pinned/replaced (Phase 2)
- [ ] Catalog + docs updated; CI green (Phase 3)
- [ ] 0.7.0 released; own machine migrated; skill updated (Phase 4)