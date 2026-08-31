## 1. Spec

- [x] 1.1 Write installer ADDED Catalog documentation requirement
      Evidence: `openspec/changes/catalog-docs-philosophy/specs/lazypi/installer/spec.md`
- [x] 1.2 `npx openspec validate --changes` green
      Evidence: `npx openspec validate catalog-docs-philosophy` → valid

## 2. Tests first

- [x] 2.1 README lists PACKAGES ids in order with category
      Evidence: `test/catalog-docs.test.mjs`
- [x] 2.2 philosophy.html exists and names the membership bar
      Evidence: same file
- [x] 2.3 Overview has no "Optional extras" heading
      Evidence: same file
- [x] 2.4 Sidebar package hrefs match PACKAGES order (ask-user slug)
      Evidence: same file

## 3. Docs

- [x] 3.1 README catalog table and count copy
- [x] 3.2 `docs/docs/philosophy.html` plus Overview, First Steps, FAQ, landing
- [x] 3.3 Sidebar, packages index, landing grid, package prev-next in PACKAGES order
- [x] 3.4 AGENTS.md catalog-update path includes README table and philosophy

## 4. Verify

- [x] 4.1 `npm test` green
      Evidence: `npm test` → 40 pass, 0 fail
- [x] 4.2 `npm run spec:validate` green for the live change
      Evidence: `openspec validate --all` → change/catalog-docs-philosophy valid
- [x] 4.3 Archive `catalog-docs-philosophy` with tasks complete
      Evidence: `npx openspec archive catalog-docs-philosophy --yes`
- [x] 4.4 `npm run spec:validate` green after archive
      Evidence: live installer spec gains Catalog documentation; archived change validates
