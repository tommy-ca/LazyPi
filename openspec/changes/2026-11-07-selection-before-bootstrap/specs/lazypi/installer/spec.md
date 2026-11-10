## ADDED Requirements

### Requirement: Final selection before Pi setup

Install SHALL complete package selection and reject malformed settings before Pi setup. A cancelled or empty selection SHALL exit 0 without invoking npm or Pi or changing settings, model overrides, or backups.

#### Scenario: Cancel interactive selection

- **WHEN** the user cancels the initial choice or the package picker
- **THEN** install SHALL retain the existing `Aborted.` message and exit 0 before Pi setup
- **AND** npm and Pi SHALL NOT run
- **AND** settings, model overrides, and backups SHALL remain unchanged

#### Scenario: Confirm an empty picker

- **WHEN** the user confirms an empty package picker
- **THEN** install SHALL report `Nothing selected — nothing to install.` and exit 0 before Pi setup
- **AND** npm and Pi SHALL NOT run
- **AND** settings, model overrides, and backups SHALL remain unchanged

#### Scenario: Confirm a nonempty selection

- **WHEN** the user chooses Install everything or confirms a nonempty package picker
- **THEN** install SHALL complete selection before offering Pi bootstrap
- **AND** accepted bootstrap, catalog order, package installation, model overrides, and legacy migration SHALL retain their existing behavior

#### Scenario: Retain unattended validation and selection

- **WHEN** install receives `--yes`, `--only`, or `--except`
- **THEN** its existing selection, output, and exit behavior SHALL be retained
- **AND** an empty selection SHALL exit 0 before Pi setup
- **AND** unknown selectors or malformed settings SHALL exit 2 before Pi setup without changing settings, model overrides, or backups
