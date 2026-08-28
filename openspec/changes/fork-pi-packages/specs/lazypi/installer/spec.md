## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources` and `forked`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 16 entries across the categories `core`,
  `tools`, `research`, and `themes`
- **AND** `core` SHALL contain subagents, pi-ask-user, pi-skillful,
  mention-skill, skill-args, goal, btw, context-usage, and simplify
- **AND** `tools` SHALL contain web-access, memory, mcp, interactive-shell,
  and fff
- **AND** `research` SHALL contain ralph-wiggum
- **AND** `themes` SHALL contain curated-themes only

#### Scenario: Essential control plane sources

- **WHEN** the catalog defines skill visibility and skill mention
- **THEN** `pi-skillful` SHALL resolve to `npm:pi-skillful`
- **AND** `mention-skill` SHALL resolve to `npm:@zigai/pi-mention-skill`
- **AND** the catalog SHALL ship exactly one mention implementation

#### Scenario: Skill arguments source

- **WHEN** the catalog defines `skill-args`
- **THEN** its `source` SHALL be `npm:@juicesharp/rpiv-args`

#### Scenario: Search substrate source

- **WHEN** the catalog defines `fff`
- **THEN** its `source` SHALL be `npm:@ff-labs/pi-fff`
- **AND** its default mode SHALL be additive (`tools-and-ui`)

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