## MODIFIED Requirements

### Requirement: Control Plane Catalog

The installed package set SHALL cover: sub-agent scheduling, the ask gate,
skill visibility, $ skill mention, a long-objective gate, a side-thread
channel, context-budget visibility, code simplification review, web research
tools, and a search substrate; it SHALL NOT include a checkbox todo list.

#### Scenario: Long objective

- **WHEN** a goal is active
- **THEN** the agent reports done, blocked (with evidence), or waiting on an
  external event rather than drifting between steps

#### Scenario: Harness core

- **WHEN** the default install completes
- **THEN** the installed set SHALL be exactly the ten essential control-plane
  packages
- **AND** optional extras SHALL be installable on demand with `pi install`

### Requirement: Skill Parameters

The harness SHALL support shell-style skill parameters when a parameters
package is installed.

#### Scenario: Parameters and command output

- **WHEN** a parameters package is installed and a skill is invoked with
  arguments
- **THEN** positional placeholders (`$1`, `$2`, `$ARGUMENTS`) SHALL expand in
  the skill body
- **AND** inline `` !`cmd` `` blocks SHALL execute and paste their output into
  the prompt before the model reads it