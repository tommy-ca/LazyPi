# rpiv-mono Audit — conventions to reuse for the pi-packages fork

Source: `https://github.com/juicesharp/rpiv-mono` (workspace clone inspected at
the commit pinned by GitHub fetch, 2026-08-28). 15 packages in one npm
workspace; 12 publish to npm as `@juicesharp/rpiv-*`; three never leave the
repo (rpiv-site, rpiv-telemetry, test-utils).

## Package family

| Package | Role | Notes |
| --- | --- | --- |
| rpiv-pi | Umbrella: pipeline skills + 15 subagents + /wf workflows, ships /rpiv-setup | Zero tools; peer-lists every sibling |
| rpiv-args | `$1`/`$ARGUMENTS` placeholders + `` !`cmd` `` in skills | |
| rpiv-ask-user-question | Structured questionnaire to the user | LazyPi analog: pi-ask-user |
| rpiv-todo | Live task overlay surviving /reload + compaction | LazyPi analog: the dropped todo |
| rpiv-advisor | Escalate to a stronger reviewer model | |
| rpiv-web-tools | Web search + fetch, pluggable providers (Brave/Tavily/Serper/Exa/…) | LazyPi analog: pi-web-access |
| rpiv-workflow | `/wf` typed multi-stage pipeline runner (JSONL state) | |
| rpiv-btw | /btw side conversation | |
| rpiv-voice / rpiv-warp | On-device dictation; Warp notifications | Opt-in (absent from siblings.ts) |
| rpiv-i18n | Locale SDK + /languages for siblings | |
| rpiv-config | Shared XDG-aware JSON config I/O | Library only, not a Pi extension |
| rpiv-telemetry | MLflow instrumentation | Private; loaded from checkout |
| rpiv-site | Astro marketing site (rpiv-pi.com) | Private |
| test-utils | Shared vitest fixtures | Private |

Notable: rpiv-mono does **not** vendor pi-subagents — it peer-depends on
`@tintinweb/pi-subagents`, a third-party fork of pi-subagents. It re-implements
ask-user-question/todo/btw/web-tools rather than forking those upstream.

## Conventions worth copying (the "what good looks like")

1. **npm workspaces monorepo**, root `package.json` only; no per-package
   tsconfig (single `tsconfig.base.json`); biome as the one formatter/linter
   (`check --write --error-on-warnings`), vitest single runner, husky
   pre-commit/pre-push.
2. **Raw `.ts` publish**: `noEmit: true`; packages publish `.ts` sources and
   Pi loads them via a `pi` field in `package.json`
   (`pi.extensions: ["./index.ts"]`, optionally `pi.skills`). `files` arrays
   list sources + asset dirs, excluding `.rpiv/` and `*.test.ts`.
3. **Lockstep versions**: one shared version across `packages/*`, enforced by
   `scripts/sync-versions.js`; `release.mjs <patch|minor|major>` cuts a
   lockstep release. Sibling deps are `peerDependencies: "*"` to keep them out
   of bundles.
4. **Sibling registry**: a single `siblings.ts` in the umbrella drives
   `/rpiv-setup`, missing-plugin warnings, and presence detection. Opt-in
   packages are simply absent from the registry. No runtime cross-imports
   between siblings.
5. **Ship-manifest tests** (`*ship-manifest.test.ts`): each package proves it
   loads under a minimal Pi-API harness with the required frontmatter and
   tool/command registration.
6. **readme-standard**: front-door README (what/install/shortest path/5–7
   capabilities/config knobs), reference material moves to `docs/` per package.
7. **Repo guards**: `check-no-decision-codes.mjs` (no plan/phase codes in
   committed `.ts`), `check-slice-overlap.mjs`; CI matrix node 22/24 with
   coverage, publish on tag; guidance lives in `.rpiv/guidance/architecture.md`.

## Reuse map for `@tommy-ca/pi-*`

| rpiv-mono convention | Apply to fork as |
| --- | --- |
| workspace + biome + vitest + husky | `pi-packages` repo scaffold |
| lockstep versions + sync-versions/release scripts | release pipeline |
| `pi.extensions` field + raw .ts publish | every forked package |
| ship-manifest tests | per-package fork readiness check |
| readme-standard | README contract |
| sibling registry / setup command | optional umbrella package later |

Deliberate non-copies: no MLflow telemetry, no marketing site, no i18n/voice/
warp unless the operator wants them. Keep the fork set at the harness control
plane only (see `changes/fork-pi-packages/proposal.md`).
## 2026-08-28 addendum — provider/tool audit and alternatives verdict

npm-currency check (registry, 2026-08-28): all rpiv packages at 2.7.1
(published 2026-08-24), peer-depending on `@earendil-works/pi-coding-agent`
since the 2.x line. `@tintinweb/pi-subagents` 0.19.0 (2026-08-27, active:
12 releases in ~5 weeks) — the fork rpiv-mono peer-depends on. `pi-web-access`
0.27.0 (2026-08-28 — newer than rpiv-web-tools).

| Candidate from rpiv-mono | vs catalog | Verdict |
| --- | --- | --- |
| rpiv-web-tools (web_search, web_fetch; 10 providers, Brave default needs a key; SearXNG/Ollama self-hosted) | catalog has pi-web-access (web_search, fetch_content, get_search_content, source_check; 26 providers incl. keyless DuckDuckGo; zero-config search; video/PDF/GitHub; /websearch /curator /search) | **KEEP pi-web-access** — broader, zero-config, newer. Provider pluggability already exists upstream, so the planned owned fork differentiates on ownership/trim + keyless default, not provider logic. Fetch tool names differ (web_fetch vs fetch_content) — skills referencing either must match. |
| rpiv-ask-user-question (tool `ask_user_question`, typed questionnaire) | catalog has pi-ask-user (`ask_user`) | **KEEP pi-ask-user** — swapping would break the harness ask gate unless every call site is renamed. |
| @tintinweb/pi-subagents | catalog has pi-subagents | **KEEP upstream pi-subagents** — the owned fork (fork-pi-packages) will replace it; @tintinweb is active but never a catalog dependency here. |
| rpiv-btw | catalog has @narumitw/pi-btw (gist P9 pick) | **KEEP @narumitw** — already the best; rpiv-btw is opt-in in their family. |
| rpiv-args ($1/$ARGUMENTS + `` !`cmd` `` in skills) | no catalog equivalent; complements skill visibility + mention | **ADD** as `skill-args` (change rpiv-alternatives). Future owned fork: `pi-args`. |
| rpiv-todo / rpiv-advisor / rpiv-workflow / rpiv-pi / i18n / voice / warp / telemetry | — | Rejected: todo is the checkbox anti-pattern; advisor/workflow/umbrella are heavy pipeline (philosophy: subagents + goal); rest niche. |
