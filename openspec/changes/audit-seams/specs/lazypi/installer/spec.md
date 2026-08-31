# Installer Specification (lazypi)

## MODIFIED Requirements

### Requirement: Idempotent Install

`install` SHALL read the Pi settings file, skip every source already present,
and apply legacy-source migration when a catalog entry's legacy source is
installed. Invalid settings JSON SHALL fail the run before any `pi` spawn.

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

#### Scenario: Versioned npm equivalence

- **WHEN** an installed source is `npm:pkg@<version>` (or a pinned `git:`
  source) and a catalog or legacy source is the unpinned `npm:pkg` (or
  unpinned `git:` source)
- **THEN** `status` SHALL count the entry as installed
- **AND** `install` SHALL skip it as already present
- **AND** the versioned source SHALL NOT appear under "Other Pi packages"

#### Scenario: Re-run

- **WHEN** `install` runs with every selected source already installed
- **THEN** it SHALL report nothing to do and exit 0
- **AND** it SHALL NOT write `settings.json` or a `.bak` when builtin
  empty-model overrides are already present for the six pi-subagents
  agents

#### Scenario: Corrupt settings

- **WHEN** `settings.json` exists and is not valid JSON
- **THEN** `install`, `status`, `update`, `remove`, and `doctor` SHALL
  print an error and exit 2
- **AND** they SHALL NOT spawn `pi`

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

#### Scenario: Empty selector

- **WHEN** `--only` or `--except` is passed with no list, an empty list,
  or both flags together
- **THEN** the CLI SHALL print help and exit 2

#### Scenario: Doctor environment

- **WHEN** `doctor` runs
- **THEN** it SHALL fail when the Node version is below 20
- **AND** it SHALL warn non-fatally about unpinned git heads among installed
  sources outside the catalog
- **AND** `package.json` SHALL declare `engines.node >= 20` to match

#### Scenario: Local install trust

- **WHEN** `install --local` or `remove --local` targets a project Pi
  settings file
- **THEN** every `pi install` / `pi remove` spawn SHALL include `--approve`
  so un-approved projects accept the change
- **AND** global (non-local) spawns SHALL NOT include `--approve`

#### Scenario: Spawn argv

- **WHEN** the CLI spawns `pi` or `npm`
- **THEN** the source and package arguments SHALL be passed as argv
  elements, not interpolated into a shell command line

#### Scenario: Unknown argument

- **WHEN** the CLI receives an unknown command or argument
- **THEN** it SHALL print help and exit 2

#### Scenario: Version flag

- **WHEN** `-V` or `--version` is passed
- **THEN** the CLI SHALL print the package version (from `package.json`) and
  exit 0

### Requirement: Subagent Overrides

When `subagents` is selected, `install` SHALL write empty-model overrides for
the builtin pi-subagents agents (context-builder, planner, researcher,
reviewer, scout, worker) into Pi settings so they fall back to the session
model. Existing extra keys on those override objects SHALL be kept.

#### Scenario: Model fallback

- **WHEN** a catalog entry with id `subagents` is selected for install
- **THEN** settings.json SHALL contain empty-model overrides for each builtin
  agent
- **AND** the overrides SHALL NOT be written when `subagents` is not selected

#### Scenario: Override merge

- **WHEN** a builtin override already has `model` set to an empty string
- **THEN** a re-run SHALL leave that object in place, including extra keys
- **AND** settings.json SHALL NOT be rewritten solely to restamp those
  empty models
