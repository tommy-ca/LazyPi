# Installer Specification (lazypi)

## MODIFIED Requirements

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