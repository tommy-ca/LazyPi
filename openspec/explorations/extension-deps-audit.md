# Extension Dependency Footprint Audit — 2026-08-31

Audit record for the `Cannot find module 'acorn'` failure of the `workflow`
(fan-out) tool and the fix applied. Companion change:
`2026-08-31-extension-deps-troubleshooting`.

## Symptom

Every `workflow` tool call (and `subagent` with `action: validate` and a
`workflowScript`) in the agent session failed:

```
Cannot find module 'acorn'
Require stack:
- /home/tommyk/.pi/agent/extensions/subagent/src/workflows/scripted-workflow.ts
```

The `workflow` run path aborted silently ("Workflow was aborted"); the
validate path surfaced the acorn error directly.

## Root cause chain

1. pi-subagents 0.58.0 is installed (settings: `npm:pi-subagents@0.58.0`,
   with `"extensions": []`). `pi list` resolves it — like every package — to
   `~/.pi/agent/npm/node_modules/pi-subagents` (pi's shared npm store, a
   private project at `~/.pi/agent/npm/package.json`).
2. A full git checkout of nicobailon/pi-subagents at tag 0.58.0 also exists
   at `~/.pi/agent/extensions/subagent` (same install date). It is
   intentionally used at runtime:
   - pi-subagents hardcodes its config path to
     `~/.pi/agent/extensions/subagent/config.json`
     (`src/extension/config.ts:174`) — the operator's config (parallel caps,
     missions disabled, `scheduleCreate: forbid`) lives there.
   - The failing require stack pointed at
     `extensions/subagent/src/workflows/scripted-workflow.ts`: the running
     session's module resolution used the checkout, shadowing the store copy.
3. The checkout had **no `node_modules` at all**: its runtime deps (`acorn
   8.18.0`, `jiti`, `typebox`, `yaml`) were never materialized inside it.
   `scripted-workflow.ts` resolves the acorn entry via
   `requireFromPackage.resolve("acorn")` (createRequire against the
   extension's package.json), so resolution walked
   `extensions/subagent/node_modules` → `~/.pi/agent/node_modules` → home →
   fail. acorn IS present at the store root
   (`~/.pi/agent/npm/node_modules/acorn@8.18.0`), which is why the store copy
   of the same code would have resolved fine.
4. `lazypi status` reported the catalog 17/17 installed throughout: presence
   in settings and runtime health are independent facts.

## Fix applied (environment)

Materialized the checkout's runtime deps:

```bash
cd ~/.pi/agent/extensions/subagent
npm install --omit=dev --no-audit --no-fund   # added acorn jiti typebox yaml
node -e "const {createRequire}=require('node:module'); \
  const r=createRequire('$PWD/package.json'); console.log(r.resolve('acorn'))"
```

Verification after the fix:

- `subagent action:validate` (workflowScript) now parses the script and
  returns deterministic syntax feedback instead of the acorn error — the
  parser path is functional.
- The `workflow` run path now executes the sandboxed script: scripts that
  skip the required `export const meta` first statement or never call
  `agent()` get specific errors ("workflow scripts must call agent() at
  least once"), proving the sandbox runs.

## Residual risk

- Child spawn from the workflow sandbox still aborts silently
  ("Workflow was aborted", run status `failed`, total=0) in the fixing
  session — including an unawaited `runs.run`. The failure is in the
  sandbox-to-child bridge, not the dependency footprint; it predates/outlives
  the acorn fix and is independent of script shape (validate and script
  execution both work). Confirm child spawn in a fresh agent session; if it
  persists, the bridge issue is pi-subagents/pi-integration side and should
  be reproduced with `pi-subagents` 0.62.0 (catalog unpinned source) before
  filing upstream.
- The stale checkout remains in place (config.json role). If it is later
  removed, `pi list` continues to resolve pi-subagents to the store copy —
  an operator who wants the store layout as the only copy can remove
  `~/.pi/agent/extensions/subagent` after copying/merging `config.json`
  behavior into `settings.json` equivalents if desired.

## Guidance for operators (landed in FAQ + updating docs)

A catalog package can be present in settings yet broken at runtime when its
dependency footprint is incomplete. Repair: `pi update` (or
`npx @tommy-ca/lazypi update`), reinstall the package, or remove a stale
`~/.pi/agent/extensions/<name>` checkout that shadows the npm store.
## Follow-up audit: workflow child spawn + version pins (2026-08-31)

After the dep fix, the workflow sandbox and validator worked, but every
`runs.run`/`runs.all` child spawn aborted silently ("Workflow was aborted",
run status `failed`, total=0, no error surfaced in `workflow_control
status`/transcripts). Research:

- The abort is not the dependency error: the worker parses and executes
  scripts (probe_min completed; meta/`agent()` rules enforced with detailed
  messages).
- Child launches are gated by an in-realm `workflow-child-permit.ts`
  (WeakMap-keyed, non-serializable) and a parent-side bridge; failures map
  to the generic "Workflow was aborted" with no diagnostics.
- Upstream pi-subagents shipped 121 commits between v0.58.0 and v0.62.0,
  including a dozen workflow/permit/bridge fixes (scripted-workflow.ts grew
  ~700 lines) — the abort class is plausibly fixed upstream.

Environment upgrade applied:

- Checkout: `git checkout v0.62.0` + `npm install --omit=dev` —
  `config.json` preserved (v0.62.0 keeps the
  `extensions/subagent/config.json` contract, same runtime deps).
- Store: `pi install npm:pi-subagents@0.62.0` replaced the pinned entry
  (single settings entry, store now 0.62.0).
- Both copies now resolve `acorn`; settings pin is
  `npm:pi-subagents@0.62.0`.

Key finding — `pi update` respects version pins: `pi update
npm:pi-subagents@0.58.0` printed "Updated" and left 0.58.0 in place. Pinned
packages never advance through update paths, so upstream fixes are
invisible to pinned installs. This is now visible too: `lazypi status`
prints the installed source for each catalog entry (pin shown when it
differs; all 17 entries here are pinned).

Residual: workflow child spawn in a fresh agent session is
unverified — this session loaded the old 0.58.0 module at startup and
cannot pick up the 0.62.0 upgrade. Verify with one minimal `runs.run`
workflow in the next session; if it still aborts, file against
pi-subagents with a repro.
