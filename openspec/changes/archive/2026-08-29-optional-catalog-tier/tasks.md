# Tasks — Optional catalog tier: lsp, interactive-shell, autoresearch

## 1. Research (re-audit grounding)

- [x] 1.1 Re-audit the three promotion candidates (pi-lsp 0.49.6,
      interactive-shell 0.15.1, autoresearch pinned) per the Catalog
      membership criteria from 2026-08-29
- [x] 1.2 Decision: managed optional tier instead of core promotion —
      core stays lean (12), the tier is catalog-managed but not
      default-selected

## 2. Installer

- [x] 2.1 `CATEGORIES` = `["core", "optional"]`; three optional `PACKAGES`
      entries; autoresearch pinned to the resolved HEAD commit
- [x] 2.2 Default selection (no --only/--except) is core-only; interactive
      everything flow widens to all 15; picker shows the optional group
      unchecked
- [x] 2.3 Help text documents the optional tier and `--only optional`
- [x] 2.4 Operator install migrated: `install --yes --only optional` →
      15/15 catalog, autoresearch source pinned in settings

## 3. CI + e2e

- [x] 3.1 test.yml: `--yes --only optional` step before the full-catalog
      assertion
- [x] 3.2 e2e-install.mjs: stage 1 asserts core-only default; stage 1.5
      asserts the optional tier and full-catalog settings

## 4. Docs

- [x] 4.1 Three package pages (lsp, interactive-shell, autoresearch) with
      prev/next chain; ponytail next-link fixed to lsp
- [x] 4.2 Sidebar, packages index (15, cards + optional tag), landing stats
      and grid, "What it installs" table, extras table slimmed, CSS
      optional tag variant
- [x] 4.3 README + installation page copy

## 5. Spec delta

- [x] 5.1 Catalog Model: 15 entries (12 core + 3 optional), optional tier
      selection scenario, Dropped list amended

## 6. Validation

- [x] 6.1 `npm test` green (20/20)
- [x] 6.2 `npx openspec validate --changes` green; `openspec archive --yes`
- [x] 6.3 `npm run spec:validate` green

## 7. Ship

- [x] 7.1 Fresh review of the diff
- [x] 7.2 Commit and push to the fork; CI green