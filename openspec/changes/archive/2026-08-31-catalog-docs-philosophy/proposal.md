# Document why the catalog is 12 + 5

## Why

The npm tarball ships `README.md` with no catalog table. The Jekyll
Overview still merchandises Dropped ids as "optional extras". Operators
and npm readers cannot see PACKAGES order, why 12 is default, or why 5
stay optional.

## What Changes

- README gains a 17-row catalog table in PACKAGES order (id, category,
  rationale). Copy states `--yes` is 12 and TTY Install everything is 17.
- New explanation page `docs/docs/philosophy.html` covers the membership
  bar, the default 12, the optional 5, and Dropped packages as outside
  the catalog.
- Overview drops the "Optional extras" table. Docs lists, sidebar,
  landing grid, and package prev-next follow PACKAGES order.
- Tests fail if README, philosophy, Overview, or sidebar drift from
  PACKAGES.

No CLI or PACKAGES change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lazypi/installer`: add requirement Catalog documentation (README table
  and counts, philosophy page, Overview must not sell Dropped ids as
  extras). Catalog Model scenarios stay unchanged.

## Impact

- `README.md`
- `docs/docs/philosophy.html` (new)
- `docs/docs/index.html`, `docs/docs/first-steps.html`, `docs/faq.html`,
  `docs/index.html`
- `docs/_includes/sidebar.html`, `docs/docs/packages/index.html`,
  package prev-next hrefs
- `AGENTS.md`
- `test/catalog-docs.test.mjs` (new)
- `openspec/specs/lazypi/installer/spec.md` after archive
