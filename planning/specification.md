# LazyPi — Specification (catalog + fork conventions)

Status: draft · Companion to `requirements.md` (G1–G7, FR-1…FR-10).

---

## 1. Catalog data model (target)

Each `PACKAGES` entry gains an optional ownership marker. Existing fields
(`id`, `category`, `source`, `description`, `hint`, `legacySources`) stay.

```ts
type CatalogEntry = {
  id: string;                    // stable; unchanged for replaced packages
  category: "core" | "ui" | "research" | "frameworks" | "themes";
  source: string;                // new canonical source (fork first)
  legacySources?: string[];      // replaced upstream sources -> migrate-on-install
  forked?: true;                 // NEW: owned fork marker
  description: string;
  hint: string;
};
```

Semantics:

- `forked: true` ⇒ `source` points at `npm:@<own-scope>/pi-<name>` (or a pinned
  git URL of the owned monorepo). `status` groups these under "Owned forks";
  `doctor` reports them as reviewed-owned.
- `legacySources` drives the existing flow: on `install`, if a legacy source is in
  `settings.json`, lazypi runs `pi remove <legacy>` before `pi install <source>`.
  `update` likewise migrates `presence` → current source before `pi update
  --extensions`.
- New packages (goal, context-usage, …) are plain new entries; no legacy source.

`expectedPackageSources()` in `scripts/assert-installed-packages.mjs` derives from
`PACKAGES`, so catalog edits propagate to CI automatically. Only the `compound`
exclusion and test counters are hardcoded — keep it that way.

## 2. Fork repo conventions (modeled on rpiv-mono)

Target: `github.com/<owner>/pi-packages` (or existing `dev-env` manifest if a
monorepo already exists there — verify first).

```
pi-packages/
  package.json            # private root; workspaces: ["packages/*"]
  tsconfig.base.json
  biome.json              # lint+format gate (biome check --error-on-warnings)
  vitest.config.ts
  scripts/
    sync-versions.js      # keep all package versions in lockstep
    release.mjs           # version:patch|minor|major + publish per workspace
  packages/
    pi-subagents/         # fork of pi-subagents  (control substrate)
    pi-ask-user/          # fork of pi-ask-user   (ask gate)
    pi-web-tools/         # fork of pi-web-access (provider-pluggable fetch/search)
    pi-btw/               # fork of pi-btw        (side thread)
    pi-todo/              # own todo overlay      (replaces tintinweb todo)
    pi-memory/            # pin/fork of pi-memory-md
    pi-goal/              # fork or authored (spec P7)
    pi-context-usage/     # fork or authored (spec P8)
    … optional: pi-fff, pi-mention-skill, pi-hackerman-theme
  .github/workflows/ci.yml   # node 22/24 matrix, check + coverage, publish on tag
```

Per-package contract:

- `package.json`: `name: "@<scope>/pi-<name>"`, `type: "module"`, peer deps on
  `@earendil-works/pi-coding-agent` (and `pi-ai`/`pi-tui` where the API is used),
  `files` limited to what ships.
- README follows the rpiv readme-standard: front door (what/install/restart/
  shortest path/5–7 capabilities/config knobs deep-docs pointer); reference
  material in `docs/`.
- Every package ships a **ship-manifest test**: loads the package entry point in a
  minimal Pi-API harness, asserts required skill/prompt/extension frontmatter,
  tools/commands register, and that the package is installable (rpiv ships
  `ship-manifest.test.ts` in-workspace — mirror the pattern with vitest).
- No decision codes / no unapproved "TODO/XXX" noise: either drop them in the fork
  or justify (rpiv runs `check-no-decision-codes.mjs`).
- Versioning: patch/minor/major bumps all packages in lockstep (single release
  cadence); tag-synced changelogs.

## 3. Migration mechanics in LazyPi

1. Bump catalog: `source` → fork, `legacySources` → upstream source(s),
   `forked: true`.
2. User runs `npx @robzolkos/lazypi install` (or `update`).
3. Lazypi detects legacy source in `settings.json` → `pi remove <legacy>` →
   `pi install npm:@<scope>/pi-<name>` (existing `cmdInstall` migration path).
4. `status` lists the entry as installed (fork). Document in the 0.7.0 changelog
   that migration is one command; no manual editing of `settings.json`.

Edge cases specified:

- If legacy remove fails, the entry is reported failed and nothing installs
  (existing behavior — keep).
- If the fork publish lags upstream, `legacySources` keeps old installs working;
  no forced migration until the user re-runs install/update.
- `pi update --extensions` updates installed npm forks to latest published — this
  is the fork maintenance path (release fork → user `lazypi update`).

## 4. Package contract checklist (a package is "fork-ready")

- [ ] `pi install npm:@<scope>/pi-<name>` succeeds on a clean Pi; `/reload` shows
      no load errors.
- [ ] Required frontmatter valid on all shipped skills/prompts (name 1–64,
      `[a-z0-9-]+`, description ≤ 1024 with "what + when").
- [ ] Tools/commands register under expected names; no schema collisions with
      stock tools or siblings.
- [ ] Config writes go through the Pi config dir; nothing stores secrets in
      project files.
- [ ] Ship-manifest test passes; type-check + biome clean.
- [ ] README front-door matches the standard; deep docs live in `docs/`.
- [ ] Published artifact installs from npm (packed-cli style smoke in CI), not
      just from the workspace symlink.

## 5. Decisions (resolved 2026-08-28)

| D | Decision | Outcome |
| --- | --- | --- |
| D1 | npm scope | `@tommy-ca` chosen (unclaimed at resolution time). Owned-fork publishing deferred until the fork repo exists (F2); catalog currently uses working upstream sources. |
| D2 | Repo placement | Fork of `robzolkos/LazyPi` under `tommy-ca/LazyPi`; the fork hosts the simplified catalog. |
| D3 | `todos` disposition | **Dropped**; replaced by `@narumitw/pi-goal` (long-objective gate, harness-spec P7; checkbox todos are an anti-pattern §11). |
| D4 | `compound` disposition | **Dropped**. Removes bun requirement, manifest/legacy state machinery, doctor/install/remove special cases, and the dependency map. |
| D5 | gist additions | Added `goal` (`@narumitw/pi-goal`) and `context-usage` (`pi-context-usage`). `fff` / `mention-skill` / `pi-skillful` deferred (not essential; user already runs pi-skillful outside the catalog). |
| D6 | Theme forking | No theme forked; all three kept (hackerman stays commit-pinned). |

## 6. Catalog as executed (18 packages)

- **core** (7): subagents, pi-ask-user, goal, btw, context-usage, plan, simplify
- **tools** (7): web-access, memory, mcp, add-dir, interactive-shell, claude-cli, prompt-templates
- **research** (1): ralph-wiggum
- **themes** (3): hackerman, curated-themes, terminal-theme

Dropped (9): plannotator, slopchop, extension-settings, powerbar, usage, raw-paste, todos, autoresearch, compound.

## 7. Still open

| D | Decision | Hangs on |
| --- | --- | --- |
| D7 | Owned fork publishing (pi-subagents, ask-user, web-tools, btw, todo overlay, memory) | The `pi-packages` monorepo (Phase 0–2 of `pi-packages-fork-plan.md`). Until then catalog keeps upstream sources; `legacySources` migration is ready to repoint. |
| D8 | Catalog 0.7.x release | The fork's release-please is manual-only; publish `@tommy-ca/lazypi` when the fork is settled. |