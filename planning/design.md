# LazyPi — Design (fork/keep/replace matrix)

Status: draft · **Resolved 2026-08-28: catalog simplified and executed in this repo (see §6).**
Dispositions for all 25 original catalog entries + gist-candidate additions, mapped against rpiv-mono analogs and the user's own harness spec (gist).

---

## 1. Disposition matrix

| id (cat) | current source | risk | rpiv-mono analog | harness-spec stance | disposition |
| --- | --- | --- | --- | --- | --- |
| subagents (core) | npm:pi-subagents | central substrate; third-party | @tintinweb/pi-subagents (peer dep) | centerpiece P1 | **FORK** (Tier 1) |
| pi-ask-user (core) | npm:pi-ask-user | third-party | rpiv-ask-user-question | ask-gate P3 | **FORK** (Tier 1) |
| web-access (core) | npm:pi-web-access | provider lock-in | rpiv-web-tools (pluggable providers) | Tavily-backed P6 | **FORK → pi-web-tools** (Tier 1) |
| btw (ui) | npm:pi-btw | third-party | rpiv-btw | P9 side thread, no main-thread pollution | **FORK** (Tier 1) |
| memory (core) | git VandeeFeng (unpinned) | A1 supply-chain | — (rpiv has telemetry instead) | keep memory | **FORK/PIN** (Tier 1) |
| todos (ui) | git tintinweb (pinned) | A2 brittle; spec conflict | rpiv-todo (live overlay) | **explicit anti-pattern: no checkbox todo** | **REPLACE** w/ own overlay (Tier 1, D3) |
| plan (core) | npm:@devkade/pi-plan | third-party | — (workflow skills) | plan mode not core; goal P7 | KEEP v1, observe (Tier 2 candidate) |
| autoresearch (research) | git davebcn87 (unpinned) | A1 | — (rpiv-workflow runtime) | no auto-parallel-everything | **PIN or replace** w/ rpiv-style workflow (Tier 2, D4-adjacent) |
| goal — *new* | — | — | — | P7 stop-on-done/blocked/wait | **ADD fork** (Tier 2, D5) |
| context-usage — *new* | — | — | — | P8 context budget | **ADD fork** (Tier 2, D5) |
| compound (frameworks) | npm:@every-env/compound-plugin | A3 biggest special case | — | omit frameworks; replace w/ subagents+goal | KEEP v1, freeze; defer (D4) |
| simplify (core) | npm:pi-simplify | low | — | P4 included | KEEP |
| add-dir (core) | npm:pi-add-dir | low | — | — | KEEP |
| mcp (core) | npm:pi-mcp-adapter | low; high value | — | MCP is out-of-core but user relies on it | KEEP |
| prompt-templates (core) | npm:pi-prompt-template-model | low | — | — | KEEP |
| claude-cli (core) | npm:pi-claude-cli | low | — | — | KEEP |
| extension-settings (ui) | @juanibiapina | load-order coupling | — | — | KEEP (fork only with powerbar) |
| powerbar (ui) | @juanibiapina | medium | — | — | KEEP |
| usage (ui) | @tmustier/pi-usage-extension | low | — | ≈ P8 (context) | KEEP v1; candidate merge w/ context-usage |
| raw-paste (ui) | @tmustier/pi-raw-paste | low | — | — | KEEP |
| interactive-shell (ui) | npm:pi-interactive-shell | specialized | — | — | KEEP |
| ralph-wiggum (research) | @tmustier/pi-ralph-wiggum | medium | — | goal-ish | KEEP v1 (candidate own fork if adopted) |
| plannotator (ui) | @plannotator/pi-extension | low | — | — | KEEP |
| slopchop (ui) | npm:pi-slopchop | low | — | ≈ simplify | KEEP |
| hackerman (themes) | git javierportillo (pinned) | A2 | — | — | KEEP pinned v1; optional own theme fork (D6) |
| curated-themes (themes) | @victor-software-house | low | — | — | KEEP |
| terminal-theme (themes) | npm:pi-terminal-theme | low | — | — | KEEP |
| fff — *new* | — | native build | — | P10 search substrate | **ADD fork optional** (Tier 3, D5) |
| mention-skill — *new* | — | — | — | P5 `$` mention | **ADD one optional** (Tier 3, D5) |
| pi-skillful — *new* | user has, not cataloged | low | — | P2 | ADD to catalog (keep upstream or fork) (D5) |

## 2. Recommended fork set by tier

- **Tier 1 (v1, 6 pkgs):** pi-subagents, pi-ask-user, pi-web-tools
  (replaces web-access), pi-btw, pi-todo (replaces todos), pi-memory (pin/fork).
  These are the harness control plane: schedule, ask, research network, side
  thread, task state, memory.
