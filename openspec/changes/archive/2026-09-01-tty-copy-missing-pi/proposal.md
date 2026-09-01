# Restore Missing pi 127 qualifier and TTY option copy

## Why

The live Missing pi scenario says a non-TTY run without `pi` prints an
error and exits 127. `ensurePi` does that only when `!flags.yes`.
`--yes` still auto-installs Pi. The live AND over-forbids that path.

Docs still sell the TTY first option as **Install all (recommended)**.
The CLI option label is `Install everything`. The select prompt can
still say `Install all ${n} Pi packages the lazy way…`. Calling the
option recommended is false: `--yes` is 12, TTY everything is 17.

## What Changes

- Missing pi AND: on a non-TTY without `--yes` SHALL print an error and
  exit 127. Other Missing pi ANDs stay. `ensurePi` is unchanged.
- Catalog documentation: TTY option label is Install everything. Docs
  SHALL NOT call it recommended. `--yes` stays 12. TTY everything stays
  17.
- Installation heading, landing mock option line, Overview Quick start,
  and FAQ choose-what-to-install use Install everything.
- `test/catalog-docs.test.mjs` pins that `docs/docs/installation.html`
  and `docs/index.html` do not contain `(recommended)`.

No CLI behavior change. No `--yes`=12 vs TTY 17 change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lazypi/installer` Commands: Missing pi non-TTY 127 is without `--yes`.
- `lazypi/installer` Catalog documentation: TTY option label is Install
  everything and is not recommended.

## Impact

- `openspec/specs/lazypi/installer/spec.md` after archive
- `docs/docs/installation.html`
- `docs/index.html`
- `docs/docs/index.html`
- `docs/faq.html`
- `test/catalog-docs.test.mjs`
- `CHANGELOG.md`
