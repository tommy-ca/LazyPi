## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources` and `forked`.

#### Scenario: Current catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 18 entries across the categories `core`,
  `tools`, `research`, and `themes`
- **AND** `core` SHALL contain subagents, pi-ask-user, goal, btw,
  context-usage, plan, and simplify
- **AND** `tools` SHALL contain web-access, memory, mcp, add-dir,
  interactive-shell, claude-cli, and prompt-templates
- **AND** `research` SHALL contain ralph-wiggum
- **AND** `themes` SHALL contain hackerman, curated-themes, and terminal-theme

#### Scenario: Dropped packages

- **WHEN** a package was deliberately removed
- **THEN** it SHALL NOT appear in the catalog
- **AND** the installer SHALL NOT install or manage compound, todos,
  powerbar, extension-settings, plannotator, slopchop, usage, raw-paste, or
  autoresearch

#### Scenario: Repointed fork sources

- **WHEN** a fork is published for a catalog entry
- **THEN** `source` SHALL be `npm:@tommy-ca/pi-<name>`
- **AND** the replaced upstream source SHALL remain in `legacySources`

### Requirement: Git Sources

A catalog source beginning with `git:` SHALL be installed with
`npm_config_ignore_scripts=true`. Pinned git sources are permitted; unpinned
git heads are not.

#### Scenario: Git install

- **WHEN** the installer runs `pi install` for a `git:` source
- **THEN** the install SHALL run with `npm_config_ignore_scripts=true`