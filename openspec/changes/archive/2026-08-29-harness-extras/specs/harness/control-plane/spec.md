## MODIFIED Requirements

### Requirement: Control Plane Catalog

The installed package set SHALL cover: sub-agent scheduling, a workflow
engine for sub-agent fan-out, the ask gate, skill visibility, $ skill
mention, a long-objective gate, a side-thread channel, context-budget
visibility, code simplification review, code-discipline review, web research
tools, and a search substrate; it SHALL NOT include a checkbox todo list.

#### Scenario: Long objective

- **WHEN** a goal is active
- **THEN** the agent reports done, blocked (with evidence), or waiting on an
  external event rather than drifting between steps

#### Scenario: Harness core

- **WHEN** the default install completes
- **THEN** the installed set SHALL be exactly the twelve essential
  control-plane packages
- **AND** optional extras SHALL be installable on demand with `pi install`