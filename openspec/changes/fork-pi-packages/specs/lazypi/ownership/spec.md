# Fork Ownership Specification (lazypi)

## Purpose

A forked catalog entry SHALL resolve to an owned, published, individually
installable `@tommy-ca/pi-*` package whose source the operator controls,
while the installer retains a one-command migration and rollback path.

## ADDED Requirements

### Requirement: Fork Marker

A catalog entry whose `source` is an owned fork SHALL set `forked: true` and
SHALL list the replaced upstream source(s) in `legacySources`.

#### Scenario: Status grouping

- **WHEN** `status` runs
- **THEN** forked entries SHALL be grouped under an "Owned forks" section
- **AND** `doctor` SHALL present them as reviewed-owned rather than
  third-party-fetch

#### Scenario: Migration

- **WHEN** an installed source matches a `legacySources` entry
- **THEN** the next `install`/`update` SHALL remove the legacy source and
  install the fork
- **AND** keeping `legacySources` SHALL make rollback a one-command operation

### Requirement: Published and Installable

Every owned fork SHALL be published to npm under `@tommy-ca/pi-*`, SHALL be
individually installable (`pi install npm:@tommy-ca/pi-<name>`), and SHALL
pass a ship-manifest test that loads under a minimal Pi-API harness.

#### Scenario: Fresh install of a fork

- **WHEN** a fork is published and installed on a clean Pi
- **THEN** `pi install npm:@tommy-ca/pi-<name>` SHALL succeed
- **AND** a `/reload` SHALL complete without load errors
- **AND** the fork's ship-manifest test SHALL pass against the installed core

### Requirement: No Unpinned Git Heads

After this change lands, no catalog source SHALL be an unpinned git head.

#### Scenario: Catalog evaluation

- **WHEN** the catalog is evaluated
- **THEN** no entry SHALL carry a `git:github.com/<owner>/<repo>` source
  without an `@<sha>` suffix