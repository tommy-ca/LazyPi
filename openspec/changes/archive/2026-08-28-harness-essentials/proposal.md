# Add the harness essentials (skill visibility + skill mention)

## Why

The harness spec (gist PI-HARNESS-CHASEN-2026-08) defines a minimum viable
control plane in Step 3: `pi-subagents` + `pi-skillful` + the ask gate — and
its Layer-2 contract depends on skill visibility: only name+description sit in
the system prompt, unused skills are hidden, and hidden skills stay reachable
via a `$` mention. The catalog shipped subagents and the ask gate but never
pi-skillful or a mention implementation, so the essential control plane was
incomplete: skill discovery stops at the git root, and the operator cannot
hide unused skills or invoke them invisibly.

## What Changes

- Add `pi-skillful` (npm:pi-skillful) to `core`: discovers skills above the
  git root, hides unused skills from automatic discovery, configurable via
  `skillful.hiddenSkills`, and expands `/skill:name` inline.
- Add a single `$` skill-mention implementation to `core` (one of
  @zigai/pi-mention-skill / pi-mention-skills / @tunglam/pi-inline-skills —
  the harness spec says "use one, not both"; choice from npm research)
  so hidden skills stay explicitly invokable.
- Catalog grows 12 → 14 entries (core 6 → 8; tools/research/themes
  unchanged). `pi-fff` stays out: the spec lists it as Step-5 pain-driven
  ("if you are going to enable search at all"), not essential.
- `harness/control-plane` spec gains two requirements: Skill Visibility and
  Skill Mention.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: catalog model (14 entries, core +2)
- `harness/control-plane`: Skill Visibility + Skill Mention requirements

## Impact

- `bin/lazypi.mjs` — two catalog entries (core category)
- `docs/` — package pages/cards for the two additions, counts 12 → 14
- `openspec/changes/lean-catalog` — unaffected (unfinished tasks there are
  finalized separately)
- Validation: `openspec validate --all` green after archive