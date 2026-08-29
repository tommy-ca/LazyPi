# Tasks — Simplify catalog cuts: dead essential field and runPi wrapper

## 1. Code cuts

- [x] 1.1 Remove `essential: true` from all 14 `PACKAGES` entries (greps:
      `essential` = 0 occurrences after)
- [x] 1.2 Delete single-caller `runPi` wrapper; inline the `cmdUpdate`
      delegate (`spawnCommand(...).status ?? 1`)

## 2. Test hygiene

- [x] 2.1 Add trailing newline to `test/sources-match.test.mjs`

## 3. Verification

- [x] 3.1 `npm test` green (20/20)
- [x] 3.2 `npm run spec:validate` green (15/15); change uses
      `skip_specs: true` (Recipe 5 — deletion, no behavior change)

## 4. Ship

- [x] 4.1 Fresh review of the diff (net −6 lines, packed smoke unaffected)
- [x] 4.2 Archive the change; commit and push to the fork; CI green