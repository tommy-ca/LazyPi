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

## MODIFIED Requirements

### Requirement: Troubleshooting

The docs SHALL explain how to repair a catalog package whose runtime
dependency installation is missing or broken, so the operator can recover
without reinstalling Pi or LazyPi.

#### Scenario: Broken dependency footprint

- **WHEN** a catalog package fails at runtime with a missing dependency —
  for example pi-subagents and `Cannot find module 'acorn'`
- **THEN** the FAQ SHALL explain that the installed footprint is
  incomplete even though the package is present in settings
- **AND** the updating docs SHALL tell the operator to run
  `npx @tommy-ca/lazypi update`, which asks Pi for
  `pi update --extensions`, or to reinstall the package
- **AND** the docs SHALL mention removing a stale
  `~/.pi/agent/extensions/<name>` checkout that shadows the package in
  the npm store
- **AND** the docs SHALL state that `pi update --extensions` respects existing
  version pins and does not advance pinned packages
- **AND** when a failure persists after a footprint repair, the docs SHALL
  tell the operator to reinstall the package at the catalog's current
  version (`pi install npm:<pkg>@<version>`)

### Requirement: Catalog retirement

Retirement SHALL remove selection and legacy-resolution metadata from curation,
not mutate installed state, narrow broad updates, or change removal passthrough.

#### Scenario: Retired curation and selector rejection

- **WHEN** pi-skillful, mention-skill, goal, btw, context-usage, simplify, fff,
  dynamic-workflows, ponytail, lsp, interactive-shell, autoresearch, todos, or
  memory is passed to `--only` or `--except`
- **THEN** install SHALL reject it before bootstrap or package commands
- **AND** settings, backups, and command counters SHALL remain unchanged
- **AND** these entries SHALL NOT exist in another curated tier

#### Scenario: Unmanaged state and removal passthrough

- **WHEN** an installed source leaves curation
- **THEN** its registration SHALL remain Other, not uninstalled or disabled
- **AND** strings, objects, pins, metadata, order, scope, unrelated settings, and
  package data SHALL remain intact
- **AND** broad `pi update --extensions` SHALL remain broad, including unmanaged
  sources
- **AND** retirement SHALL NOT freeze updates or auto-exclude declared conflicts
- **AND** retired IDs SHALL no longer resolve catalog or legacy sources
- **AND** remove SHALL retain unknown-target passthrough unchanged
- **AND** operators SHALL use exact installed sources for retired removal
