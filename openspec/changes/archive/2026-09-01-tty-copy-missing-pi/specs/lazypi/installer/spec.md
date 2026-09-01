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
- **AND** on a non-TTY without `--yes` it SHALL print an error and exit 127
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

### Requirement: Catalog documentation

`README.md` SHALL list each `PACKAGES` id in `PACKAGES` order with its
category and a rationale.

`README.md` SHALL state that `--yes` installs 12 packages.

`README.md` SHALL state that the TTY Install everything path installs 17
packages.

The TTY everything option label SHALL be Install everything.

Catalog documentation SHALL NOT call that option recommended.

`docs/docs/installation.html` SHALL NOT contain `(recommended)`.

`docs/index.html` SHALL NOT contain `(recommended)`.

`docs/docs/philosophy.html` SHALL explain why the default install is the
12 core packages.

`docs/docs/philosophy.html` SHALL explain why five packages are optional.

`docs/docs/philosophy.html` SHALL name the membership bar as control
plane or discipline, not meal-prep or chrome.

`docs/docs/philosophy.html` SHALL name Dropped packages as outside the
catalog.

`docs/docs/philosophy.html` SHALL state that `pi install` still works for
Dropped packages.

`docs/docs/philosophy.html` SHALL state that LazyPi does not manage
Dropped packages.

`docs/docs/index.html` SHALL point at the philosophy page.

`docs/docs/index.html` SHALL NOT feature Dropped ids as optional extras.

#### Scenario: README catalog table

- **WHEN** `README.md` is read
- **THEN** it SHALL list each `PACKAGES` id in `PACKAGES` order
- **AND** each listed id SHALL have category `core` or `optional`
- **AND** each listed id SHALL have a rationale

#### Scenario: Default versus everything counts

- **WHEN** `README.md` describes install counts
- **THEN** it SHALL state that `--yes` installs 12 packages
- **AND** it SHALL state that TTY Install everything installs 17 packages

#### Scenario: Philosophy page

- **WHEN** `docs/docs/philosophy.html` is read
- **THEN** it SHALL explain why 12 is the default install
- **AND** it SHALL explain why 5 packages are optional
- **AND** it SHALL name the membership bar as control plane or
  discipline, not meal-prep or chrome
- **AND** it SHALL name Dropped packages as outside the catalog
- **AND** it SHALL state that `pi install` still works for those packages
- **AND** it SHALL state that LazyPi does not manage them

#### Scenario: Overview does not merchandise dropped extras

- **WHEN** `docs/docs/index.html` is read
- **THEN** it SHALL point at `philosophy.html`
- **AND** it SHALL NOT feature Dropped ids as optional extras

#### Scenario: TTY option label is not recommended

- **WHEN** `docs/docs/installation.html` or `docs/index.html` is read
- **THEN** the TTY option label SHALL be Install everything
- **AND** neither page SHALL contain `(recommended)`
