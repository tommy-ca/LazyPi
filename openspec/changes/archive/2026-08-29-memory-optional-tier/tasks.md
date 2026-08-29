# Tasks — Memory joins the optional tier; pi-memory evaluated, not adopted

## 1. Research / audit

- [x] 1.1 `npm view pi-memory`: jayzeng, 0.4.2, qmd-powered semantic
      search, pi.dev-listed — different project from the installed
      `pi-memory-md`
- [x] 1.2 `npm view pi-memory-md`: 0.1.38 npm channel exists for the
      installed git daily driver
- [x] 1.3 Verdict: one memory substrate per lean harness — do not adopt
      pi-memory; promote pi-memory-md to the optional tier (npm source,
      git legacy)

## 2. Installer

- [x] 2.1 Optional entry `memory` (npm source, git legacy); help text
      updated
- [x] 2.2 Operator install migrated live: git removed, npm installed,
      skills intact, settings hold only `npm:pi-memory-md`; catalog 17/17

## 3. Docs

- [x] 3.1 New `memory.html` page (chain: todos → memory → subagents)
- [x] 3.2 Sidebar (todos link from the prior change restored too),
      packages index (17 + card), landing grid + stat, "What it installs"
      row, README + installation page

## 4. Spec delta

- [x] 4.1 Lean shape 17 entries; Optional sources gains `memory`; Dropped
      list amended

## 5. Validation

- [x] 5.1 `npm test` green (20/20)
- [x] 5.2 `npx openspec validate --changes` green; `openspec archive --yes`
- [x] 5.3 `npm run spec:validate` green

## 6. Ship

- [x] 6.1 Fresh review of the diff
- [x] 6.2 Commit and push to the fork; CI green