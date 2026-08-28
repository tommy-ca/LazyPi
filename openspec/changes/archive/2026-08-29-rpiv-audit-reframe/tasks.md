# Tasks — Strip discarded-fork references from the rpiv-mono audit

## 1. Collect (done)

- [x] 1.1 Sweep repo for live fork references: planning/ already migrated away; only `openspec/explorations/rpiv-mono-audit.md` is live
- [x] 1.2 Confirm archived changes (fork-era records) stay untouched as history

## 2. Fix

- [x] 2.1 Re-frame title + intro (fork discarded; kept as research)
- [x] 2.2 Collapse the "Reuse map for @tommy-ca/pi-*" section into a short verdict
- [x] 2.3 Drop fork mentions from the three verdict rows (web-tools, subagents, args)

## 3. Close out

- [x] 3.1 `npm run spec:validate` green
- [x] 3.2 Archive with `--skip-specs` (doc-only change)
- [x] 3.3 Commit