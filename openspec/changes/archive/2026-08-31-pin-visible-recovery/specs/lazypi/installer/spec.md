# Installer Specification (lazypi)

## MODIFIED Requirements

### Requirement: Commands

The CLI SHALL provide `install` (default), `status`, `update`, `doctor`, and
`remove`, and SHALL accept `--only <list>`, `--except <list>`, `-l/--local`,
`-y/--yes`, and `-h/--help`.

#### Scenario: Status derivation

- **WHEN** `status` runs
- **THEN** it SHALL group catalog entries as installed, legacy, missing, and
  other (outside the catalog), with counts derived from `PACKAGES`
- **AND** it SHALL display the installed source for an installed entry;
  when that source carries a version pin that differs from the catalog
  source, the pin SHALL be visible in the output

#### Scenario: Scoped install

- **WHEN** `--only core` or `--except <id>` is passed
- **THEN** only matching categories or package ids are selected

#### Scenario: Empty selector

- **WHEN** `--only` or `--except` is passed with no list, an empty list,
  or both flags together
- **THEN** the CLI SHALL print help and exit 2

#### Scenario: Missing pi

- **WHEN** `install` or `update` runs without a `pi` executable on PATH
- **THEN** the CLI SHALL NOT block on an interactive prompt when stdin or
  stdout is not a TTY
- **AND** on a non-TTY it SHALL print an error and exit 127
- **AND** on a TTY it SHALL offer to install Pi and exit 127 when declined

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

### Requirement: Troubleshooting

The docs SHALL explain how to repair a catalog package whose runtime
dependency installation is missing or broken, so the operator can recover
without reinstalling Pi or LazyPi.

#### Scenario: Broken dependency footprint

- **WHEN** a catalog package fails at runtime with a missing dependency —
  for example pi-subagents and `Cannot find module 'acorn'`
- **THEN** the FAQ SHALL explain that the installed footprint is
  incomplete even though the package is present in settings
- **AND** the updating docs SHALL tell the operator to run `pi update` (or
  `npx @tommy-ca/lazypi update`) or reinstall the package
- **AND** the docs SHALL mention removing a stale
  `~/.pi/agent/extensions/<name>` checkout that shadows the package in
  the npm store
- **AND** the docs SHALL state that `pi update` respects existing version
  pins and does not advance pinned packages
- **AND** when a failure persists after a footprint repair, the docs SHALL
  tell the operator to reinstall the package at the catalog's current
  version (`pi install npm:<pkg>@<version>`)