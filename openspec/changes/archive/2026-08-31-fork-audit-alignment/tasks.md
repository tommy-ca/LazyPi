## 1. Spec deltas

- [x] 1.1 Write installer Catalog Model, Self-Deriving CI, and Skill Arguments REMOVED deltas
- [x] 1.2 Write harness Control Plane Catalog delta
- [x] 1.3 `npx openspec validate --changes` green for `fork-audit-alignment`

## 2. Catalog pin

- [x] 2.1 Add `test/catalog-contract.test.mjs` pinning PACKAGES ids, categories, sources, dropped ids, and Windows optional step
- [x] 2.2 Extend `test/ci-workflows.test.mjs` so Windows smoke must include `--only optional`

## 3. CI and CLI copy

- [x] 3.1 Windows smoke: `lazypi --yes --only optional` before the full-catalog assert
- [x] 3.2 Doctor git PATH warning names leftover git: legacy sources, not current catalog packages

## 4. Docs

- [x] 4.1 Landing BTW card uses `@narumitw/pi-btw`
- [x] 4.2 `fff.html` Next → dynamic-workflows; `autoresearch.html` Next → todos
- [x] 4.3 Installation page: TTY Install everything is 17; `--yes` is 12 core
- [x] 4.4 README default is core, not "everything selected by default"
- [x] 4.5 CHANGELOG Unreleased matches the 12+5 catalog
- [x] 4.6 `openspec/config.yaml` fork-direction context drops the discarded rpiv-mono plan as current direction

## 5. Verify

- [x] 5.1 `npm test` green
- [x] 5.2 `npx openspec archive fork-audit-alignment --yes`
- [x] 5.3 `npm run spec:validate` green
