## 1. Spec

- [x] 1.1 Write installer MODIFIED Commands (Missing pi without `--yes`) and Catalog documentation (Install everything, not recommended)
      Evidence: `openspec/changes/tty-copy-missing-pi/specs/lazypi/installer/spec.md`
- [x] 1.2 `npx openspec validate tty-copy-missing-pi` green
      Evidence: `npx openspec validate tty-copy-missing-pi` → Change 'tty-copy-missing-pi' is valid

## 2. Tests first

- [x] 2.1 Pin that `docs/docs/installation.html` and `docs/index.html` do not contain `(recommended)`
      Evidence: `test/catalog-docs.test.mjs`

## 3. Docs

- [x] 3.1 `docs/docs/installation.html`: drop `(recommended)`; heading Install everything vs picker
- [x] 3.2 `docs/index.html` landing mock option line is Install everything
- [x] 3.3 `docs/docs/index.html` Quick start: Install everything for the full 17
- [x] 3.4 `docs/faq.html` choose-what-to-install: first option is Install everything
- [x] 3.5 CHANGELOG Unreleased one-line

## 4. Verify

- [x] 4.1 `npm test` green
      Evidence: `npm test` → 45 pass, 0 fail
- [x] 4.2 `npm run spec:validate` green for the live change
      Evidence: `openspec validate --all` → spec/harness/control-plane, spec/lazypi/installer, change/tty-copy-missing-pi valid
- [x] 4.3 Archive `tty-copy-missing-pi` with tasks complete
      Evidence: `npx openspec archive tty-copy-missing-pi --yes` → `2026-09-01-tty-copy-missing-pi`, 2 modified
- [x] 4.4 `npm run spec:validate` green after archive
      Evidence: 2 live specs + 34 archived, including `2026-09-01-tty-copy-missing-pi`
- [x] 4.5 `git diff origin/master -- bin/lazypi.mjs` empty
      Evidence: empty diff
