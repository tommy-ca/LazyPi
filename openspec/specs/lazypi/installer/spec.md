# Installer Specification (lazypi)

## Purpose

The `lazypi` CLI SHALL install, report, update, check, and remove a curated
catalog of Pi packages with idempotent, reproducible behavior and a
self-deriving CI contract.

## Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources` and `essential`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 10 entries, all in the `core` category
- **AND** it SHALL contain subagents, pi-ask-user, pi-skillful,
  mention-skill, goal, btw, context-usage, simplify, web-access, and fff
- **AND** every entry SHALL be tagged `essential: true`
- **AND** non-essential packages SHALL NOT be in the catalog

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

### Requirement: Idempotent Install

`install` SHALL read the Pi settings file, skip every source already present,
and apply legacy-source migration when a catalog entry's legacy source is
installed.

#### Scenario: Legacy migration

- **WHEN** an installed source matches an entry's `legacySources`
- **THEN** the installer SHALL run `pi remove <legacy>` before
  `pi install <source>`
- **AND** a failed migration SHALL fail the entry without installing

#### Scenario: Legacy convergence

- **WHEN** a catalog entry's legacy source is installed alongside its
  replacement source
- **THEN** `install` SHALL remove the legacy source without reinstalling the
  replacement
- **AND** a failed removal SHALL fail the run for that entry
- **AND** the summary SHALL count it as a migration

#### Scenario: Re-run

- **WHEN** `install` runs with every selected source already installed
- **THEN** it SHALL report nothing to do and exit 0

### Requirement: Commands

The CLI SHALL provide `install` (default), `status`, `update`, `doctor`, and
`remove`, and SHALL accept `--only <list>`, `--except <list>`, `-l/--local`,
`-y/--yes`, and `-h/--help`.

#### Scenario: Status derivation

- **WHEN** `status` runs
- **THEN** it SHALL group catalog entries as installed, legacy, missing, and
  other (outside the catalog), with counts derived from `PACKAGES`

#### Scenario: Scoped install

- **WHEN** `--only core` or `--except <id>` is passed
- **THEN** only matching categories or package ids are selected

#### Scenario: Doctor environment

- **WHEN** `doctor` runs
- **THEN** it SHALL fail when the Node version is below 20
- **AND** it SHALL warn non-fatally about unpinned git heads among installed
  sources outside the catalog
- **AND** `package.json` SHALL declare `engines.node >= 20` to match

### Requirement: Subagent Overrides

When `subagents` is selected, `install` SHALL write empty-model overrides for
the builtin pi-subagents agents (context-builder, planner, researcher,
reviewer, scout, worker) into Pi settings so they fall back to the session
model.

#### Scenario: Model fallback

- **WHEN** a catalog entry with id `subagents` is selected for install
- **THEN** settings.json SHALL contain empty-model overrides for each builtin
  agent
- **AND** the overrides SHALL NOT be written when `subagents` is not selected

### Requirement: Auth Visibility

`install` and `doctor` SHALL report detected credentials (provider env vars
and `auth.json`) so the operator knows whether to run `/login`.

#### Scenario: Credential report

- **WHEN** `install` summarizes the plan or `doctor` inspects the environment
- **THEN** the report SHALL list providers detected from env vars and
  `auth.json`
- **AND** it SHALL say when no credentials are detected

### Requirement: Self-Deriving CI

The exact-source assertion used by CI SHALL derive from `PACKAGES` rather than
a separate manifest, so catalog edits propagate to CI automatically.

#### Scenario: Full-install assertion

- **WHEN** `scripts/assert-installed-packages.mjs --check-status` runs after a
  full `--yes` install
- **THEN** it SHALL find every non-excluded `PACKAGES` source in settings.json
- **AND** the `status` header SHALL report the expected count over
  `PACKAGES.length`

### Requirement: Skill Arguments

The catalog MAY provide a skill-parameter package so skill bodies accept
shell-style arguments and inline command expansion at invocation; when
cataloged, `skill-args` SHALL resolve to `npm:@juicesharp/rpiv-args`.

#### Scenario: Parameterized skill

- **WHEN** a skill is invoked with arguments
- **THEN** the skill body SHALL receive positional placeholders (`$1`, `$2`)
  and the raw input line
- **AND** inline `` !`cmd` `` blocks SHALL run and paste their output into
  the prompt before the model reads it

### Requirement: Search Tools

The catalog SHALL provide an FFF-based search substrate that registers
fuzzy file and content search tools alongside Pi's built-in find/grep.

#### Scenario: Additive search

- **WHEN** the search package is installed with its default mode
- **THEN** `fffind`, `ffgrep`, and `fff-multi-grep` SHALL be registered as
  additional tools
- **AND** the built-in `find` and `grep` tool names SHALL remain available
- **AND** replacing the built-in names SHALL require an explicit override
  mode

#### Scenario: Paged content search

- **WHEN** a content search returns more matches than a page
- **THEN** the result SHALL include a cursor for fetching the next page
