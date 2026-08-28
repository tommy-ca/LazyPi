# Design — pi-packages monorepo

Companion to `proposal.md`. Decides the repo shape, package contract, and the
LazyPi integration path. Mirrors the rpiv-mono conventions audited in
`explorations/rpiv-mono-audit.md`.

## 1. Repo layout

```
pi-packages/
  package.json            # private root; workspaces: ["packages/*"], engines node>=22
  tsconfig.base.json      # single shared config; noEmit: true
  biome.json              # biome check --write --error-on-warnings
  vitest.config.ts        # include ['packages/*/**/*.test.ts']
  scripts/
    sync-versions.js      # enforce one shared version across packages/*
    release.mjs           # version:patch|minor|major, publish each workspace
  packages/
    pi-subagents/         # fork of pi-subagents       (agent contract preserved)
    pi-ask-user/          # fork of pi-ask-user        (typed options, ask-gate defaults)
    pi-web-tools/         # fork of pi-web-access      (pluggable providers, keyless default)
    pi-btw/               # fork of pi-btw             (side thread, non-mutating)
    pi-todo/              # own overlay (rpiv-todo-style, survives /reload; NOT a checkbox list)
    pi-memory/            # fork of pi-memory-md       (owned memory format)
    pi-goal/              # fork of @narumitw/pi-goal  (smallest viable surface)
    pi-context-usage/     # fork of pi-context-usage   (smallest viable surface)
```

## 2. Per-package contract

- `package.json`: `name: "@tommy-ca/pi-<name>"`, `type: "module"`, a `pi`
  field (`pi.extensions: ["./index.ts"]`, `pi.skills` where relevant), peer
  deps on `@earendil-works/pi-*` as `"*"`, `files` listing raw `.ts` sources +
  asset dirs (no `*.test.ts`, no gap).
- README adheres to the front-door standard (what / install+restart / shortest
  path / 5–7 capabilities / config knobs; reference material to `docs/`).
- Every fork ships a ship-manifest test: loads under a minimal Pi-API harness,
  asserts required frontmatter and tool/command registration, installable from
  the packed artifact.
- Forks are trimmed to the harness surface, not wholesale copies; upstream
  license headers retained.
- No decision-code comments; no unchecked TODO noise in committed `.ts`
  (repo guard, ported from rpiv-mono).

## 3. Fork sourcing decisions

| Package | Fork source | Trim notes |
| --- | --- | --- |
| pi-subagents | upstream pi-subagents | keep agent contract + workflowScript/runs.all/runs.run/fresh; carry the subagents.agentOverrides blanking doc |
| pi-ask-user | upstream pi-ask-user | keep tool schema + settings; typed options default |
| pi-web-tools | pi-web-access | add provider pluggability (Brave/Tavily/Serper/Exa/SearXNG/…) with a keyless default provider |
| pi-btw | upstream pi-btw | enforce non-mutating side threads |
| pi-todo | authored (rpiv-todo style) | live overlay surviving /reload + compaction |
| pi-memory | pi-memory-md | owned storage format; versioned |
| pi-goal / pi-context-usage | @narumitw + pi-context-usage | smallest viable surface |

Not forked: mcp, plan, simplify, add-dir, interactive-shell, claude-cli,
prompt-templates, ralph-wiggum, themes — reviewed third-party (spec:
`harness/control-plane` Security Posture).

## 4. LazyPi integration

- Catalog edits per entry: `source: "npm:@tommy-ca/pi-<name>"`,
  `legacySources: [<upstream>]`, `forked: true`. Ids stay stable (picker,
  status, remove, update, docs key on `id`).
- Migration is the existing path: detect legacy source → `pi remove <legacy>`
  → `pi install <source>` on the next `install`/`update`.
- `status` groups forked entries under "Owned forks"; `doctor` marks them
  reviewed-owned.
- Docs: per-fork pages under `docs/docs/packages/` (template: subagents.html),
  sidebar + index + counts; themes page only if a theme is ever forked.
- CI stays self-deriving (`expectedPackageSources()`); test counters updated
  only when the catalog size changes.

## 5. Rollout order

1. Scaffold monorepo; publish a canary fork end-to-end (Phase 0).
2. Publish Tier 1 (six packages) with ship-manifest tests (Phase 1).
3. Publish Tier 2 (goal, context-usage); pin or replace `memory` (Phase 2).
4. Repoint the LazyPi catalog; update status/doctor; docs (Phase 3).
5. Release `@tommy-ca/lazypi` 0.7.x; migrate the operator's own settings
   (Phase 4).

## 6. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Fork maintenance burden | Tier by criticality; trim surface; lockstep releases; front-door READMEs |
| npm scope not owned | Verify `npm whoami` owns `@tommy-ca` before first publish |
| Pi core API drift | peer deps `*`; ship-manifest tests load against the installed core |
| Regressions vs upstream | keep `legacySources` → one-command rollback |
| Unpinned memory head | fork/pin in Tier 1 (Phase 1) |