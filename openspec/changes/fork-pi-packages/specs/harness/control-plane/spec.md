## MODIFIED Requirements

### Requirement: Control Plane Catalog

The installed package set SHALL cover: sub-agent scheduling, the ask gate, a
long-objective gate, a side-thread channel, context-budget visibility, code
simplification review, and web research tools; it SHALL NOT include a checkbox
todo list.

#### Scenario: Long objective

- **WHEN** a goal is active
- **THEN** the agent reports done, blocked (with evidence), or waiting on an
  external event rather than drifting between steps

#### Scenario: Web research providers

- **WHEN** web research tools are installed
- **THEN** fetch/search SHALL support pluggable providers with a keyless
  default provider so research works before an API key is configured