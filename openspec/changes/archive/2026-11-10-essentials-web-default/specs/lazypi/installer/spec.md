## MODIFIED Requirements

### Requirement: Catalog Model

The unpublished candidate catalog SHALL be the exported `PACKAGES` array in
`bin/lazypi.mjs`. Entries SHALL carry `id`, `category`, `source`, `description`,
and `hint`, MAY carry `legacySources`, and MAY carry a separate `installSource`
for a fresh install argument. Identity matching SHALL continue to use `source`.

#### Scenario: Lean catalog shape

- **WHEN** the candidate catalog is loaded
- **THEN** it SHALL contain exactly 6 entries in this order: pstack, subagents,
  sandbox, verdict, pi-ask-user, web-access
- **AND** all six SHALL be `core` registrations, including web-access by default
- **AND** there SHALL be no optional catalog entries

#### Scenario: Optional catalog tier

- **WHEN** install selection is computed without `--only` or `--except`
- **THEN** the selection SHALL be all 6 core entries, including web-access
- **AND** the picker SHALL preselect all six in catalog order
- **AND** `core` and `optional` SHALL remain valid category selectors
- **AND** `--only optional` and `--except core` SHALL select nothing, report
  "Nothing selected — nothing to install.", and exit 0 before bootstrap
- **AND** empty selections SHALL leave settings, backups, and counters unchanged
- **AND** `--only core`, `--only core,optional`, and `--except optional` SHALL
  select all six
- **AND** `--only web-access` SHALL still select Web Access alone
- **AND** `--except` SHALL subtract from all 6 entries, selecting 5 for
  `--except web-access`
- **AND** status SHALL report core counts out of 6 and optional counts out of 0

#### Scenario: Catalog membership

- **WHEN** a package installed outside the catalog is considered for
  promotion
- **THEN** it SHALL be an active daily driver in the operator's install —
  installed and exercised in real sessions before any promotion decision
- **AND** it SHALL be currently maintained (recent releases on its primary
  distribution channel)
- **AND** it SHALL align with the lean harness philosophy (control plane or
  discipline layer, not meal-prep, chrome, or single-use conveniences)
- **AND** any native or install-script machinery SHALL have a demonstrated
  runtime path (prebuilt bindings or an approved build)
- **AND** it SHALL NOT be named in the Dropped packages scenario
- **AND** its promotion SHALL be ratified through a change spec carrying an
  audit trail before the catalog grows

#### Scenario: Dropped packages

- **WHEN** a package was deliberately removed
- **THEN** it SHALL NOT appear in the catalog
- **AND** the installer SHALL NOT install or manage compound,
  powerbar, extension-settings, plannotator, slopchop, usage, raw-paste,
  plan, add-dir, claude-cli, prompt-templates, hackerman, terminal-theme,
  skill-args, mcp, ralph-wiggum, or curated-themes
- **AND** the CLI help SHALL NOT advertise Dropped packages as
  installable extras; at most it SHALL note that `pi install` still works
  for them

### Requirement: Self-Deriving CI

The exact-source assertion used by CI SHALL derive from `PACKAGES` rather than
a separate manifest, so catalog edits propagate to CI automatically. Unit
tests SHALL pin catalog ids, categories, and sources against the Catalog
Model so a missed spec delta cannot stay green.

#### Scenario: Full-install assertion

- **WHEN** `scripts/assert-installed-packages.mjs --check-status` runs after
  a full catalog install
- **THEN** `lazypi --yes` SHALL install all 6 core registrations
- **AND** a subsequent `lazypi --yes --only optional` SHALL be a harmless empty
  selection for existing workflow compatibility
- **AND** it SHALL require exact equality to non-excluded fresh install sources
  (`installSource` when present, otherwise `source`), rejecting unexpected sources
- **AND** this clean-install assertion SHALL NOT be used as preserved-profile proof
- **AND** the `status` header SHALL report the expected count over
  `PACKAGES.length`

#### Scenario: E2E regression

- **WHEN** CI runs the packed-CLI e2e harness
- **THEN** `scripts/e2e-install.mjs` SHALL drive the packed artifact against a
  real `pi` in a sandboxed agent dir
- **AND** it SHALL assert exact fresh install, idempotency, six builtin model
  overrides, older canonical registration preservation, retained-ID and exact
  unmanaged-source removal, status, and doctor
- **AND** BTW migration stages SHALL NOT remain after catalog retirement
- **AND** offline stub checks SHALL NOT certify actual archives or native behavior

#### Scenario: Derived e2e counts

- **WHEN** the e2e harness asserts install counts
- **THEN** the expected counts SHALL derive from `PACKAGES.length`
- **AND** count assertions SHALL NOT be hardcoded literals

#### Scenario: Catalog shape pin

- **WHEN** `npm test` runs
- **THEN** a test SHALL fail if `PACKAGES` ids, categories, or current
  sources diverge from the Lean catalog shape scenario
- **AND** a test SHALL fail if a Dropped packages id appears in `PACKAGES`
- **AND** the existing Windows smoke workflow MAY retain its empty optional
  install step before asserting the full catalog
- **AND** CI SHALL run `npm run spec:validate` alongside `npm test`

### Requirement: Catalog documentation

Catalog documentation SHALL describe membership, selection counts, and
unmanaged packages accurately, without recommending the everything selection.