- **Tier 2 (v1.5, 2–3):** pi-goal (add), pi-context-usage (add), autoresearch →
  pin or rpiv-style workflow replace.
- **Tier 3 (optional):** pi-fff, pi-mention-skill, hackerman theme fork,
  simplify/ralph-wiggum forks if adopted long-term.

Rationale: the spec's "control plane ≈ 10 packages" maps to ≈ 8–9 after Tier 1+2,
matching G3. Everything else stays third-party-reviewed (per NFR security).

## 3. Fork sourcing strategy per package

- **pi-subagents:** upstream `pi-subagents` is used via `@tintinweb/pi-subagents`
  in rpiv-mono — do NOT reimplement; fork upstream, keep the agent contract
  (scout/researcher/worker/reviewer/oracle/delegate, workflowScript/runs.all/
  runs.run, fresh context), carry lazypi's model-blanking override doc into the
  fork README (settings `subagents.agentOverrides`).
- **pi-ask-user:** fork upstream `pi-ask-user` for API continuity; harness spec
  requires typed options + stop-on-ambiguity defaults.
- **pi-web-tools:** fork `pi-web-access`, add provider-switching (Brave/Tavily/
  SearXNG/…) per rpiv-web-tools design; default provider must work without an API
  key where possible (spec: search first, fetch only chosen URLs).
- **pi-btw:** fork; enforce "side threads MUST NOT mutate the main session"
  (spec P9).
- **pi-todo (own):** rpiv-todo-style live overlay that survives `/reload` and
  compaction; explicitly NOT a checkbox list (spec §6.2 / §11).
- **pi-memory:** fork `pi-memory-md` → own scope, or repoint catalog to a pinned
  commit of upstream; fork preferred so the memory format is user-owned.
- **pi-goal / pi-context-usage:** fork smallest viable surface from
  `@narumitw/pi-goal` and `pi-context-usage` (spec P7/P8 contracts: goal_complete/
  goal_blocked/goal_wait; /context dot grid).

## 4. LazyPi integration design

- Catalog edits: set `source`/`legacySources`/`forked` per spec §1. Keep `id`s
  stable (picker, status, remove, update, docs all key on `id`); only
  `web-access`→`web-tools` id rename is contemplated and only if the docs page is
  rewritten anyway.
- `status`: add a section header for forked entries; `doctor`: forked entries
  shown as reviewed-owned instead of third-party-fetch.
- Docs: per-fork pages in `docs/docs/packages/` (template: subagents.html),
  updates to `docs/docs/packages/index.html`, `docs/docs/index.html`, README,
  sidebar includes, named counts (search for `\d+ package`), themes page only if
  a theme is forked (D6).
- CI: `expectedPackageSources()` self-derives; no workflow edits except where
  tests hardcode counts (update `PACKAGES.length - 1` style assertions if `id`
  set changes size).
- Release: lazypi 0.7.0 following the fork program; migration is one `lazypi
  install`/`update` run (spec §3).

## 6. Executed (2026-08-28): simplified catalog, 18 packages

- **core** (control plane): subagents, pi-ask-user, goal, btw, context-usage, plan, simplify
- **tools** (capability): web-access, memory, mcp, add-dir, interactive-shell, claude-cli, prompt-templates
- **research**: ralph-wiggum
- **themes**: hackerman, curated-themes, terminal-theme

Dropped: plannotator, slopchop, extension-settings, powerbar, usage, raw-paste, todos, autoresearch, compound. The installer shed the load-order repair, compound manifest/legacy machinery, and bun dependency (−425 lines in `bin/lazypi.mjs`). Better-alternative replacements: `@narumitw/pi-goal` (replaces the checkbox todo anti-pattern), `pi-context-usage` (context budget).

Not yet executed (D7, per `pi-packages-fork-plan.md` Phase 0–2): publishing owned forks under `@tommy-ca/pi-*`. The catalog keeps working upstream sources until then; `legacySources` migration will repoint seamlessly.

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Fork maintenance burden (rpiv-mono proves this is real) | Tier by harness-criticality; trim forks to needed surface; readme-standard to cut doc debt; lockstep releases |
| npm scope not owned by user's npm account | Verify before Phase 1 (D1) |
| Pi core API drift (0.84.3 today) | peer deps `*` + CI that loads against installed core; fork ship-manifest test catches breaks |
| Upstream features users rely on get lost in fork | Ship-manifest + keep `legacySources` so rollback = one command |
| `compound` remains the complexity hotspot (D4) | Leave frozen in v1; track separately; drop requires removing doctor/install special-cases and bun dependency |
| Docs drift (A5) | FR-8 checklist in the add-package skill already covers; extend skill with fork-specific steps |