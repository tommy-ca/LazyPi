# Tasks — Audit hygiene: simplify dead code and align docs

## 1. Code simplicity (audit findings)

- [x] 1.1 Remove the unreachable npm-prefix update machinery and its constant
- [x] 1.2 Drop unused `export` on `spawnCommand`
- [x] 1.3 Remove dead `skipped` install accounting and unreachable branch
- [x] 1.4 Simplify the `others` filter (redundant conjunct)
- [x] 1.5 Reduce `cmdUpdate`; delete `resolveUpdateCatalogIds`
- [x] 1.6 Export and share `parseList` with `scripts/assert-installed-packages.mjs`
- [x] 1.7 Doctor enforces Node >= 20

## 2. Tests

- [x] 2.1 Remove the four `inferNpmPrefixFromPiPackageRoot` tests
- [x] 2.2 Drop the stale `@devkade/pi-plan` regex from update-selection
- [x] 2.3 `npm test` green (17/17) and packed CLI smoke green

## 3. Docs hygiene

- [x] 3.1 Fix the hero-sub (drop Claude Code CLI claim, garbled sentence)
- [x] 3.2 Add `doctor` to the overview commands table
- [x] 3.3 Fix catalog enumeration drift (add simplify / skill arguments)
- [x] 3.4 Node 20 floors (faq, installation); reword themes preview claim
- [x] 3.5 Drop the dead `plans/` Jekyll exclude; CHANGELOG count

## 4. Specs

- [x] 4.1 Audit confirms main specs match the 16-entry catalog; change uses
      `skip_specs: true` (Recipe 5 — refactor/docs, no behavior change)
- [x] 4.2 `openspec validate --all` green; archive the change

## 5. Ship

- [x] 5.1 Fresh review of the diff
- [x] 5.2 Commit and push to the fork; CI green