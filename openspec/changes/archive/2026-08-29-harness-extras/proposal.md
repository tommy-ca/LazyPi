# Integrate the operator's harness extras: dynamic-workflows and ponytail

## Why

A live-install audit (2026-08-29, recorded in
`explorations/installed-others-audit.md`) shows 20 packages installed outside
the fork catalog. 18/20 map one-to-one onto the spec's Dropped-packages list
and are confirmed deliberate. Two are unclassified by the spec and actively
drive this operator's harness:

- `@quintinshaw/pi-dynamic-workflows` — intent-driven fan-out over the
  cataloged pi-subagents substrate (`/workflows` TUI, deep-research, resume,
  token accounting). The `workflow` tool this operator uses daily.
- `@dietrichgebert/ponytail` — lazy-senior-dev discipline: stdlib-first,
  minimal-diff coding with a debt ledger. Codifies the anti-over-engineering
  ethos the lean catalog was built on; active in this operator's sessions.

Both are philosophy-aligned, both are absent from upstream
`@robzolkos/lazypi` (the fork owns them), and neither needs a legacy-source
migration (each is already installed under its own source). Without an
explicit decision, the spec's lean-catalog contract silently under-reports
the real harness.

## What Changes

- Catalog 10 → 12: add `dynamic-workflows`
  (`npm:@quintinshaw/pi-dynamic-workflows`) and `ponytail`
  (`npm:@dietrichgebert/ponytail`), both `core` + `essential: true`.
  The operator's install is already 12/12; fresh installs get all twelve.
- Installer spec: "Lean catalog shape" becomes exactly 12 entries and lists
  the two new ids; two source scenarios pin the new sources. The dropped
  list is unchanged — the remaining 18 stay documented as deliberate.
- Installer matcher: npm (and pinned git) sources with a version/sha suffix
  now match their unpinned catalog source, so `status` and `install` treat
  `npm:pkg@x.y.z` as the catalog's `npm:pkg` (spec scenario: Versioned npm
  equivalence). Without this, a version-pinned install shows as missing and
  re-installs.
- Harness spec: the Control Plane Catalog cover list gains a workflow
  engine for sub-agent fan-out and code-discipline review; the harness-core
  scenario becomes twelve packages.
- Docs: counts 10 → 12 (landing stats/compare, docs overview), two new
  package pages (`dynamic-workflows.html`, `ponytail.html`), sidebar links,
  and any "10" enumerations in README/FAQ/first-steps/installation.
- e2e-install.mjs hardcoded counts 10 → 12; all other assertions already
  derive from `PACKAGES`.

## Categorization (recorded)

| Essential (harness core) | Source |
| --- | --- |
| subagents, pi-skillful, pi-ask-user, simplify, mention-skill, web-access, goal, context-usage, btw, fff | unchanged (10) |
| dynamic-workflows | npm:@quintinshaw/pi-dynamic-workflows (new) |
| ponytail | npm:@dietrichgebert/ponytail (new) |

Outside catalog — deliberate, per the spec's dropped list (21 ids; 18 of them
are what the operator's live install carries): compound, todos, powerbar,
extension-settings, plannotator, slopchop, usage, raw-paste, autoresearch,
plan, add-dir, claude-cli, prompt-templates, hackerman, terminal-theme,
skill-args, memory, mcp, interactive-shell, ralph-wiggum, curated-themes.

## Out of scope

`lazypi update` failing under a mise-managed pi (`pi cannot self-update this
installation`) is pi's own limitation; the update path is `pi update
--extensions` / the owning package manager. Recorded in the audit, no
installer change.