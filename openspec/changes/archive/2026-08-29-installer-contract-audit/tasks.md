# Tasks — Lock audited installer behaviors into the spec

## 1. Audit (done)

- [x] 1.1 Audit installer spec requirements vs `bin/lazypi.mjs` behavior (e2e + refactor session)
- [x] 1.2 Audit docs site (10 package pages == 10 catalog ids, sidebar, counts)
- [x] 1.3 Audit CI workflows (packed smoke, real install, self-deriving assertion) and npm publishing config

## 2. Spec delta

- [x] 2.1 MODIFIED Idempotent Install: add legacy-convergence scenario
- [x] 2.2 MODIFIED Commands: add doctor-environment scenario (Node baseline, unpinned-git warning)
- [x] 2.3 `npm run spec:validate` green

## 3. Close out

- [x] 3.1 Archive the change (deltas applied to main specs)
- [x] 3.2 Commit