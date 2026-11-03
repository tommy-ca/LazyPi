# Installer specification

## MODIFIED Requirements

### Requirement: Idempotent Install

`install` SHALL read the Pi settings file, skip every source already present,
and apply legacy-source migration when a catalog entry's legacy source is
installed. Invalid settings JSON SHALL fail the run before any `pi` spawn.

#### Scenario: Legacy migration

- **WHEN** an installed source matches an entry's `legacySources`
- **THEN** the installer SHALL run `pi install <source>` before
  `pi remove <legacy>` when the replacement is missing
- **AND** failed replacement installation SHALL fail the entry without removing legacy sources or rewriting their settings
- **AND** successful installation SHALL be followed by removal using the exact installed legacy source, including its pin
- **AND** failed legacy cleanup SHALL fail the entry while retaining the installed replacement
- **AND** local install and removal SHALL retain `-l --approve`; global operations SHALL omit these flags

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
