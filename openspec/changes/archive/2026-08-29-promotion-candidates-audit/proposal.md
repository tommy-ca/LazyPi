# Promotion candidates audit: pi-lsp, interactive-shell, autoresearch

## Why

Three installs were put under the promotion lens against the 0.8.1 catalog
and the Catalog membership criteria: `@narumitw/pi-lsp` (newly installed for
this audit — not cataloged, not on the Dropped list, actively maintained at
0.49.6 with a 2026-08-26 release and a very lean-philosophy-aligned README),
`pi-interactive-shell` (catalog help-text extra, used for TUI/auth overlays),
and `davebcn87/pi-autoresearch` (git install, unpinned HEAD).

Verdict: **no promotion now; pi-lsp is the first qualified candidate**. It
fails exactly one criterion — demonstrated daily-driver use (it was
installed minutes before this audit). Per the intent-driven flow, the
change sets the plan: exercise pi-lsp in real sessions, and the next audit
promotes it on evidence. The other two are re-confirmed dropped with fresh
reasoning, and the membership criteria gain the explicit evidence floors
this evaluation applied (installed-and-exercised, maintenance currency,
native-binding runtime path), so the staged plan is enforceable.

## What Changes

- **Spec** (`lazypi/installer`, Catalog Model → Catalog membership scenario):
  promotion now also requires the candidate to be installed and exercised in
  real sessions, currently maintained on its primary channel, and free of
  unproven native/install-script machinery.
- **Research record**: `openspec/explorations/promotion-candidates-audit.md`
  — install dates, versions, npm/git currency, philosophy assessment,
  integration friction (node-pty prebuilds verified at runtime), verdicts.
- **Docs**: `docs/docs/index.html` optional-extras table gains the LSP row
  (`npm:@narumitw/pi-lsp`) so the on-demand surface matches the operator's
  demonstrated install.
- No catalog, installer-code, or CLI changes; 12/12 untouched.

## Evaluation summary

| Package | Currency | Aligns | Installed/exercised | Dropped? | Verdict |
| --- | --- | --- | --- | --- | --- |
| `@narumitw/pi-lsp` 0.49.6 | 2026-08-26 · very active | yes — targeted diagnostics, self-aware README; @narumitw family (btw, goal) | installed 2026-08-29, not yet exercised | no | **Conditional promote next audit** |
| `pi-interactive-shell` 0.15.1 | 2026-08-26 · active | partial — TUI/chrome for interactive flows, operator-specific | yes (auth flows, overlays) | yes (re-confirmed) | Stay dropped |
| `pi-autoresearch` (git HEAD) | pushed 2026-07-15 · quiet | no — research-loop automation (meal-prep of research), unpinned git | yes | yes (re-confirmed) | Stay dropped |

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model — Catalog membership scenario gains
  evidence floors (installed-and-exercised, maintenance currency,
  native-binding runtime path)

## Impact

- `openspec/specs/lazypi/installer/spec.md` (via change delta),
  `openspec/explorations/promotion-candidates-audit.md`,
  `docs/docs/index.html` (one extras-table row)