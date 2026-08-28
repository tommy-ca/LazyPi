# Tasks — Add the FFF search substrate

## 1. Research

- [x] 1.1 Audit @ff-labs/pi-fff (pi.dev + npm + README): version, recency, peers, modes, alternatives, invasiveness (parallel researcher + scout)
- [x] 1.2 Record the audit in the fff-search proposal (approve; additive default)

## 2. Catalog and installer

- [x] 2.1 Add `fff` (`npm:@ff-labs/pi-fff`) to `tools` in `bin/lazypi.mjs`
- [x] 2.2 Update help text tools line

## 3. Specs

- [x] 3.1 Write the fff-search deltas (installer Search Tools + Catalog Model 16, harness Context Hygiene scenario)
- [x] 3.2 `openspec validate --all` green; archive the change
- [x] 3.3 Resync fork-pi-packages installer delta to the 16-shape; validate again

## 4. Docs

- [x] 4.1 Add fff package page, sidebar link, cards; rechain prev/next
- [x] 4.2 Update counts (15 → 16) across docs, landing, README, FAQ; copy says "additive search tools"

## 5. Verify and ship

- [x] 5.1 `npm test` green; packed CLI smoke green
- [x] 5.2 Fresh-reviewer pass on the diff; fix findings
- [x] 5.3 Commit and push to the fork; CI green