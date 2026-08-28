# Tasks — Fork the pi-packages (owned control plane)

## 1. Scaffold the monorepo

- [ ] 1.1 Verify the `@tommy-ca` npm scope is owned by the publishing account (`npm whoami`)
- [ ] 1.2 Scaffold `pi-packages` (workspaces, biome, vitest, husky, tsconfig.base.json, CI matrix)
- [ ] 1.3 Port `sync-versions.js` / `release.mjs` and the decision-code guard from rpiv-mono
- [ ] 1.4 Publish a canary fork end-to-end; verify `pi install` + `/reload` on a clean Pi

## 2. Tier 1 forks

- [ ] 2.1 Fork `pi-subagents` (agent contract preserved) with ship-manifest test
- [ ] 2.2 Fork `pi-ask-user` (typed options, ask-gate defaults) with ship-manifest test
- [ ] 2.3 Fork `pi-web-tools` (pluggable providers, keyless default) with ship-manifest test
- [ ] 2.4 Fork `pi-btw` (non-mutating side thread) with ship-manifest test
- [ ] 2.5 Author `pi-todo` overlay (survives /reload; not a checkbox list) with ship-manifest test
- [ ] 2.6 Fork/pin `pi-memory` (removes the unpinned git head) with ship-manifest test

## 3. Tier 2 forks

- [ ] 3.1 Fork `@narumitw/pi-goal` smallest viable surface with ship-manifest test
- [ ] 3.2 Fork `pi-context-usage` smallest viable surface with ship-manifest test
- [ ] 3.3 Confirm the catalog has zero unpinned git heads

## 4. LazyPi integration

- [ ] 4.1 Repoint catalog entries: `source` → `npm:@tommy-ca/pi-*`, `legacySources` → upstream, `forked: true`
- [ ] 4.2 Add the "Owned forks" grouping to `status` and the reviewed-owned marker to `doctor`
- [ ] 4.3 Add docs pages for forked packages; update sidebar, index, counts
- [ ] 4.4 `npm test` green and packed CLI smoke green

## 5. Release and migration

- [ ] 5.1 Release `@tommy-ca/lazypi` with the repointed catalog
- [ ] 5.2 Migrate the operator's own settings with one `install` run and verify `status`
- [ ] 5.3 Archive this change (deltas already applied to main specs)