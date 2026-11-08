# Installer specification

## ADDED Requirements

### Requirement: Private packed verification context

The existing packed E2E script SHALL create one disposable run root before any subprocess. Every subprocess SHALL use that root as its explicit cwd and the same allowlisted child environment. Private state SHALL NOT be described as OS containment or proof of extension functionality.

#### Scenario: Private setup and artifact

- **WHEN** packed verification starts
- **THEN** it SHALL provide private HOME, USERPROFILE, Pi agent, XDG, temporary, npm configuration, and npm cache paths under its run root
- **AND** its child environment SHALL inherit only PATH and, on Windows, the explicit SystemRoot, WINDIR, COMSPEC, and PATHEXT process variables
- **AND** it SHALL NOT inherit authentication, provider, SSH, session, NODE_OPTIONS, npm configuration, proxy, or Pi override variables
- **AND** npm pack SHALL read the checkout by explicit path and write its tarball under the run root, never the checkout
- **AND** npm install SHALL install that tarball under the run root without a global install

#### Scenario: Missing or failing Pi

- **WHEN** the private-context Pi version preflight cannot execute or exits unsuccessfully
- **THEN** the script SHALL fail with exit 1 before running npm or the packed bin
- **AND** it SHALL report `Pi executable required on PATH before packed verification`
- **AND** it SHALL NOT bootstrap Pi globally

#### Scenario: Setup failure and retained state

- **WHEN** setup, packing, tarball installation, or a later assertion fails
- **THEN** the script SHALL report E2E failure and exit 1
- **AND** it SHALL remove the run root unless `--keep` is present
- **AND** `--keep` SHALL retain the run root and report its path on success and failure
- **AND** an invalid tarball filename SHALL be rejected before installation

#### Scenario: Preserved packed-bin stages

- **WHEN** setup succeeds
- **THEN** the script SHALL invoke the installed packed bin with `process.execPath`, not npm exec or a shell command
- **AND** it SHALL retain exact PACKAGES-derived core-then-optional settings arrays and install count expectations
- **AND** it SHALL retain idempotency, builtin overrides, status, replacement-before-legacy-cleanup, removal, and doctor stages
- **AND** npm view and direct Pi migration seeds SHALL use the same private cwd and environment as setup and packed-bin commands

#### Scenario: Offline orchestration evidence

- **WHEN** public-script regression checks run
- **THEN** npm, Pi, and the installed packed bin SHALL be fail-closed fixtures with no ambient executable fallback
- **AND** tests SHALL assert exit status, relevant stdout and stderr, command arguments, environment, and cleanup or retention effects
- **AND** that evidence SHALL NOT be presented as real package installation, Pi runtime, extension execution, OS containment, or readiness certification
