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
- **AND** after the `n/PACKAGES.length` header, it SHALL report core and
  optional installed counts from PACKAGES categories

#### Scenario: Scoped install

- **WHEN** `--only core` or `--except <id>` is passed
- **THEN** only matching categories or package ids are selected
- **AND** `--except` SHALL subtract from the full catalog (16 ids for
  `--except todos`)

#### Scenario: Empty selector

- **WHEN** `--only` or `--except` is passed with no list, an empty list,
  or both flags together
- **THEN** the CLI SHALL print help and exit 2

#### Scenario: Missing pi

- **WHEN** `install` or `update` runs without a `pi` executable on PATH
- **THEN** the CLI SHALL NOT block on an interactive prompt when stdin or
  stdout is not a TTY
- **AND** on a non-TTY without `--yes` it SHALL print an error and exit 127
- **AND** on a TTY it SHALL offer to install Pi and exit 127 when declined

#### Scenario: Doctor environment

- **WHEN** `doctor` runs
- **THEN** it SHALL fail when the Node version is below 20
- **AND** it SHALL fail when npm is missing
- **AND** it SHALL fail when pi is missing
- **AND** `warn()` SHALL be non-fatal by default
- **AND** missing git, missing settings, and unread `pi --version` SHALL
  NOT fail the run
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
- **AND** on win32, a resolved path matching `.cmd` or `.bat` SHALL be
  invoked as ComSpec argv (`/d /s /c call` plus a quoted program plus the
  args)
- **AND** `call` SHALL precede the quoted program so cmd `/s` does not
  strip quotes on paths with spaces
- **AND** sources SHALL remain extra argv elements
- **AND** a source containing cmd metacharacters SHALL stay one quoted
  argv slot
- **AND** the CLI SHALL NOT join sources into a shell string
- **AND** the CLI SHALL NOT default spawnSync `shell: true`
- **AND** the ComSpec plan SHALL set `windowsVerbatimArguments: true`

#### Scenario: Unknown argument

- **WHEN** the CLI receives an unknown command or argument
- **THEN** it SHALL print help and exit 2

#### Scenario: Version flag

- **WHEN** `-V` or `--version` is passed
- **THEN** the CLI SHALL print the package version (from `package.json`) and
  exit 0
