# Installer specification

## ADDED Requirements

### Requirement: Update scope

`update` SHALL request extension-package updates from Pi and SHALL NOT request a
Pi harness self-update, because Pi's bare `pi update` upgrades the Pi harness
itself while `pi update --extensions` updates registered extension packages
across the global scope and projects Pi already trusts.

#### Scenario: Extension update only

- **WHEN** `lazypi update` runs
- **THEN** LazyPi SHALL spawn exactly one `pi update --extensions` invocation
- **AND** it SHALL NOT spawn `pi update` without `--extensions`, so it SHALL NOT
  ask Pi to upgrade itself
- **AND** it SHALL NOT pass `--approve`, because that changes project trust
  rather than update scope
- **AND** it SHALL NOT pass `-l` or `--local`, because Pi rejects those for
  update
- **AND** it SHALL NOT install catalog sources one at a time, so one update
  SHALL remain one Pi invocation
- **AND** it SHALL print the command it spawns
- **AND** the global settings file, the project settings file, saved project
  trust, and the backup set SHALL remain byte-identical
- **AND** Pi's exit status SHALL be returned unchanged

#### Scenario: Project-only update is rejected

- **WHEN** `lazypi update --local` or `lazypi update -l` runs
- **THEN** the CLI SHALL exit 2 with
  `update does not support --local: pi cannot update project extensions on their own`
  on stderr and the help text on stdout
- **AND** it SHALL reject the command before spawning any child process and
  before writing any file
- **AND** both settings scopes and the backup set SHALL remain byte-identical
- **AND** documentation SHALL state why: Pi cannot perform a project-only
  extension update, because its extension update always spans the global scope
  and trusted projects and it rejects `-l` itself

#### Scenario: Scope documentation

- **WHEN** an operator reads `lazypi --help` or the README
- **THEN** both SHALL name `pi update --extensions` as what `update` runs
- **AND** both SHALL state that `update` never self-updates the Pi harness
- **AND** both SHALL state that project-only update is unsupported because Pi
  cannot perform it
