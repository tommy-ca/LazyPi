## ADDED Requirements

### Requirement: Skill Visibility

The harness SHALL let the operator discover skills above the git root and
hide unused skills so only a small visible set enters automatic discovery.

#### Scenario: Hidden skills

- **WHEN** the operator configures hidden skills
- **THEN** hidden skills SHALL NOT appear in the automatic skill-discovery
  prompt
- **AND** hidden skills SHALL remain explicitly invokable

### Requirement: Skill Mention

The harness SHALL provide exactly one `$` skill-mention implementation so
hidden skills stay reachable from the prompt, and SHALL NOT co-install a
second mention implementation.

#### Scenario: Mention invocation

- **WHEN** the operator types `$skill-name` in a prompt
- **THEN** the skill's content SHALL expand into the prompt before the model
  sees it