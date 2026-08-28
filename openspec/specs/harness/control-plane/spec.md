# Control Plane Specification (harness)

## Purpose

The harness SHALL keep the Pi coding agent minimal by layering discipline
(AGENTS.md), capability (skills), and control plane (packages) so the operator
owns which rules are resident, which capabilities load on demand, and which
work goes to a child.

## Requirements

### Requirement: Layer Separation

The harness SHALL maintain three layers with distinct change frequency and
context cost: AGENTS.md discipline (resident, rarely changed), skills
(description-resident, body on demand), and packages (always-on extensions).

#### Scenario: Progressive disclosure

- **WHEN** a session starts
- **THEN** only skill name and description are loaded into the system prompt
- **AND** a full SKILL.md is read only when the agent matches it or the user invokes it
- **AND** no more than 4–6 skills are visible by default

### Requirement: Ask Gate

The agent SHALL call the structured ask gate (`ask_user`) instead of guessing
when the target file, create-vs-edit, acceptance criteria, or a mutually
exclusive implementation option is undefined.

#### Scenario: Ambiguous request

- **WHEN** a request is underspecified
- **THEN** the agent stops and asks one focused structured question
- **AND** no large diff is generated before a structured answer exists

### Requirement: Coding Loop

Work SHALL follow clarify → scout (read-only) → worker (single writer) →
fresh reviewers (read-only, parallel) → parent aggregation, with evidence
required before completion.

#### Scenario: Review isolation

- **WHEN** a reviewer inspects a diff
- **THEN** the reviewer runs with fresh context
- **AND** the reviewer never inherits the worker's conversation transcript

#### Scenario: Parallel execution

- **WHEN** two writers must proceed in parallel
- **THEN** they run in managed worktrees
- **AND** the parent merges the results

### Requirement: Control Plane Catalog

The installed package set SHALL cover: sub-agent scheduling, the ask gate, a
long-objective gate, a side-thread channel, context-budget visibility, code
simplification review, and web research tools; it SHALL NOT include a checkbox
todo list.

#### Scenario: Long objective

- **WHEN** a goal is active
- **THEN** the agent reports done, blocked (with evidence), or waiting on an
  external event rather than drifting between steps

### Requirement: Side Thread Isolation

Side-thread channels SHALL NOT mutate the main session unless the operator
explicitly imports context.

#### Scenario: Side question

- **WHEN** the operator asks a side question via the side-thread channel
- **THEN** the main session transcript SHALL remain unchanged
- **AND** an answer is brought back only when the operator imports it

### Requirement: Context Hygiene

The operator SHALL be able to see what is burning the context window; when the
window is close to full, the session SHALL compact or move work onto a fresh
lane.

#### Scenario: Research off the writer

- **WHEN** research needs the web
- **THEN** research runs in an isolated child that cannot write project files
- **AND** only chosen URLs are fetched deep

### Requirement: Security Posture

The harness SHALL treat Pi as maximum privilege: packages run with the user's
rights, third-party packages are reviewed before install, and untrusted or
unattended work runs in a container or VM rather than relying on the project
trust prompt as a sandbox.

#### Scenario: Untrusted repository

- **WHEN** work targets an untrusted or unattended repository
- **THEN** the work SHALL run inside a container or VM
- **AND** the host `~/.pi/agent` SHALL NOT be mounted into that container
  unless it should inherit credentials and sessions

### Requirement: Anti-Patterns

The harness SHALL avoid: checkbox todos for coding work, dozens of visible
skills, parallelizing one-file changes, reviewers inheriting the worker
transcript, novel-length AGENTS.md files, and dumping unbounded grep output
into context.

#### Scenario: Review independence

- **WHEN** the agent is about to parallelize or review
- **THEN** one-file work SHALL stay on a single agent
- **AND** reviewers SHALL run with fresh context rather than inheriting the
  worker transcript

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

### Requirement: Skill Parameters

The harness SHALL let skills accept shell-style parameters and inline command
expansion at invocation.

#### Scenario: Parameters and command output

- **WHEN** a skill is invoked with arguments
- **THEN** positional placeholders (`$1`, `$2`, `$ARGUMENTS`) SHALL expand in
  the skill body
- **AND** inline `` !`cmd` `` blocks SHALL execute and paste their output into
  the prompt before the model reads it
