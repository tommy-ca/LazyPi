# Tasks — Take the better alternatives from rpiv-mono

## 1. Research

- [x] 1.1 Audit rpiv-mono against the catalog (parallel researcher + scout): npm currency, tool names, alternatives verdict
- [x] 1.2 Record the verdict in explorations/rpiv-mono-audit.md (web-access/ask/subagents/btw kept; rpiv-args added)

## 2. Catalog and installer

- [x] 2.1 Add `skill-args` (`npm:@juicesharp/rpiv-args`) to `core` in `bin/lazypi.mjs`
- [x] 2.2 Update help text category description

## 3. Specs

- [x] 3.1 Write the rpiv-alternatives deltas (installer Skill Arguments + Catalog Model 15, harness Skill Parameters)
- [x] 3.2 Update fork-pi-packages design.md web-tools rationale + pi-args note
- [x] 3.3 `openspec validate --all` green; archive the change
- [x] 3.4 Resync fork-pi-packages installer delta to the 15-shape; validate again

## 4. Docs

- [x] 4.1 Add skill-args package page, sidebar link, cards; rechain prev/next
- [x] 4.2 Update counts (14 → 15) across docs, landing, README, FAQ

## 5. Verify and ship

- [x] 5.1 `npm test` green; packed CLI smoke green
- [x] 5.2 Fresh-reviewer pass on the diff; fix findings
- [x] 5.3 Commit and push to the fork; CI green