# Tasks — Extras drift cleanup: memory no longer a non-catalog extra

## 1. Audit

- [x] 1.1 Gates: `npm test` 20/20, `npm run spec:validate` 24/24
- [x] 1.2 Grep sweep for now-cataloged ids in extras surfaces tagged three
      stale `memory` mentions (help, README, docs extras table)
- [x] 1.3 FAQ pre-dates the optional tier: shell overlays, research loops
      still listed as on-demand extras

## 2. Fixes

- [x] 2.1 Help text: `memory` removed from Non-catalog extras
- [x] 2.2 README: `memory` removed from Other extras
- [x] 2.3 docs extras table: Markdown-backed memory row removed
- [x] 2.4 FAQ: extras sentence reflects the optional tier + remaining
      extras

## 3. Verification

- [x] 3.1 `grep memory` on the extras surfaces clean
- [x] 3.2 Sidebar links (23 = 6 docs + All + 17 packages) match the 17
      package pages
- [x] 3.3 `npm test` green; help text renders correctly; `skip_specs:
      true` justified (help/docs only, no PACKAGES/behavior/release
      changes)

## 4. Ship

- [x] 4.1 Validate + archive the change
- [x] 4.2 Commit and push to the fork; CI green