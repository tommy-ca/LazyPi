# Installer specification

## MODIFIED Requirements

### Requirement: Executable CI contracts

Workflow checks SHALL verify required commands as executable run steps rather than raw substrings. CLI fixtures SHALL isolate settings and SHALL make real tools unreachable.

#### Scenario: Required workflow execution

- **WHEN** CI contract tests inspect Linux or Windows workflows
- **THEN** they SHALL check required command order using uncommented run steps
- **AND** conditional or multiline workflow forms outside the checker's supported shape SHALL fail closed
- **AND** regression mutations with a commented, false-conditioned, or reversed required command SHALL fail the check

#### Scenario: Portable update fixture

- **WHEN** the update delegation regression runs on Windows
- **THEN** its mock Pi SHALL use a `.cmd` launcher
- **AND** the child `PATH` SHALL hold fixture stub directories only, with no system directory and no directory of the running Node executable
- **AND** every fixture stub SHALL start through an absolute interpreter path, so starting it needs no `PATH` lookup
- **AND** a lookup for a fixture command with no stub SHALL fail the test instead of reaching a real tool
- **AND** all platforms SHALL isolate `HOME`, `USERPROFILE`, `PI_CODING_AGENT_DIR`, `TMPDIR` and npm configuration
- **AND** temporary fixtures SHALL be cleaned up after the test
