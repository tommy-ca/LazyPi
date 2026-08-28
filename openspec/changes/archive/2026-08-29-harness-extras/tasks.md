# Tasks — Integrate dynamic-workflows and ponytail

## 1. Catalog and installer

- [x] 1.1 Add `dynamic-workflows` (`npm:@quintinshaw/pi-dynamic-workflows`) and `ponytail` (`npm:@dietrichgebert/ponytail`) to `PACKAGES` in `bin/lazypi.mjs`, both `core` + `essential: true`
- [x] 1.2 Help text core-line enumeration extended (workflows, ponytail discipline)

## 2. Specs

- [x] 2.1 Write the harness-extras deltas (installer Catalog Model 12 + source scenarios; installer Idempotent Install versioned-equivalence; harness Control Plane Catalog cover list + twelve)
- [ ] 2.2 `openspec validate` green; archive the change
- [ ] 2.3 `npm run spec:validate` green on master after archiving

## 3. Docs

- [x] 3.1 Landing counts 10 → 12 (`docs/index.html` stats + compare table + grid cards); docs overview "10 hand-picked" → 12 with the two names
- [x] 3.2 New package pages `docs/docs/packages/dynamic-workflows.html`, `ponytail.html` (template: subagents.html); sidebar links; packages index cards
- [x] 3.3 README / FAQ / first-steps / installation enumerations of catalog counts

## 4. Tests

- [x] 4.1 `scripts/e2e-install.mjs` hardcoded 10 → 12 (`Will install:`, `Installed 10 package(s)`)
- [x] 4.2 `npm test` green (20/20 incl. new sources-match tests); `status` readout shows 12/12 on the operator's install (versioned source match)

## 5. Ship

- [x] 5.1 Fresh review of the diff; fix findings (reviewer: 0 blocking, 4 P2 findings fixed — cmdRemove versioned-source resolution, proposal 21-id list wording, AGENTS.md count, compare-table rows + og/description)
- [ ] 5.2 Commit and push to the fork; CI green