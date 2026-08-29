# Tasks — Others re-audit: no promotions, reconcile Catalog Model spec

## 1. Research / audit

- [x] 1.1 Fresh `bunx @tommy-ca/lazypi@0.8.1 status`: 18 packages outside the
      catalog, 12/12 catalog installed, 0 legacy
- [x] 1.2 Map every outside package onto the spec Dropped-packages list;
      evaluate promotion candidates (npm currency, daily-driver use,
      philosophy alignment) — none qualify
- [x] 1.3 Detect spec/implementation drift: `essential: true` still mandated
      by Catalog Model while code dropped it in simplify-catalog-cuts;
      `forked` listed in MAY set with zero occurrences

## 2. Spec delta

- [x] 2.1 Catalog Model: MAY set narrowed to `legacySources` only
- [x] 2.2 Lean catalog shape: essential-tag mandate removed (closed 12-id
      list is the guard)
- [x] 2.3 New `Catalog membership` scenario: promotion criteria (active
      daily-driver use, lean-harness alignment, not on Dropped list,
      change-spec audit trail)
- [x] 2.4 Exploration `installed-others-audit.md` updated with the 0.8.1
      resolution

## 3. Validation

- [x] 3.1 `npx openspec validate --changes` green
- [x] 3.2 `npx openspec archive` merges the delta into the live spec
- [x] 3.3 `npm run spec:validate` green (16/16); `npm test` untouched

## 4. Ship

- [x] 4.1 Fresh review of the diff
- [x] 4.2 Commit and push to the fork; CI green