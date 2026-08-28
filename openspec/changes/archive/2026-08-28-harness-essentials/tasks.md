# Tasks — Add the harness essentials (skill visibility + skill mention)

## 1. Research

- [x] 1.1 Verify pi-skillful and the mention candidates on npm (parallel researcher)
- [x] 1.2 Audit the OpenSpec tree vs the gist essentials (parallel reviewer)
- [x] 1.3 Decide the single mention implementation (use one, not both)

## 2. Catalog and installer

- [x] 2.1 Add `pi-skillful` (npm:pi-skillful) to `core` in `bin/lazypi.mjs`
- [x] 2.2 Add the chosen mention package to `core` in `bin/lazypi.mjs`
- [x] 2.3 Update help text category description

## 3. Specs

- [x] 3.1 Write the harness-essentials deltas (installer catalog model, harness Skill Visibility + Skill Mention)
- [x] 3.2 `openspec validate --all` green

## 4. Docs

- [x] 4.1 Add package pages/cards for both additions; rechain prev/next
- [x] 4.2 Update counts (12 → 14) and README copy

## 5. Verify and ship

- [x] 5.1 `npm test` green; packed CLI smoke green
- [x] 5.2 Fresh-reviewer pass on the diff
- [x] 5.3 Commit and push to the fork