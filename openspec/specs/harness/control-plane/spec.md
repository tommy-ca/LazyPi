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
- **THEN** it SHALL contain pstack, subagents, sandbox, verdict, pi-ask-user,
  and web-access in that order, all core and selected by default
- **AND** no optional catalog entries SHALL remain
- **AND** core/optional selector syntax SHALL remain compatible, with optional empty
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

### Requirement: Bounded native discovery probe

The native proof SHALL be a separately authorized diagnostic, not catalog activation or a readiness waiver.

#### Scenario: Exact hosted route

- **WHEN** test.yml is manually dispatched in tommy-ca/LazyPi on refs/heads/feat/strict-native-pstack-proof
- **THEN** only the native job SHALL run on ubuntu-24.04 with contents read permission and checkout credential persistence disabled
- **AND** every other existing event, repository, and ref combination SHALL retain the ordinary test job and its unchanged steps
- **AND** the driver SHALL require attempt 1, Node 22.19.0, matching workflow and checkout identities, and parent verification of the reviewed run head

#### Scenario: Private pinned installation

- **WHEN** the authorized hosted driver installs native packages
- **THEN** all installation and native execution subprocesses SHALL receive an explicit allowlisted environment and private HOME, agent, npm prefix, cache, distinct configs, work, and temporary paths
- **AND** no ambient job, model, npm, SSH, or operator credentials SHALL enter those subprocesses
- **AND** Pi 1.5.0, Subagents 0.86.0, Sandbox 0.14.1, Verdict 0.16.0, Ask User 0.17.2, and canonical f1571b8431034dcd195f4ea055ccf1c84fc14fc8 SHALL be required without Web Access
- **AND** engine or version incompatibility SHALL stop execution without upgrade or retry
- **AND** actual versions, dependency graphs, package identities, and retained installation evidence SHALL be reported
- **AND** before discovery every resolved global graph node SHALL bind to exactly one actual private cache archive receipt, independently verified SRI, matching archived name/version, and retained archive bytes
- **AND** missing, corrupt, ambiguous, wrong-identity, or unsupported alias/bundled/resolution evidence SHALL stop rather than skip nodes or fetch replacement evidence

#### Scenario: Discovery before one child

- **WHEN** the same-session public loader, explicit extension binding, tool schemas, and public Subagents list/get and preflight APIs are inspected
- **THEN** missing, duplicate, unparseable, or unsupported canonical role origins, file hashes, schemas, effective model policy, or provider routing SHALL stop before any child
- **AND** the probe SHALL NOT copy roles, synthesize canonical manifests, inject canonical skill paths, remap production models, change permission hooks, or approve UI prompts
- **AND** only an unchanged origin-verified how-explorer role inheriting the private dummy provider MAY receive one foreground delegation

#### Scenario: Correlated child evidence

- **WHEN** the conditional foreground child completes
- **THEN** success SHALL require the request, owner, node, run, and parent-child session identities, an actual successful read-tool result containing the private canary, agent_settled, normal package terminal status, and actual controller exit
- **AND** final text, progress hints, wrong canaries, mismatched identities, extra tools, additional children, unsupported routing, or missing artifacts SHALL NOT satisfy proof
- **AND** foreground metadata SHALL use the pinned index-0 artifact naming, rejecting wrong indices and duplicate metadata

#### Scenario: Deadlines and retained negatives

- **WHEN** installation, discovery, child execution, or shutdown exceeds its deadline
- **THEN** the probe SHALL fail, terminate only its owned processes, preserve bounded raw diagnostic evidence, and never retry, restart, select a second role, or fall back
- **AND** the workflow SHALL have a 20-minute bound, installation 10 minutes, discovery and child 60 seconds each, and shutdown 15 seconds
- **AND** structured chunked stdout SHALL retain hashes and byte counts rather than silently truncate evidence
- **AND** command-leader exit SHALL NOT cancel owned-group escalation or discard ownership while descendants can continue
- **AND** delayed group signals SHALL retain a live owned group keeper to avoid targeting reused process identities
- **AND** private settings SHALL disable agent retries and provider HTTP retries through the pinned supported schema, and unexpected retry events SHALL trigger immediate failure/cancellation before continuation

#### Scenario: Explicit internal entry points

- **WHEN** observer or provider receives unsupported standalone arguments
- **THEN** it SHALL exit 2 with empty stdout and stderr "Use --help for this internal probe entry point." followed by a newline
- **AND** importing either module SHALL NOT process caller arguments or print help

#### Scenario: Diagnostic limits

- **WHEN** offline fixtures or a hosted probe pass
- **THEN** offline fixtures SHALL remain explicitly non-native evidence
- **AND** hosted proof SHALL be limited to observed discovery, one foreground child read, settlement, and normal exit
- **AND** independent child enforcement, headless denial, sandbox policy, arbitrary egress confinement, crash recovery, Windows, model diversity, archive delivery, production models, and promotion SHALL remain separate unverified gates
