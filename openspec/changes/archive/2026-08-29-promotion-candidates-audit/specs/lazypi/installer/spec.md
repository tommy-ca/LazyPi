# Installer Specification (lazypi)

## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 12 entries, all in the `core` category
- **AND** it SHALL contain subagents, pi-ask-user, pi-skillful,
  mention-skill, goal, btw, context-usage, simplify, web-access, fff,
  dynamic-workflows, and ponytail

#### Scenario: Catalog membership

- **WHEN** a package installed outside the catalog is considered for
  promotion
- **THEN** it SHALL be an active daily driver in the operator's install —
  installed and exercised in real sessions before any promotion decision
- **AND** it SHALL be currently maintained (recent releases on its primary
  distribution channel)
- **AND** it SHALL align with the lean harness philosophy (control plane or
  discipline layer, not meal-prep, chrome, or single-use conveniences)
- **AND** any native or install-script machinery SHALL have a demonstrated
  runtime path (prebuilt bindings or an approved build)
- **AND** it SHALL NOT be named in the Dropped packages scenario
- **AND** its promotion SHALL be ratified through a change spec carrying an
  audit trail before the catalog grows

#### Scenario: Side chat best alternative

- **WHEN** the catalog defines `btw`
- **THEN** its `source` SHALL be `npm:@narumitw/pi-btw`
- **AND** the replaced `npm:pi-btw` SHALL remain in `legacySources`

#### Scenario: Dropped packages

- **WHEN** a package was deliberately removed
- **THEN** it SHALL NOT appear in the catalog
- **AND** the installer SHALL NOT install or manage compound, todos,
  powerbar, extension-settings, plannotator, slopchop, usage, raw-paste,
  autoresearch, plan, add-dir, claude-cli, prompt-templates, hackerman,
  terminal-theme, skill-args, memory, mcp, interactive-shell, ralph-wiggum,
  or curated-themes

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

#### Scenario: Workflow engine source

- **WHEN** the catalog defines `dynamic-workflows`
- **THEN** its `source` SHALL be `npm:@quintinshaw/pi-dynamic-workflows`

#### Scenario: Discipline review source

- **WHEN** the catalog defines `ponytail`
- **THEN** its `source` SHALL be `npm:@dietrichgebert/ponytail`