# LazyPi — Requirements (audit-derived)

Status: draft · **Execution status 2026-08-28: catalog simplified to 18 packages (see specification.md §6); owned-fork publishing (G1/D7) still pending the `pi-packages` monorepo.**
Source: audit of `bin/lazypi.mjs` (v0.6.4), CI, tests, site; context from
[rpiv-mono](https://github.com/juicesharp/rpiv-mono) and the user's own harness spec
([gist `d3f3af63…`](https://gist.github.com/tommy-ca/d3f3af63c59f33899a09901bc94070c5)).

---

## 1. Context

LazyPi is an opinionated one-shot installer for the Pi coding agent. It installs Pi
itself, then a curated catalog of 25 packages across `core / ui / research /
frameworks / themes`, with `install / status / update / doctor / remove` commands,
idempotency, legacy-source migration, and a Jekyll site + docs.

The user wants to extend the model used by rpiv-mono (an npm-workspace monorepo of
owned, published Pi extensions) to their own harness: **update or replace some
catalog packages with forks owned by the user** ("fork the pi-packages"), guided by
their own Chasen-style 3-layer harness spec (AGENTS.md discipline / skills
capability / packages control plane).

**Assumption (recorded):** "fork the pi-packages" = create own copies of selected
Pi packages under the user's namespace (a `pi-packages` monorepo modeled on
rpiv-mono), then repoint the LazyPi catalog at those forks. If the intent was
instead to fork the entire `pi.dev` gallery or one specific repo, say so before
executing Phase 1.

## 2. Audit findings (current repo)

Strengths:

- Idempotent install; reads Pi `settings.json` and skips installed sources.
- Legacy-source migration exists (`legacySources` → remove-then-install), used for
  `memory` and `autoresearch`. This is the exact mechanism a fork migration needs.
- Git sources consistently get `npm_config_ignore_scripts=true`.
- `todos` and `hackerman` are commit-pinned; pinned sources are reproducible.
- Compound Engineering uses manifest-driven install/remove with managed-path
  bookkeeping instead of blind file deletion.
- Load-order repair (`extension-settings` before `powerbar`) + subagent
  model-blanking overrides applied automatically.
- Auth detection (env vars + `auth.json`) surfaces whether `/login` is needed.
- CI runs `npm test` + packed-CLI smoke + a real `lazypi --yes` install + exact
  settings-source assertion on Linux and Windows (incl. `--except compound`).

Weaknesses / risks:

| # | Finding | Risk |
| --- | --- | --- |
| A1 | `memory` (VandeeFeng/pi-memory-md) and `autoresearch` (davebcn87/pi-autoresearch) are **unpinned git heads** | supply-chain + reproducibility: a push upstream silently changes what users get |
| A2 | `todos` and `hackerman` are pinned git commits | stable but brittle: no upgrade path, no owner visibility |
| A3 | `compound` carries the largest special-case surface (bunx cleanup+install, manifest/legacy state, both offered in doctor) | most complex code path in the repo; upstream-driven |
| A4 | All npm sources float (`pi update` pulls latest); no pin policy | upgrade drift across the catalog |
| A5 | Catalog count and docs are hand-synced (`docs/`, README, sidebar, card grids, named counts) | stale-count risk on every catalog change; `add-package` skill documents the manual checklist |
| A6 | No metadata for ownership/source-of-truth per entry | cannot distinguish "owned fork" from "third-party" in status/doctor |
| A7 | Catalog philosophy (install all 25 by default) conflicts with the harness spec's "10 packages, count ≠ capability" and its anti-pattern chapter (explicitly omits checkbox todos — LazyPi still ships `todos`) | user-harness alignment gap |

## 3. Goals

G1. **Own the control plane.** Fork the packages the harness depends on most
    (`subagents`, ask gate, web tools, side-thread, todo overlay), reviewed source,
    published under the user's npm scope.
G2. **Eliminate unpinned-git risk.** Every catalog source resolves to a stable,
    owned artifact (npm package or pinned commit).
G3. **Align the catalog with the user's harness spec** (3-layer model, control
    plane ≈ 10 packages, no checkbox todo, ask-gate on ambiguity, fresh reviewers,
    research off the writer, context hygiene).
G4. **Follow the rpiv-mono conventions** that make owned packages tractable:
    mono-repo workspace, one package per dir, readme-standard, per-package
    ship-manifest tests, version-synced releases, CI matrix.
G5. **Grow LazyPi minimally.** Reuse the existing `legacySources` migration; keep
    ids stable where possible; keep CI assertions deriving from `PACKAGES` (they
    already self-update).

## 4. Non-goals

- Forking every package (maintenance burden; rpiv-mono demonstrates real cost).
- Rewriting lazypi's installer architecture or its picker/confirm UX.
- Auto-parallelizing everything (spec anti-pattern).
- Replacing `compound` in v1 of the fork program (decision deferred, see plan).
- Forking Pi core (`@earendil-works/pi-coding-agent`).

## 5. Functional requirements (fork initiative)

| FR | Requirement |
| --- | --- |
| FR-1 | A monorepo `pi-packages` (npm workspaces) holds all forked packages; each is individually `pi install`-able from npm. |
| FR-2 | Forked package scope is reserved before publishing; package names are `@<scope>/pi-<name>`. |
| FR-3 | Each fork ships a ship-manifest test ("package can be loaded by Pi", required frontmatter, tools/commands register) modeled on rpiv-mono. TypeScript + biome + vitest. |
| FR-4 | LazyPi catalog entries for forked packages: `source` = the fork's npm source, `legacySources` = the replaced upstream sources, stable `id`s. |
| FR-5 | `lazypi install` on an entry whose legacy source is present removes the legacy source first (existing behavior, unchanged). |
| FR-6 | `lazypi status` and `doctor` distinguish forked (owned) entries from third-party entries. |
| FR-7 | No catalog source is an unpinned git head after the fork program lands (all git sources pinned or replaced). |
| FR-8 | Catalog/docs counts stay in sync — update README, `docs/docs/index.html`, `docs/docs/packages/index.html`, theme counts when sources/packages change. |
| FR-9 | CI `test.yml` keeps asserting exact installed sources; derivation from `PACKAGES` is preserved so catalog edits flow through. |
| FR-10 | The user's own `~/.pi/agent/settings.json` migrates without manual surgery (via `lazypi install`/`update` legacy-source path). |

## 6. Non-functional requirements

- **Security:** forked = reviewed source under user control; keep the spec's rule
  that remaining third-party packages are reviewed before install; Pi remains
  maximum-privilege (no sandbox added).
- **Reproducibility:** published fork versions are immutable npm artifacts; git
  sources that stay third-party get commit pins.
- **Maintainability:** forks are trimmed to the surface LazyPi/harness needs, not
  wholesale copies; deep docs go to per-package `docs/` (readme-standard).
- **Compatibility:** forks track the installed Pi core API (peer deps on
  `@earendil-works/pi-*`, like rpiv-mono); version bumps when Pi core majors.
- **CI cost:** keep the existing 3-OS surface; fork repo gets its own Linux CI
  (node 22/24 matrix like rpiv-mono).

## 7. Constraints

- LazyPi `source` strings are limited to what `pi install` accepts: `npm:<name>`
  and `git:github.com/<owner>/<repo>[@<sha>]`.
- `pi` settings entries are strings or `{source}` objects (already handled).
- npm scope ownership must be verified (a 404 on `@tommy-ca/pi-subagents` today
  means the package is *unclaimed* — scope ownership is a separate npm-account
  check).
- `compound` install requires `bun` on PATH; fork/replace decision must keep or
  explicitly abandon that dependency.
- Active repo branch: `master`; releases via release-please to npm under
  `@robzolkos/lazypi`.