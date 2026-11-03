## ADDED Requirements

### Requirement: Framework Singularity

The harness SHALL have exactly one resident SDLC methodology, the
compound-engineering plugin; a second full SDLC methodology SHALL NOT be
installed as a resident set.

#### Scenario: Duplicate capability

- **WHEN** a candidate skill duplicates a capability already covered by the
  resident methodology
- **THEN** the candidate SHALL NOT enter the automatic skill-discovery prompt
- **AND** it MAY be installed hidden and explicitly invokable only when it
  adds mechanics the resident skill lacks

#### Scenario: Only non-duplicative supplements

- **WHEN** a cross-framework skill is proposed for installation
- **THEN** it SHALL be kept only if the resident methodology has no
  equivalent capability
- **AND** it SHALL default to hidden state

### Requirement: Registry Separation

User-layer skills (managed by the skills manager into `~/.agents/`) and
harness-layer plugins (managed by the pi package mechanism into
`~/.pi/agent/`) SHALL be tracked by their own registries; a capability SHALL
NOT be migrated between registries when it carries agents, prompts, or
extensions the target manager cannot install.

#### Scenario: Plugin with agents

- **WHEN** a plugin ships skills together with agents, prompts, or
  extensions
- **THEN** it SHALL remain on the pi plugin manager
- **AND** the skills manager SHALL NOT be used to install or update it

#### Scenario: User-layer skill

- **WHEN** a user-layer skill is installed
- **THEN** it SHALL live in `~/.agents/skills/`
- **AND** its install SHALL be recorded in the skills manager's lock file

### Requirement: Official Tool-Skill Sources

Tool-specific skills SHALL come from the tool's official source and SHALL
NOT be replaced by third-party forks; task-level skills for a platform SHALL
be sourced on demand from its official catalog.

#### Scenario: GitHub CLI skill

- **WHEN** a gh CLI skill is installed
- **THEN** it SHALL be the official `cli/cli` `gh` skill
- **AND** a third-party gh skill SHALL NOT replace it while installed

#### Scenario: Dead registry entry

- **WHEN** a registry advertises a skill that does not exist in its source
  repository
- **THEN** the skill SHALL NOT be installed
- **AND** the entry SHALL be reported as stale rather than used

### Requirement: Installed-State Consistency

The skills directory and its registry lock SHALL agree at all times; a
failed install SHALL NOT leave residual skill directories or lock entries.

#### Scenario: Failed install residue

- **WHEN** an install copies skill files and then fails registration
- **THEN** the copied entries SHALL be removed
- **AND** the lock file SHALL NOT record the failed install

#### Scenario: Registry parity

- **WHEN** the registry is inspected
- **THEN** the set of on-disk user-layer skills SHALL equal the set of lock
  entries