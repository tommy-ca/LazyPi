## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources` and `forked`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 14 entries across the categories `core`,
  `tools`, `research`, and `themes`
- **AND** `core` SHALL contain subagents, pi-ask-user, pi-skillful,
  mention-skill, goal, btw, context-usage, and simplify
- **AND** `tools` SHALL contain web-access, memory, mcp, and
  interactive-shell
- **AND** `research` SHALL contain ralph-wiggum
- **AND** `themes` SHALL contain curated-themes only

#### Scenario: Side chat best alternative

- **WHEN** the catalog defines `btw`
- **THEN** its `source` SHALL be `npm:@narumitw/pi-btw`
- **AND** the replaced `npm:pi-btw` SHALL remain in `legacySources`

#### Scenario: Dropped packages

- **WHEN** a package was deliberately removed
- **THEN** it SHALL NOT appear in the catalog
- **AND** the installer SHALL NOT install or manage compound, todos,
  powerbar, extension-settings, plannotator, slopchop, usage, raw-paste,
  autoresearch, plan, add-dir, claude-cli, prompt-templates, hackerman, or
  terminal-theme

#### Scenario: Essential control plane sources

- **WHEN** the catalog defines skill visibility and skill mention
- **THEN** `pi-skillful` SHALL resolve to `npm:pi-skillful`
- **AND** `mention-skill` SHALL resolve to `npm:@zigai/pi-mention-skill`
- **AND** the catalog SHALL ship exactly one mention implementation