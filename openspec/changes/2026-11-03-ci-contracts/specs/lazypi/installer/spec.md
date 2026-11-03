# Installer specification

## ADDED Requirements

### Requirement: Executable CI contracts

Workflow checks SHALL verify required commands as executable run steps rather than raw substrings. CLI fixtures SHALL isolate settings and support the platform running the suite.

#### Scenario: Required workflow execution

- **WHEN** CI contract tests inspect Linux or Windows workflows
- **THEN** they SHALL check required command order using uncommented run steps
- **AND** conditional or multiline workflow forms outside the checker's supported shape SHALL fail closed
- **AND** regression mutations with a commented, false-conditioned, or reversed required command SHALL fail the check

#### Scenario: Portable update fixture

- **WHEN** the update delegation regression runs on Windows
- **THEN** its mock Pi SHALL use a `.cmd` launcher and retain the system PATH
- **AND** all platforms SHALL isolate `HOME`, `USERPROFILE`, and `PI_CODING_AGENT_DIR`
- **AND** temporary fixtures SHALL be cleaned up after the test
