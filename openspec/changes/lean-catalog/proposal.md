# Lean the catalog with best alternatives

## Why

The 18-package catalog still carried half-essential weight: `plan` (the
harness spec deliberately omits plan mode — goal gates long objectives),
`add-dir` and `prompt-templates` (power-user niches), `claude-cli` (provider
specific; primary auth is subscription `/login`), and two of three theme
packages (`hackerman` as a pinned single theme, `terminal-theme` as an ANSI
mapping that clashes with the curated pack). Themes are a pick-one decision:
the curated pack (65 dark themes) is the single best value. And the side-chat
package resolves to `pi-btw@0.4.1` while `@narumitw/pi-btw@0.55.4` — the
package the harness spec itself names — is strictly more mature.

## What Changes

- Catalog reduced 18 → 12 packages.
- Dropped: `plan` (@devkade/pi-plan), `add-dir` (pi-add-dir),
  `claude-cli` (pi-claude-cli), `prompt-templates`
  (pi-prompt-template-model), `hackerman` (pinned git, theme),
  `terminal-theme` (ANSI, theme).
- Themes category reduced to the single best package:
  `curated-themes` (65 dark themes).
- `btw` repointed to the best alternative `npm:@narumitw/pi-btw` with
  `legacySources: ["npm:pi-btw"]` so installed copies migrate on the next
  install/update.
- Category shape: core 6, tools 4, research 1, themes 1.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: catalog model (12 entries, btw swap with legacy source)

## Impact

- `bin/lazypi.mjs` — catalog + help text category descriptions
- `docs/` — drop plan/add-dir/claude-cli/prompt-templates pages and cards,
  collapse themes gallery to the curated pack (65), retitle counts
- `openspec/changes/fork-pi-packages` — its Catalog Model delta updated to
  the 12-package shape so validation stays green