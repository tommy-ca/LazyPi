# Verify the refreshed catalog plugins load and expose their features

## Why

The `2026-08-31-catalog-version-refresh` change moved seven catalog packages
to their npm `latest` releases. Before considering that state settled, the
refreshed plugins must be verified twice over: (1) statically — manifests,
versions, and dependency footprints resolve from the npm store — and (2)
functionally — a fresh pi session loads each refreshed extension and its
features respond (self-check commands, tools, skills).

The auditing session cannot perform the functional half itself: extensions
are imported at session startup, so this session runs pre-refresh module
code even though the store is current. Functional verification therefore
runs in a spawned fresh session against the on-disk v-latest packages.

## What Changes

- Static verification of all 17 catalog packages (manifest + version +
  dependency footprint at the store root). Results recorded in the
  exploration `plugin-feature-verification.md`.
- Fresh-session functional verification of the refreshed packages:
  @ff-labs/pi-fff (`/fff-health`), @quintinshaw/pi-dynamic-workflows
  (workflow tool), @zigai/pi-mention-skill (`$` expansion), @narumitw/pi-goal
  (goal gate tools), @narumitw/pi-btw (side chat), pi-web-access
  (web search tools), pi-autoresearch (skills/commands), pi-subagents
  (subagent + `runs.run`).
- CHANGELOG entry.

No installer behavior or PACKAGES data change; environment verification
ratified through the change flow (`skip_specs`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.