# Control Plane Specification (harness)

## Purpose

The harness SHALL distinguish discipline, package registration, native loading,
authorization, recovery, and operator promotion. The unpublished candidate
SHALL NOT be treated as certified native PStack integration.

## Requirements

### Requirement: Layer Separation

The harness SHALL distinguish resident AGENTS.md discipline, on-demand skills,
and package registrations. Registrations SHALL NOT imply effective loading.

#### Scenario: Progressive disclosure

- **WHEN** skills or agents are registered
- **THEN** registration SHALL NOT certify their discovery, visibility controls,
  role binding, effort/readonly semantics, or native tool restrictions
- **AND** existing six builtin blank-model resets SHALL remain unchanged

### Requirement: Ask Gate

The agent SHALL seek structured clarification rather than guess when target
files, create-vs-edit, acceptance criteria, or mutually exclusive options are
undefined. Ask User SHALL NOT be represented as hard approval.

#### Scenario: Ambiguous request

- **WHEN** a request is underspecified
- **THEN** the agent SHALL ask a focused question before producing a large diff
- **AND** registration SHALL NOT certify enforced human authorization or
  fail-closed unattended behavior

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

The unpublished candidate SHALL register canonical PStack as a preservation
reference, not a copied bundle or certified orchestration installation.
Required support SHALL remain stricter than upstream's capability minimum.

#### Scenario: Minimal candidate

- **WHEN** the candidate default selection is computed
- **THEN** it SHALL contain pstack, subagents, sandbox, verdict, and pi-ask-user
- **AND** web-access SHALL be the sole optional research package
- **AND** no compatibility tier, alias to independent npm PStack, helper adapter,
  copied resources, or automatic conflict exclusion SHALL be introduced
- **AND** the canonical recommendation SHALL be described as static-only,
  without switch enforcement

#### Scenario: Deliberate capability retirement

- **WHEN** previous catalog packages leave curation
- **THEN** discovery/hiding, mention expansion, objective stopping, side chat,
  context telemetry, simplification/discipline review, indexed search, LSP,
  interactive overlays, experiment/debt hooks, and persistent todos/memory
  SHALL no longer be promised as installed capabilities
- **AND** overlap SHALL NOT be treated as proven equivalent replacement
- **AND** the Dynamic Workflows source conflict SHALL NOT be treated as a
  reproduced loaded collision
- **AND** installed state SHALL remain unmanaged Other, not uninstalled,
  disabled, excluded from broad updates, or resolved by retired IDs/legacy maps
- **AND** raw removal passthrough SHALL remain unchanged

#### Scenario: Native promotion remains gated

- **WHEN** default activation or readiness is proposed
- **THEN** actual loading, canonical role binding, model/tool semantics, tool
  dispatch, independent child authorization, headless denial, exit/recovery,
  and real-session/operator acceptance SHALL be demonstrated separately
- **AND** static source review, fake tools, and registration SHALL NOT satisfy
  these gates
- **AND** the candidate SHALL remain unpublished until separate delivery approval

### Requirement: Context Hygiene

The agent SHALL avoid unbounded transcript dumps. Curation SHALL NOT promise
context-budget telemetry or indexed paged search after their retirement.

#### Scenario: Research off the writer

- **WHEN** research needs the web
- **THEN** research SHALL use an appropriately restricted read-only child
- **AND** Web Access registration SHALL NOT certify that restriction
- **AND** only chosen URLs SHALL be fetched deep

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

#### Scenario: Registration is not containment

- **WHEN** Sandbox, Verdict, and Ask User are registered
- **THEN** Sandbox SHALL remain disabled until explicitly configured
- **AND** the installer SHALL NOT modify actual sandbox settings or container controls
- **AND** Ask User SHALL NOT be represented as hard approval
- **AND** Verdict summaries SHALL distinguish classifier failures from configured
  exemptions and manual shell escapes
- **AND** a private HOME or offline fixture SHALL NOT be called OS containment

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