#### Scenario: README catalog table

- **WHEN** `README.md` is read
- **THEN** it SHALL list each `PACKAGES` id in `PACKAGES` order
- **AND** each listed id SHALL have category `core` or `optional` and a rationale

#### Scenario: Default versus everything counts

- **WHEN** README describes install counts
- **THEN** it SHALL describe all 6 registrations as default core
- **AND** it SHALL explain that Web Access is selected by default
- **AND** the empty optional selector SHALL remain documented

#### Scenario: Philosophy page

- **WHEN** `docs/docs/philosophy.html` is read
- **THEN** it SHALL explain the six default core registrations and empty optional category
- **AND** it SHALL retain the membership bar as control plane or discipline,
  not meal-prep or chrome, and require real-session/operator promotion evidence
- **AND** it SHALL describe Dropped and retired packages as outside curation,
  while preserving `pi install` for unmanaged sources

#### Scenario: Overview does not merchandise dropped extras

- **WHEN** the overview describes the catalog
- **THEN** it SHALL link to catalog philosophy
- **AND** it SHALL NOT feature Dropped or retired IDs as optional extras

#### Scenario: TTY option label is not recommended

- **WHEN** installation or landing documentation describes the TTY selection
- **THEN** the label SHALL remain Install everything
- **AND** neither page SHALL call that option recommended

### Requirement: Reconciled catalog contract

The active installer specification and public catalog summaries SHALL agree with the current catalog and accurately describe Verdict's classifier boundary.

#### Scenario: Counts and source migrations

- **WHEN** active specifications and summaries describe curation
- **THEN** they SHALL specify 6 core entries and no optional entries
- **AND** retired todos and memory IDs SHALL no longer resolve their former
  catalog or legacy source migrations
- **AND** the essentials-web-default delta SHALL be the current test
  association for this category change, without rewriting historical deltas
- **AND** they SHALL distinguish unpinned identity from fresh audited argument

#### Scenario: Verdict summaries

- **WHEN** the CLI help or documentation summarizes required support
- **THEN** it SHALL include Verdict
- **AND** summaries of its fail-closed behavior SHALL distinguish classifier
  failures from configured exemptions and manual shell escapes

### Requirement: Registration source identities

The candidate SHALL distinguish source identity from the audited fresh install
argument and preserve existing canonical registrations without changing general
matching or npm support package semantics.

#### Scenario: Canonical identity and fresh argument

- **WHEN** a fresh canonical PStack registration is installed
- **THEN** pstack identity SHALL be `git:github.com/tommy-ca/pstack`
- **AND** its fresh argument SHALL be `git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8`
- **AND** `npm:@zenspc/pi-pstack` SHALL NOT be an alias

#### Scenario: Required and optional support sources

- **WHEN** the candidate defines subagents, sandbox, verdict, pi-ask-user,
  and web-access in catalog order
- **THEN** support sources SHALL be `npm:pi-subagents`, `npm:pi-better-sandbox`,
  `npm:pi-verdict`, `npm:pi-ask-user`, and `npm:pi-web-access` respectively

#### Scenario: Existing canonical registration

- **WHEN** a canonical identity is already registered, including an older pin
- **THEN** install SHALL skip it without upgrade or duplication
- **AND** settings objects, metadata, exact sources, order, and scope SHALL remain
- **AND** npm support packages SHALL retain existing install/update semantics

### Requirement: Registration and retirement documentation

Active catalog documentation SHALL describe the unpublished registration
candidate, not a release, certified native integration, or readiness result.

#### Scenario: Catalog projections

- **WHEN** README, help, landing, FAQ, overview, philosophy, installation,
  first steps, package index, or sidebar describes curation
- **THEN** membership and order SHALL match `PACKAGES`
- **AND** README SHALL list each ID, category, and rationale in catalog order
- **AND** documentation SHALL describe all 6 registrations as default core
- **AND** the TTY label SHALL remain Install everything, not recommended
- **AND** Web Access SHALL be selected by default and optional SHALL remain empty
- **AND** retired pages MAY remain only as explicitly historical/unmanaged
- **AND** retired packages SHALL NOT remain in curated navigation or listings

#### Scenario: Honest limits and retirement

- **WHEN** catalog capabilities or security are described
- **THEN** docs SHALL separate registration from loading, role binding, tool
  execution, authorization, recovery, and readiness
- **AND** they SHALL state Sandbox is disabled until explicitly configured and
  Ask User is not hard approval
- **AND** they SHALL preserve the container/VM requirement for unattended or
  untrusted work and real-session/operator promotion requirements
- **AND** they SHALL explain deliberate losses of skill discovery/hiding,
  mention expansion, objective stopping, side chat, context telemetry,
  simplification/discipline review, indexed search, LSP, interactive overlays,
  experiment/debt hooks, and persistent todos/memory
- **AND** they SHALL NOT claim equivalent replacements from registration
- **AND** declared source conflict SHALL NOT be represented as a proven loaded
  collision or grounds for automatic uninstall/exclusion
- **AND** retirement SHALL be documented as preserving installed state, not
  disabling packages, freezing broad updates, or retaining retired ID/legacy
  removal resolution
- **AND** docs SHALL explain unchanged raw removal passthrough and exact sources
- **AND** `pi install` SHALL remain available for unmanaged sources
- **AND** the overview SHALL link to catalog philosophy
