# Promotion candidates audit — pi-lsp, interactive-shell, autoresearch (research)

Source: operator install audit, 2026-08-29, against `@tommy-ca/lazypi` 0.8.1
(catalog 12/12, all core). Three installs evaluated for promotion under the
Catalog membership criteria (see change 2026-08-29-others-reaudit-catalog-
criteria).

## Candidate 1: `@narumitw/pi-lsp` — CONDITIONAL (promote next audit)

| Dimension | Evidence |
| --- | --- |
| What it does | Configurable, language-agnostic LSP tools: `lsp_diagnostics` (exact ranges) and `lsp_fix` (server source actions) via a shared runner; servers start per tool call and shut down; extension-routed config; workspace roots. |
| Maintenance | 0.49.6 · 2026-08-26 (3 days before audit); 0.1.x→0.49.x, four releases in Aug 2026; repo pushed 2026-08-29 |
| Author family | `@narumitw` — same author as cataloged `btw` (side chat) and `goal` (long-objective gate) |
| Philosophy | Lean-aligned and unusually honest: README puts authoritative repo validation commands first ("if those commands are already fast and reliable, pi-lsp may add little value"), cites Eric Traut's LSP-skeptic comment, lists limitations incl. no benchmarks |
| Integration friction | `node-pty@1.1.0` has an install script (node-gyp rebuild) blocked by pi's allowScripts gate; prebuilt bindings ship and were verified at runtime (PTY spawn probe OK) — non-issue on this platform, documented for others |
| Criteria score | maintained ✓ · aligns ✓ · not on Dropped ✓ · installed ✓ · **exercised ✗** (installed minutes before the audit) |

Plan: exercise `lsp_diagnostics`/`lsp_fix` during upcoming sessions; next
catalog audit promotes on demonstrated use (or drops the idea if it proves
not useful).

## Candidate 2: `pi-interactive-shell` — CONFIRMED DROPPED

| Dimension | Evidence |
| --- | --- |
| What it does | Runs AI coding agents / supervised CLIs in pi TUI overlays (interactive, hands-free, dispatch, monitor modes) |
| Maintenance | 0.15.1 · 2026-08-26 — active |
| Operator usage | Real and recurring (npm device-auth publishes, CLI supervision), but operator-workflow-specific |
| Verdict rationale | TUI chrome / operator overlay tooling, not harness control plane or discipline layer; already surfaced as a help-text extra with direct `pi install`; stays on the Dropped list with the other extras |

## Candidate 3: `davebcn87/pi-autoresearch` — CONFIRMED DROPPED

| Dimension | Evidence |
| --- | --- |
| What it does | Autonomous experiment loops (optimization iterations, hooks, finalize) |
| Maintenance | Repo pushed 2026-07-15 — quiet for 6 weeks; installed as unpinned git HEAD |
| Verdict rationale | Research-loop automation = meal-prep of research; unpinned git source is a reproducibility liability; deliberately excluded by the lean catalog and dropped-list review of 2026-08-29 |

## Outcome

Catalog stays 12/12. pi-lsp is the first qualified promotion candidate
since dynamic-workflows/ponytail; the membership criteria now carry the
evidence floors so its promotion is mechanical, not ad hoc.