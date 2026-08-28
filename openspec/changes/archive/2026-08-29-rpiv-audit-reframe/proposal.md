# Strip discarded-fork references from the rpiv-mono audit

## Why

The `fork-pi-packages` change was discarded (2026-08-29): the catalog is
fully pinned npm sources, so the owning-fork plan is dead. The exploration
doc `openspec/explorations/rpiv-mono-audit.md` is the only live file still
written around that plan — its title, its reuse-map section, and three
verdict rows point at the nonexistent `pi-packages` fork and its proposal.
The audit's research content (package family, workspace conventions,
provider verdicts) remains valid and is kept.

## What Changes

- `openspec/explorations/rpiv-mono-audit.md` — re-framed as third-party
  research: title and intro note the discarded fork; the "Reuse map for
  `@tommy-ca/pi-*`" section collapses into a short verdict; three verdict
  rows drop fork mentions.
- No spec, code, docs-site, or CI changes (doc-only; archived with
  `--skip-specs` per the audit-hygiene precedent).

## Impact

One exploration file edited; historical archived-change records of the fork
are intentionally left untouched.