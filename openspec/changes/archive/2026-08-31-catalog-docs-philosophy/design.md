# Design: catalog documentation

## Context

`PACKAGES` in `bin/lazypi.mjs` is the catalog. Default `--yes` selects
the 12 core ids. TTY Install everything selects all 17. The npm tarball
includes `README.md` and not the Jekyll tree. Docs still list Dropped
ids as extras.

Do not change `PACKAGES` or the CLI. Do not put rationale onto
`PACKAGES` objects.

## Data shape

Documentation rows are `CatalogEntry { id, category: core|optional,
rationale }`. Seventeen rows, same order as `PACKAGES`. Dropped ids are
the closed list `DROPPED_IDS` in `test/catalog-contract.test.mjs`.
`pi-ask-user` uses the docs slug `ask-user.html`.

## Synthesis

Base is a dedicated explanation page plus a compact README table.

Graft from the no-new-page sketch:

- Relabel Overview "Optional extras" as Dropped. Do not merchandise those
  ids as extras.
- Reorder sidebar, packages index, landing grid, and package prev-next
  to PACKAGES order.
- Pin docs and README in tests so they cannot drift from PACKAGES.

Rejected: stuffing the membership bar onto `PACKAGES`. The array is the
install contract. Rejected: restoring the fat catalog.

## Docs modes

`philosophy.html` is explanation. README catalog is reference. First
Steps stays a tutorial of the core 12. The landing page gets one count
line, not an essay.

## Next step

Failing `test/catalog-docs.test.mjs`, then README and docs, then
`npm test` and `npm run spec:validate`.
