## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources` and `forked`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 12 entries across the categories `core`,
  `tools`, `research`, and `themes`
- **AND** `core` SHALL contain subagents, pi-ask-user, goal, btw,
  context-usage, and simplify
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
- **AND** the installer SHALL NOT install or manage plan, add-dir,
  claude-cli, prompt-templates, hackerman, or terminal-theme