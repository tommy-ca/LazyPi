# Tasks — Post-publish validation becomes part of the release contract

## 1. Learn

- [x] 1.1 Lesson: every release (0.8.0/0.8.1/0.9.0) was validated
      post-publish manually (npx+bunx from a neutral dir, version/help/
      status/install); the Release Flow requirement lacks this gate
- [x] 1.2 The npx local-tree quirk (repo checkout self-match) is why
      validation must run outside the checkout — proven in this session

## 2. Spec delta

- [x] 2.1 Release Flow gains the `Post-publish validation` scenario
      (both runners report the released version from a neutral dir;
      status/install idempotent on the operator install)

## 3. Docs

- [x] 3.1 README "Releasing" includes the validation step
- [x] 3.2 Exploration resolution extended

## 4. Apply by executing the scenario

- [x] 4.1 `npx -y @tommy-ca/lazypi@0.9.0 --version` from /tmp → 0.9.0
- [x] 4.2 `bunx @tommy-ca/lazypi@0.9.0 --version` from /tmp → 0.9.0
- [x] 4.3 status → 16/16 + install --yes idempotent no-op via both
      runners

## 5. Validation

- [x] 5.1 `npm test` green; `openspec validate --changes` green;
      `openspec archive --yes`; `npm run spec:validate` green

## 6. Ship

- [x] 6.1 Fresh review of the diff
- [x] 6.2 Commit and push to the fork; CI green