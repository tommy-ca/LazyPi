## ADDED Requirements

### Requirement: Skill Parameters

The harness SHALL let skills accept shell-style parameters and inline command
expansion at invocation.

#### Scenario: Parameters and command output

- **WHEN** a skill is invoked with arguments
- **THEN** positional placeholders (`$1`, `$2`, `$ARGUMENTS`) SHALL expand in
  the skill body
- **AND** inline `` !`cmd` `` blocks SHALL execute and paste their output into
  the prompt before the model reads it