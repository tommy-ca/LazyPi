# Tasks — Todos joins the optional tier

## 1. Research / audit

- [x] 1.1 Usage evidence: 75 manage-todo-list call sites across 4 session
      directories — structured tracking is a real harness need
- [x] 1.2 npm currency: `pi-manage-todo-list` 0.4.0 exists, same tintinweb
      repository — npm is the primary channel
- [x] 1.3 Re-examined the drop rationale ("checkbox anti-pattern"): applies
      to verbatim checklist contracts, not the tracker's usage pattern

## 2. Installer

- [x] 2.1 Optional entry `todos` (npm source, git legacy source); help text
      updated
- [x] 2.2 Operator install migrated live: legacy pinned git removed, npm
      source installed, settings hold only `npm:pi-manage-todo-list`

## 3. Docs

- [x] 3.1 New `todos.html` package page (chain: autoresearch → todos →
      subagents)
- [x] 3.2 Sidebar, packages index (16 + card), landing grid + stat,
      "What it installs" optional row, README + installation page

## 4. Spec delta

- [x] 4.1 Lean shape 16 entries (12 core + 4 optional); Optional sources
      gains `todos`; Dropped list amended

## 5. Validation

- [x] 5.1 `npm test` green (20/20)
- [x] 5.2 `npx openspec validate --changes` green; `openspec archive --yes`
- [x] 5.3 `npm run spec:validate` green

## 6. Ship

- [x] 6.1 Fresh review of the diff
- [x] 6.2 Commit and push to the fork; CI green