# Others re-audit: no promotions, reconcile Catalog Model spec

## Why

Re-audit of the operator's live install against the 0.8.1 catalog
(`bunx @tommy-ca/lazypi@0.8.1 status`): all 18 packages outside the catalog
map one-to-one onto the spec's Dropped-packages scenario (extension-settings,
mcp, memory, plan, add-dir, prompt-templates, plannotator, slopchop, powerbar,
usage, raw-paste, todos, interactive-shell, autoresearch, ralph-wiggum,
hackerman, curated-themes, terminal-theme). None are promotion candidates —
no active daily-driver outside the catalog sits off the Dropped list, and the
six doc'd optional extras (skill-args, memory, mcp, interactive-shell,
ralph-wiggum, curated-themes) are deliberately on-demand via `pi install`.

The audit did surface a spec/implementation drift introduced by the
`simplify-catalog-cuts` refactor (2026-08-29, wrongly `skip_specs: true`):
the Catalog Model requirement still mandated `essential: true` on every
entry (and listed `forked` in the MAY set) while the refactor deleted the
`essential` field from the code — and `forked` has zero occurrences anywhere.
The spec is the engineering contract; this change reconciles it with reality
and encodes the promotion standard the audit applied, so future catalog
growth is intent-driven instead of ad hoc.

## What Changes

- `openspec/specs/lazypi/installer/spec.md` (via change delta):
  - Catalog Model requirement: entries MAY carry only `legacySources`
    (`forked` and `essential` removed from the MAY set)
  - Lean catalog shape: drop "every entry SHALL be tagged `essential: true`"
    and "non-essential packages SHALL NOT be in the catalog" (the exactly-12
    id list already enforces the closed set)
  - Add `Catalog membership` scenario: promotion requires active daily-driver
    use, lean-harness alignment, absence from the Dropped list, and a change
    spec with an audit trail
- `openspec/explorations/installed-others-audit.md`: resolution note for the
  0.8.1 re-audit (the harness-extras integration plan executed; 18 remain
  deliberately outside; criteria now spec'd)

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Catalog Model — MAY-set narrowed to `legacySources`,
  essential-tag mandate removed, promotion-criteria scenario added

## Impact

- `openspec/specs/lazypi/installer/spec.md`, `openspec/explorations/installed-others-audit.md`
- No code, catalog, docs-site, or CI changes; 12/12 catalog untouched