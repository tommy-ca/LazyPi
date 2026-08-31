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