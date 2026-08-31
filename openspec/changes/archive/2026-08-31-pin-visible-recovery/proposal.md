# Surface installed version pins and document pin-stuck recovery

## Why

The 2026-08-31 pi-subagents audit surfaced a systemic visibility gap: the
operator's catalog packages are installed with version pins in
`settings.json` (for example `npm:pi-subagents@0.58.0`), and `pi update`
**respects those pins** — it reported "Updated" while leaving 0.58.0 in
place. The workflow-tool failure was fixed upstream by v0.62.0 (121 commits,
a dozen workflow/permit fixes), but a pinned install can never receive such
fixes through `pi update` or `npx @tommy-ca/lazypi update`. Meanwhile
`lazypi status` prints only the catalog source (`npm:pi-subagents`), so the
pin — and therefore the staleness — is invisible.

Recovery for a persistent failure therefore requires explicitly reinstalling
at a newer version (`pi install npm:<pkg>@<version>` or unpinned), which was
not documented.

## What Changes

- `status` shows the installed source for catalog entries; when that source
  carries a version pin that differs from the catalog source, the pin is
  displayed (for example `npm:pi-subagents@0.62.0`). Unpinned installs print
  exactly what they print today.
- Commands spec: "Status derivation" pins that `status` SHALL surface an
  installed version pin that differs from the catalog source.
- Troubleshooting spec: "Broken dependency footprint" gains that the docs
  SHALL state that `pi update` respects existing version pins, and SHALL
  tell the operator to reinstall at the catalog's current version when a
  failure persists after a footprint repair.
- FAQ and updating docs: pin-stuck guidance and the persistent-failure
  reinstall step.
- Exploration `extension-deps-audit.md` updated with the child-spawn research
  (upstream fixes 0.58→0.62), the environment upgrade performed (checkout and
  store moved to v0.62.0, pin moved to `npm:pi-subagents@0.62.0`), the
  `pi update`-respects-pins finding, and the required fresh-session
  verification of workflow child spawn.

No PACKAGES/membership changes; `sourcesMatch` semantics unchanged (pinned
sources still count as installed).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `installer` — Commands: "Status derivation" surfaces installed version
  pins.
- `installer` — Troubleshooting: pin-stuck and persistent-failure recovery
  guidance.