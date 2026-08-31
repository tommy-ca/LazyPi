# Tasks — Surface installed version pins and document pin-stuck recovery

## 1. Spec deltas

- [x] 1.1 Commands "Status derivation" and Troubleshooting "Broken
  dependency footprint" MODIFIED deltas
- [x] 1.2 `npx openspec validate 2026-08-31-pin-visible-recovery` green

## 2. Status pin visibility

- [x] 2.1 `cmdStatus` displays the matched installed source for installed
  entries (pin visible when it differs); unpinned output unchanged
- [x] 2.2 Evidence: `node bin/lazypi.mjs status` — subagents row shows
  `npm:pi-subagents@0.62.0`

## 3. Docs

- [x] 3.1 FAQ: "pi update respects existing version pins" + persistent-
  failure reinstall step
- [x] 3.2 `updating.html`: pin-stuck note; reinstall-at-catalog-version step
- [x] 3.3 Evidence: both pages contain the new guidance

## 4. Exploration

- [x] 4.1 `extension-deps-audit.md` updated: child-spawn research
  (0.58→0.62 upstream fixes), environment upgrade performed (checkout +
  store to v0.62.0, pin to `npm:pi-subagents@0.62.0`), `pi update`
  respects pins, fresh-session verification required

## 5. Land

- [x] 5.1 `npx openspec archive 2026-08-31-pin-visible-recovery --yes`
- [x] 5.2 `npm run spec:validate` green after archive
- [x] 5.3 `npm test` green after archive

Landed under conventional commits (fix + spec change).