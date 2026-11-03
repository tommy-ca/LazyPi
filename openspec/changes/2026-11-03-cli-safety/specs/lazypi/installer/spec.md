# Installer specification

## ADDED Requirements

### Requirement: CLI safety boundaries

The CLI SHALL reject inapplicable installation selectors, avoid setup for an empty unattended selection, and inspect version execution status.

#### Scenario: Selectors outside install

- **WHEN** `update`, `remove`, `status`, or `doctor` receives `--only` or `--except`
- **THEN** the CLI SHALL print help and exit 2
- **AND** it SHALL report `--only and --except are only supported by install`
- **AND** it SHALL NOT execute Pi or change settings

#### Scenario: Conflicting selectors retain command-scope precedence

- **WHEN** a non-install command receives both valid selectors
- **THEN** it SHALL retain the install-only selector diagnostic and exit 2 without side effects
- **AND** install with both selectors SHALL retain its existing mutual-exclusion diagnostic

#### Scenario: Empty unattended selection

- **WHEN** install resolves an empty unattended selection and settings are valid or absent
- **THEN** it SHALL report nothing selected and exit 0 before Pi setup
- **AND** it SHALL NOT run npm or Pi or create settings
- **AND** invalid settings SHALL still fail closed

#### Scenario: Failed version execution

- **WHEN** `pi --version` exits unsuccessfully or provides no output
- **THEN** doctor SHALL issue a nonfatal warning rather than a passing version check
- **AND** successful version execution with output SHALL retain its passing check
