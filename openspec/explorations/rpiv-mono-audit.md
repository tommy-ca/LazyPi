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