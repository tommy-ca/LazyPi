# Installed-Others Audit — live install vs the fork catalog (research)

Source: `bunx @tommy-ca/lazypi status` run against the operator's live Pi
install (`~/.pi/agent/settings.json`), 2026-08-29. The fork catalog is the
exported `PACKAGES` array in `bin/lazypi.mjs` (10 entries, all `core`,
all `essential: true`).

## Findings

| # | Installed outside catalog | npm currency (2026-08-29) | Spec classification | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `npm:@juanibiapina/pi-extension-settings` | 0.9.1 · 2026-07-20 | dropped: extension-settings | Confirmed dropped |
| 2 | `npm:@quintinshaw/pi-dynamic-workflows@3.7.0` | 3.9.0 · 2026-08-27 | **unclassified** (not in dropped list) | **ADD to catalog** — installed 3.7.0 is stale, see below |
| 3 | `npm:pi-mcp-adapter` | 2.31.0 · 2026-08-28 | dropped: mcp | Confirmed dropped |
| 4 | `git:github.com/VandeeFeng/pi-memory-md` | — (git) | dropped: memory | Confirmed dropped |
| 5 | `npm:@devkade/pi-plan` | 0.2.2 · 2026-02-24 | dropped: plan | Confirmed dropped |
| 6 | `npm:pi-add-dir` | 1.3.1 · 2026-03-31 | dropped: add-dir | Confirmed dropped |
| 7 | `npm:pi-prompt-template-model` | 0.12.2 · 2026-08-28 | dropped: prompt-templates | Confirmed dropped |
| 8 | `npm:@plannotator/pi-extension` | 0.27.9 · 2026-08-27 | dropped: plannotator | Confirmed dropped |
| 9 | `npm:pi-slopchop` | 0.10.1 · 2026-07-05 | dropped: slopchop | Confirmed dropped |
| 10 | `npm:@juanibiapina/pi-powerbar` | 0.15.0 · 2026-08-25 | dropped: powerbar | Confirmed dropped |
| 11 | `npm:@tmustier/pi-usage-extension` | 0.9.4 · 2026-07-21 | dropped: usage | Confirmed dropped |
| 12 | `npm:@tmustier/pi-raw-paste` | 0.1.3 · 2026-05-07 | dropped: raw-paste | Confirmed dropped |
| 13 | `git:github.com/tintinweb/pi-manage-todo-list@…` | — (git) | dropped: todos | Confirmed dropped (checkbox anti-pattern) |
| 14 | `npm:pi-interactive-shell` | 0.15.1 · 2026-08-26 | dropped: interactive-shell | Confirmed dropped |
| 15 | `git:github.com/davebcn87/pi-autoresearch` | — (git) | dropped: autoresearch | Confirmed dropped |
| 16 | `npm:@tmustier/pi-ralph-wiggum` | 0.2.3 · 2026-07-21 | dropped: ralph-wiggum | Confirmed dropped |
| 17 | `git:github.com/javierportillo/pi-hackerman@…` | — (git) | dropped: hackerman | Confirmed dropped |
| 18 | `npm:@victor-software-house/pi-curated-themes` | 0.2.1 · 2026-06-09 | dropped: curated-themes | Confirmed dropped |
| 19 | `npm:pi-terminal-theme` | 0.2.0 · 2026-05-19 | dropped: terminal-theme | Confirmed dropped |
| 20 | `npm:@dietrichgebert/ponytail` | 4.9.0 · 2026-08-07 | **unclassified** (not in dropped list) | **ADD to catalog** |

18/20 installs map one-to-one onto the spec's Dropped-packages scenario —
the lean catalog's exclusions match the operator's actual install exactly.
Nothing on the dropped list needs re-review. Two packages drifted in with no
spec classification.

## The two unclassified packages

- **@quintinshaw/pi-dynamic-workflows** — dynamic workflow engine: fan a
  task out across subagents with model routing, token/cost accounting,
  resume, git-worktree isolation, `/workflows` TUI, `/deep-research`. It
  sits on top of the cataloged pi-subagents substrate. The operator runs it
  daily (the `workflow` tool and workflow-authoring/workflow-patterns
  skills). Installed 3.7.0 is behind npm latest 3.9.0 — a stale-pin on the
  operator's own install, not a lazypi catalog issue (floating `npm:` sources
  resolve latest).
- **@dietrichgebert/ponytail** — lazy-senior-dev discipline: minimal,
  stdlib-first code, `ponytail:` debt annotations, review/audit/debt modes.
  It codifies the anti-over-engineering ethos the lean catalog itself was
  built on. Active in the operator's sessions.

Both are philosophy-aligned: workflows is the harness's intent-driven
fan-out flow; ponytail is the harness's "keep it lean" watchdog. Neither
exists in upstream `@robzolkos/lazypi` (23-package catalog, mostly the
dropped set) — the fork owns both.

## Upstream diff (fork source `@robzolkos/lazypi`, master)

Upstream catalogs 23 ids: subagents, pi-ask-user, simplify, web-access, btw,
and 18 of the dropped ids (add-dir, claude-cli, compound, curated-themes,
extension-settings, hackerman, interactive-shell, mcp, plan, plannotator,
powerbar, prompt-templates, ralph-wiggum, raw-paste, slopchop,
terminal-theme, todos, usage). The fork keeps 10 lean essentials and adds
its own control-plane set (pi-skillful, mention-skill, goal, context-usage,
fff). Nothing in upstream is worth re-integrating — every upstream-only id
is already on the dropped list.

## Update command finding (environmental)

`bunx @tommy-ca/lazypi update` delegates to `pi update`; under a mise-managed
pi the self-update step errors (`pi cannot self-update this installation`)
and extension updates are skipped unless `pi update --extensions` is run.
This is pi's own limitation, not a lazypi defect, and the correct update path
for this install is `pi update --extensions` / the package manager that owns
pi (mise). Recorded here; no installer change proposed.

## Integration plan (see change 2026-08-29-harness-extras)

Add `dynamic-workflows` and `ponytail` to the catalog (core + essential,
12 total), extend the spec scenarios and docs counts, and confirm the
remaining 18 stay documented as deliberate. After the change, the operator's
status readout becomes "Installed from LazyPi catalog (12/12)" with 18
documented outside-catalog packages.