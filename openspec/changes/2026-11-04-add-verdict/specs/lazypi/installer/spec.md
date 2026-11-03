# Installer specification

## ADDED Requirements

### Requirement: Permission gate catalog entry

The optional tier SHALL include a permission-gate package.

#### Scenario: Verdict package

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain an entry with id `verdict`, category `optional`, and source `npm:pi-verdict`
- **AND** the total catalog SHALL be 18 entries: 12 core and 6 optional
- **AND** the packages index page SHALL list all 18 entries
