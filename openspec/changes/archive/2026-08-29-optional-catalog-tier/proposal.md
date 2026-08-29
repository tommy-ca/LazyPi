# Optional catalog tier: lsp, interactive-shell, autoresearch

## Why

The promotion-candidates audit (2026-08-29) found `@narumitw/pi-lsp` the
first qualified candidate since dynamic-workflows/ponytail but blocked on
the demonstrated-use evidence floor, while `pi-interactive-shell` and
`pi-autoresearch` were re-confirmed dropped with recorded reasoning. This
change resolves that tension structurally: instead of a binary core/dropped
world, the catalog gains a managed `optional` tier. The three evaluated
packages become catalog entries — installed, reported, updated, and removed
by LazyPi — but are NOT part of the default install. Core stays exactly as
it was (12 lean entries); the operator's install is migrated to the new
tier (interactive-shell and autoresearch leave the "other" bucket,
autoresearch gains a reproducible commit pin).

## What Changes

- `bin/lazypi.mjs`: `CATEGORIES` becomes `core` + `optional`; three
  optional entries added (`lsp` → `npm:@narumitw/pi-lsp`,
  `interactive-shell` → `npm:pi-interactive-shell`,
  `autoresearch` → `git:github.com/davebcn87/pi-autoresearch` pinned at
  `00062fb9cc425e71d82e75445dc5b6ad31c32f0e`); default selection (no
  `--only`/`--except`) is core-only; the interactive everything flow still
  covers all 15; help text documents the tier.
- `.github/workflows/test.yml`: CI installs the optional tier explicitly
  after the core `--yes` run so the full-catalog assertion still holds.
- `scripts/e2e-install.mjs`: stage 1 asserts the core-only default; new
  stage 1.5 asserts `--only optional` installs the remaining three and the
  settings match the full catalog.
- Docs: three package pages (lsp, interactive-shell, autoresearch),
  sidebar + packages index + landing grid + "What it installs" table,
  optional-extras table slimmed (interactive-shell and LSP rows moved into
  the catalog), CSS optional tag variant, README + installation page copy.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model — 15 entries across two categories
  (12 core + 3 optional), default selection is core-only, optional
  selection paths defined; Dropped list amended (interactive-shell and
  autoresearch are cataloged, not dropped)

## Impact

- `bin/lazypi.mjs`, `.github/workflows/test.yml`, `scripts/e2e-install.mjs`
- `docs/` (index, docs/index, installation, sidebar, packages index,
  three new package pages, docs.css, index.css, site.css), `README.md`
- Operator install migrated (14/15 → 15/15, autoresearch pinned)