# Take the better alternatives from rpiv-mono

## Why

The rpiv-mono audit (explorations/rpiv-mono-audit.md) compared its published
family against the catalog. The honest result: most catalog packages are
already the better tool — pi-web-access is broader and newer than rpiv-web-
tools (4 tools, 26 providers, zero-config, keyless DuckDuckGo vs 2 tools /
10 providers / key-required), rpiv-ask-user-question would break the ask gate
(its tool is `ask_user_question`, not `ask_user`), @tintinweb/pi-subagents is
a third-party fork the owned-fork plan already replaces, and @narumitw/pi-btw
was already chosen over rpiv-btw. The one rpiv-mono capability with no catalog
equivalent is skill parameterization: `rpiv-args` gives skills shell-style
arguments (`$1`, `$ARGUMENTS`) and inline `` !`cmd` `` expansion, complementing
the skill visibility and $ mention work already landed.

## What Changes

- Add `skill-args` (`npm:@juicesharp/rpiv-args`) to `core`. Catalog 14 → 15
  (core 8 → 9).
- The harness skill surface becomes: visibility (pi-skillful), mention
  (@zigai/pi-mention-skill), and parameters (rpiv-args) — one package each.
- No catalog source changes. P1 rejections recorded in the audit addendum:
  web-access (keep), pi-ask-user (keep), subagents (keep), btw (keep — already
  @narumitw).
- fork-pi-packages design note updated: the owned `pi-web-tools` fork
  differentiates on ownership/trim and a keyless default, not provider
  pluggability (upstream already has it); `pi-args` added to the future fork
  family.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: catalog model (15 entries, core +1) and a new Skill
  Arguments requirement
- `harness/control-plane`: Skill Parameters requirement (layer-2 skill surface)

## Impact

- `bin/lazypi.mjs` — one core entry; help text
- `docs/` — skill-args page, sidebar + cards, counts 14 → 15
- `openspec/changes/fork-pi-packages` — installer delta resynced to the
  15-shape; design.md web-tools rationale corrected
- `openspec/explorations/rpiv-mono-audit.md` — addendum with the verdict