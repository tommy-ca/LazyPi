# Installer specification

## ADDED Requirements

### Requirement: Installer documentation accuracy

User documentation SHALL distinguish package installation, intentional settings changes, backups, and runner caches.

#### Scenario: Subagent configuration changes

- **WHEN** users read the overview, FAQ, installation guide, or subagents page
- **THEN** the docs SHALL explain that selecting subagents can reset builtin model overrides even on re-runs
- **AND** the installation guide and subagents page SHALL list `context-builder`, `planner`, `researcher`, `reviewer`, `scout`, and `worker`
- **AND** the docs SHALL explain the session-model fallback and preservation of other override keys
- **AND** they SHALL describe timestamped backups before changing existing settings

#### Scenario: Persistent artifacts and removal selection

- **WHEN** users read the installation or removal guide
- **THEN** the docs SHALL distinguish installed packages, settings overrides, backup files, and runner caches
- **AND** they SHALL NOT promise fresh downloads or automatic removal of caches and backups
- **AND** removal instructions SHALL say that space selects packages to remove and an empty selection removes nothing
