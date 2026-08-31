# Control Plane Specification (harness)

## MODIFIED Requirements

### Requirement: Control Plane Catalog

The default installed package set SHALL cover: sub-agent scheduling, a
workflow engine for sub-agent fan-out, the ask gate, skill visibility, $
skill mention, a long-objective gate, a side-thread channel, context-budget
visibility, code simplification review, code-discipline review, web research
tools, and a search substrate. The default set SHALL NOT include a checkbox
todo list. A structured todo tracker MAY exist in the optional catalog tier.

#### Scenario: Long objective

- **WHEN** a goal is active
- **THEN** the agent reports done, blocked (with evidence), or waiting on an
  external event rather than drifting between steps

#### Scenario: Harness core

- **WHEN** the default install completes
- **THEN** the installed set SHALL be exactly the twelve core
  control-plane packages
- **AND** optional catalog entries SHALL be installable with
  `lazypi --only optional`, `--except`, the interactive picker, or the
  interactive everything flow
- **AND** non-catalog extras SHALL remain installable with `pi install`
