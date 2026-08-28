# Tasks — Lean the catalog with best alternatives

## 1. Catalog and installer

- [ ] 1.1 Reduce `PACKAGES` to 12 entries (core 6, tools 4, research 1, themes 1) in `bin/lazypi.mjs`
- [ ] 1.2 Drop plan, add-dir, claude-cli, prompt-templates, hackerman, terminal-theme
- [ ] 1.3 Repoint `btw` to `npm:@narumitw/pi-btw` with `legacySources: ["npm:pi-btw"]`
- [ ] 1.4 Update help text category descriptions

## 2. Docs

- [ ] 2.1 Remove plan/add-dir/claude-cli/prompt-templates package pages, sidebar links, and cards; rechain prev/next
- [ ] 2.2 Collapse `themes.html` to the curated pack (65) and fix counts
- [ ] 2.3 Update landing grid, overview, first-steps, FAQ, and README copy
- [ ] 2.4 Verify no stale references to dropped packages or `@robzolkos/lazypi`

## 3. Specs and validation

- [ ] 3.1 Update `specs/lazypi/installer` Catalog Model to the 12-package shape
- [ ] 3.2 Update `changes/fork-pi-packages` Catalog Model delta to the new shape
- [ ] 3.3 `openspec validate --all` and `--archived` green
- [ ] 3.4 `npm test` green and packed CLI smoke green