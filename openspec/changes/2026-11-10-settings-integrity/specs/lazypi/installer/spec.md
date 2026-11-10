## ADDED Requirements

### Requirement: Settings file integrity

LazyPi SHALL treat the Pi settings document as untrusted input and SHALL NOT be
able to destroy, silently discard, or disclose it.

#### Scenario: Settings document shape

- **WHEN** `settings.json` exists, is valid JSON, and its top-level value is not
  an object
- **THEN** `install`, `status`, `update`, `remove`, and `doctor` SHALL print an
  error and exit 2
- **AND** they SHALL NOT spawn `pi`
- **AND** the file SHALL remain byte-identical

#### Scenario: Wrong-typed settings fields

- **WHEN** the document is an object but `packages` is not an array,
  `subagents` is not an object, or `subagents.agentOverrides` is not an object
- **THEN** every command SHALL print an error naming the offending field and
  its observed type, and exit 2
- **AND** the file SHALL remain byte-identical
- **AND** the override write SHALL NOT be reported as applied

#### Scenario: Non-regular settings target

- **WHEN** the resolved settings path is a symlink or is not a regular file
- **THEN** any writing command SHALL refuse with a printed error and exit 2
- **AND** it SHALL NOT copy the target's bytes anywhere, overwrite the target,
  or create a backup
- **AND** read-only commands MAY follow the path

#### Scenario: Atomic write

- **WHEN** a settings write fails at any point before the new content is
  complete
- **THEN** the previous file content SHALL remain intact
- **AND** no partial temporary file SHALL remain
- **AND** the failure SHALL be reported without an internal stack trace

#### Scenario: Backup collision

- **WHEN** two settings mutations occur within the same second
- **THEN** each SHALL produce its own backup file
- **AND** no backup SHALL be overwritten by a later mutation

#### Scenario: Printed settings-derived strings

- **WHEN** a command prints a package source, provider name, or path that was
  read from `settings.json` or `auth.json`
- **THEN** C0 and C1 control characters SHALL NOT reach the terminal

### Requirement: Credential source validity

Credential detection SHALL read only a well-formed `auth.json` object.

#### Scenario: Non-object auth document

- **WHEN** `auth.json` is valid JSON but its top-level value is not an object
- **THEN** `install` and `doctor` SHALL report no providers from that file
- **AND** `doctor` SHALL NOT report the file as a passing credential source

## MODIFIED Requirements

### Requirement: Auth Visibility

`install` and `doctor` SHALL report detected credentials (provider env vars
and `auth.json`) so the operator knows whether to run `/login`.

#### Scenario: Credential report

- **WHEN** `install` summarizes the plan or `doctor` inspects the environment
- **THEN** the report SHALL list providers detected from env vars and
  `auth.json`
- **AND** it SHALL say when no credentials are detected

#### Scenario: Credential values are never printed

- **WHEN** a credential is detected from an env var or `auth.json`
- **THEN** the report SHALL name the provider and the env var only
- **AND** it SHALL NOT print any secret value

#### Scenario: Malformed auth document

- **WHEN** `auth.json` is not a JSON object
- **THEN** no provider SHALL be attributed to it

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

#### Scenario: Version request with an invalid argument

- **WHEN** `--version` is combined with an unrecognized argument
- **THEN** the CLI SHALL report the unknown argument and exit 2
- **AND** it SHALL NOT print the version and exit 0

#### Scenario: Interactive decision is made once

- **WHEN** a selector flag made the run non-interactive, or the run is not on a TTY
- **THEN** no prompt SHALL be shown, including the Pi bootstrap offer
- **AND** the command SHALL fail closed with its documented exit code instead of blocking on input
