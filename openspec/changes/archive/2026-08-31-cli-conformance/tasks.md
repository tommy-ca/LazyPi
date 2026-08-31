# Tasks — Conform the CLI help and no-pi behavior

## 1. Spec deltas

- [x] 1.1 Write installer Catalog Model, Commands, and Self-Deriving CI deltas
- [x] 1.2 `npx openspec validate 2026-08-31-cli-conformance` green

## 2. CLI help

- [x] 2.1 `printHelp` Categories block: replace the "Non-catalog extras"
  stanza with the Dropped note; no `npm:` sources for dropped ids
- [x] 2.2 `validateSelectors` error line: single space after "Valid package ids:"
- [x] 2.3 Evidence: `node bin/lazypi.mjs --help` shows the note; `--only bogus`
  prints the single-space line

## 3. Non-interactive no-pi

- [x] 3.1 `ensurePi`: prompt only when interactive; non-TTY without `--yes`
  fails with 127
- [x] 3.2 Update `test/audit-seams.test.mjs` with a regression test: spawn on
  a pi-less PATH with piped stdio, assert exit 127 and no prompt text
- [x] 3.3 Evidence: `npm test` green; manual stripped-PATH run exits fast

## 4. CI gate

- [x] 4.1 `.github/workflows/test.yml`: `npm run spec:validate` step after
  `npm test`
- [x] 4.2 Evidence: `npm run spec:validate` green locally

## 5. Changelog

- [x] 5.1 CHANGELOG Unreleased Bug Fixes/Specs/CI entries

## 6. Land

- [x] 6.1 `npx openspec archive 2026-08-31-cli-conformance --yes`
- [x] 6.2 `npm run spec:validate` green after archive (all items)
- [x] 6.3 `npm test` green after archive (41/41)