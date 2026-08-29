# Extras drift cleanup: memory no longer a non-catalog extra

## Why

The simplify/ponytail/DHH-style review after the 0.10.0 release found
three surfaces still describing `memory` as a non-catalog extra after its
promotion to the optional tier (change 2026-08-29-memory-optional-tier):
the CLI help text, the README "Other extras" sentence, and the docs
optional-extras table. The FAQ went further — it pre-dates the optional
tier entirely, listing shell overlays and research loops (now catalog
entries `interactive-shell`/`autoresearch`) as on-demand extras.

Docs drift is the same failure class as the `essential` field drift:
feature changes leaking into surfaces that enumerate the catalog. The fix
is consistency sweeps (grep for every now-cataloged id in extras lists).

## What Changes

- `bin/lazypi.mjs` help text ("Non-catalog extras"): `memory` removed
- `README.md`: "Other extras (skill arguments, MCP, themes)" — `memory`
  removed
- `docs/docs/index.html` optional-extras table: "Markdown-backed memory"
  row removed
- `docs/faq.html`: extras sentence rewritten to the current model —
  optional tier enumerated (LSP, shell overlays, research loops, todo
  tracking, markdown memory) with `--only optional`, remaining extras
  (skill arguments, MCP, themes) on demand

## Capabilities

No capability changes — help text and docs consistency only
(`skip_specs: true`; verified: `grep memory` on the extras surfaces is
clean after the change, and `PACKAGES`/behavior/release mechanics are
untouched).

## Impact

- `bin/lazypi.mjs` (help text only), `README.md`, `docs/docs/index.html`,
  `docs/faq.html`
- No catalog, CI, or spec changes; next release picks up the help-text
  fix with any version bump