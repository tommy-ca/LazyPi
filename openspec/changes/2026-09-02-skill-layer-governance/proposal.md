# Skill Layer Governance: one methodology, two registries, official sources

## Why

An audit of the operator's Pi install (2026-09-02) found the skill layer
carrying two full SDLC methodologies at once: Every Inc.'s
`compound-engineering` plugin (35 skills + 51 agents, installed via the pi
plugin mechanism) and Jesse Vincent's `obra/superpowers` (14 skills, installed
via the `npx skills` manager). 11 of the 14 superpowers skills duplicate a
compound-engineering capability (brainstorming, plans, debugging, code
review, worktrees, parallel agents, verification, commit flow), so ~64 skill
descriptions are resident in the discovery prompt and two frameworks issue
conflicting top-level mandates ("invoke a superpowers skill before any
response" vs the ce harness loop).

The audit also caught registry+source failures: the highest-install
`gh-cli` registry entry (`github/awesome-copilot@gh-cli`, 21.9K installs)
does not exist in its source repo (dead entry); the official `cli/cli` gh
skill is registered as a PromptScript, which the `npx skills` manager refuses
to install globally but still copies — leaving partial residue on disk; and
the previously installed gh skill came from a third-party fork
(`paulrberg/agent-skills@cli-gh`) rather than the tool's official source.

The harness spec governs packages, visibility, and mention, but says nothing
about which skill frameworks may be resident, which registry manages which
skills, and where tool-specific skills must come from. Without explicit
rules, future installs will re-accumulate the same overlap and source drift.

## What Changes

- **One primary methodology.** `compound-engineering` is the resident SDLC
  framework (it aligns with the harness loop and ships the agent personas its
  skills depend on). A second full methodology SHALL NOT be installed as a
  resident set; cross-framework skills MAY supplement only where the primary
  framework has no equivalent, hidden by default.
- **Two registries, documented and enforced.** User-layer skills
  (`~/.agents/`, tracked by the `npx skills` lock file) and harness-layer
  plugins (`~/.pi/agent/`, tracked by the pi install manifest) are separate;
  a capability SHALL NOT migrate registries when it carries agents, prompts,
  or extensions the target manager cannot install. This keeps
  `compound-engineering` on the pi plugin manager (its 51 agents are not
  installable by `npx skills`) and user skills on `npx skills`.
- **Official tool-skill sources.** The gh CLI skill SHALL be `cli/cli`'s
  official `gh` skill; third-party forks SHALL NOT replace it. Task-level
  GitHub skills SHALL come on demand from the official catalog
  (`github/awesome-copilot`). Dead registry entries (advertised skills absent
  from their source repo) SHALL NOT be installed.
- **Installed-state consistency.** The skill directory and its registry lock
  SHALL agree; failed installs that copied files before failing SHALL be
  cleaned up so no partial residue remains.
- **State already applied during the audit:** official `gh` skill installed
  and registry-tracked (`cli/cli`), third-party `cli-gh` and skill-manager
  residue removed, registry back to dir == lock == 18 entries.

## What Does NOT Change

- The PACKAGES catalog (12 core / 5 optional) is untouched; no package moves
  in this change.
- `compound-engineering` stays on the pi plugin manager; it is not moved to
  `npx skills`.
- MCP remains at zero servers (the `mcp` package stays on the Dropped list).