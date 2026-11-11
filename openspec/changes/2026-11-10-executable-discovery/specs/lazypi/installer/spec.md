# Installer specification

## ADDED Requirements

### Requirement: Executable discovery

The CLI SHALL resolve the `pi` and `npm` commands from the `PATH` environment
variable it was given, without spawning a lookup tool.

#### Scenario: Path walk

- **WHEN** a command is resolved on a POSIX platform
- **THEN** each `PATH` entry SHALL be visited in order and the first eligible
  match SHALL win
- **AND** an entry SHALL be eligible when it names a regular file that carries
  an execute bit
- **AND** a symlink SHALL be followed to the file it names, so a managed shim
  resolves and a symlink to a non-executable file does not
- **AND** empty entries SHALL be skipped rather than treated as the working
  directory
- **AND** an unset `PATH` SHALL resolve nothing

#### Scenario: No lookup tool

- **WHEN** `which` is absent from `PATH`
- **THEN** every resolution outcome SHALL be unchanged
- **AND** a present `pi` SHALL be found, so `install` SHALL run its `pi install`
  commands and SHALL NOT bootstrap npm
- **AND** resolution SHALL NOT spawn `which`

#### Scenario: Windows resolution

- **WHEN** a command is resolved on win32
- **THEN** `where` output SHALL retain its existing `.cmd`, `.bat`, `.exe`, or
  `.com` preference over an extensionless shim
- **AND** the exported resolution helpers SHALL retain their signatures and
  return shapes
- **AND** native Windows resolution SHALL NOT be claimed as observed without a
  Windows host
