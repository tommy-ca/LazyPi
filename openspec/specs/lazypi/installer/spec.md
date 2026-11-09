# Installer Specification (lazypi)

## Purpose

The `lazypi` CLI SHALL install, report, update, check, and remove a curated
catalog of Pi packages with idempotent, reproducible behavior and a
self-deriving CI contract.

## Requirements

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

### Requirement: Idempotent Install

`install` SHALL read the Pi settings file, skip every source already present,
and apply legacy-source migration when a catalog entry's legacy source is
installed. Invalid settings JSON SHALL fail the run before any `pi` spawn.

#### Scenario: Legacy migration

- **WHEN** an installed source matches an entry's `legacySources`
- **THEN** the installer SHALL run `pi install <source>` before
  `pi remove <legacy>` when the replacement is missing
- **AND** failed replacement installation SHALL fail the entry without removing legacy sources or rewriting their settings
- **AND** successful installation SHALL be followed by removal using the exact installed legacy source, including its pin
- **AND** failed legacy cleanup SHALL fail the entry while retaining the installed replacement
- **AND** local install and removal SHALL retain `-l --approve`; global operations SHALL omit these flags

#### Scenario: Legacy convergence

- **WHEN** a catalog entry's legacy source is installed alongside its
  replacement source
- **THEN** `install` SHALL remove the legacy source without reinstalling the
  replacement
- **AND** a failed removal SHALL fail the run for that entry
- **AND** the summary SHALL count it as a migration

#### Scenario: Versioned npm equivalence

- **WHEN** an installed source is `npm:pkg@<version>` (or a pinned `git:`
  source) and a catalog or legacy source is the unpinned `npm:pkg` (or
  unpinned `git:` source)
- **THEN** `status` SHALL count the entry as installed
- **AND** `install` SHALL skip it as already present
- **AND** the versioned source SHALL NOT appear under "Other Pi packages"

#### Scenario: Re-run

- **WHEN** `install` runs with every selected source already installed
- **THEN** it SHALL report nothing to do and exit 0
- **AND** it SHALL NOT write `settings.json` or a `.bak` when builtin
  empty-model overrides are already present for the six pi-subagents
  agents

#### Scenario: Corrupt settings

- **WHEN** `settings.json` exists and is not valid JSON
- **THEN** `install`, `status`, `update`, `remove`, and `doctor` SHALL
  print an error and exit 2
- **AND** they SHALL NOT spawn `pi`

### Requirement: Commands

The CLI SHALL provide `install` (default), `status`, `update`, `doctor`, and
`remove`, and SHALL accept `--only <list>`, `--except <list>`, `-l/--local`,
`-y/--yes`, and `-h/--help`.

#### Scenario: Status derivation

- **WHEN** `status` runs
- **THEN** it SHALL group catalog entries as installed, legacy, missing, and
  other (outside the catalog), with counts derived from `PACKAGES`
- **AND** it SHALL display the installed source for an installed entry;
  when that source carries a version pin that differs from the catalog
  source, the pin SHALL be visible in the output
- **AND** after the `n/PACKAGES.length` header, it SHALL report core and
  optional installed counts from PACKAGES categories

#### Scenario: Scoped install

- **WHEN** `--only core` or `--except <id>` is passed
- **THEN** only matching categories or package ids are selected
- **AND** `--except` SHALL subtract from the full catalog (5 ids for
  `--except web-access`)

#### Scenario: Empty selector

- **WHEN** `--only` or `--except` is passed with no list, an empty list,
  or both flags together
- **THEN** the CLI SHALL print help and exit 2

#### Scenario: Missing pi

- **WHEN** `install` or `update` runs without a `pi` executable on PATH
- **THEN** the CLI SHALL NOT block on an interactive prompt when stdin or
  stdout is not a TTY
- **AND** on a non-TTY without `--yes` it SHALL print an error and exit 127
- **AND** on a TTY it SHALL offer to install Pi and exit 127 when declined

#### Scenario: Doctor environment

- **WHEN** `doctor` runs
- **THEN** it SHALL fail when the Node version is below 20
- **AND** it SHALL fail when npm is missing
- **AND** it SHALL fail when pi is missing
- **AND** `warn()` SHALL be non-fatal by default
- **AND** missing git, missing settings, and unread `pi --version` SHALL
  NOT fail the run
- **AND** it SHALL warn non-fatally about unpinned git heads among installed
  sources outside the catalog
- **AND** an unpinned git head that matches a catalog `source` or
  `legacySources` SHALL NOT produce that warning
- **AND** `package.json` SHALL declare `engines.node >= 20` to match

#### Scenario: Local install trust

- **WHEN** `install --local` or `remove --local` targets a project Pi
  settings file
- **THEN** every `pi install` / `pi remove` spawn SHALL include `--approve`
  so un-approved projects accept the change
- **AND** global (non-local) spawns SHALL NOT include `--approve`

#### Scenario: Spawn argv

- **WHEN** the CLI spawns `pi` or `npm`
- **THEN** the source and package arguments SHALL be passed as argv
  elements, not interpolated into a shell command line
- **AND** on win32, a resolved path matching `.cmd` or `.bat` SHALL be
  invoked as ComSpec argv (`/d /s /c call` plus a quoted program plus the
  args)
- **AND** `call` SHALL precede the quoted program so cmd `/s` does not
  strip quotes on paths with spaces
- **AND** sources SHALL remain extra argv elements
- **AND** a source containing cmd metacharacters SHALL stay one quoted
  argv slot
- **AND** the CLI SHALL NOT join sources into a shell string
- **AND** the CLI SHALL NOT default spawnSync `shell: true`
- **AND** the ComSpec plan SHALL set `windowsVerbatimArguments: true`
- **AND** on win32, `where` output SHALL prefer a `.cmd`, `.bat`, `.exe`,
  or `.com` hit over an extensionless shim
- **AND** the ComSpec executable SHALL be `cmd.exe`, not PowerShell

#### Scenario: Unknown argument

- **WHEN** the CLI receives an unknown command or argument
- **THEN** it SHALL print help and exit 2

#### Scenario: Version flag

- **WHEN** `-V` or `--version` is passed
- **THEN** the CLI SHALL print the package version (from `package.json`) and
  exit 0

### Requirement: Subagent Overrides

When `subagents` is selected, `install` SHALL write empty-model overrides for
the builtin pi-subagents agents (context-builder, planner, researcher,
reviewer, scout, worker) into Pi settings so they fall back to the session
model. Existing extra keys on those override objects SHALL be kept.

#### Scenario: Model fallback

- **WHEN** a catalog entry with id `subagents` is selected for install
- **THEN** settings.json SHALL contain empty-model overrides for each builtin
  agent
- **AND** the overrides SHALL NOT be written when `subagents` is not selected

#### Scenario: Override merge

- **WHEN** a builtin override already has `model` set to an empty string
- **THEN** a re-run SHALL leave that object in place, including extra keys
- **AND** settings.json SHALL NOT be rewritten solely to restamp those
  empty models

### Requirement: Auth Visibility

`install` and `doctor` SHALL report detected credentials (provider env vars
and `auth.json`) so the operator knows whether to run `/login`.

#### Scenario: Credential report

- **WHEN** `install` summarizes the plan or `doctor` inspects the environment
- **THEN** the report SHALL list providers detected from env vars and
  `auth.json`
- **AND** it SHALL say when no credentials are detected

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

### Requirement: Release Flow

Releases SHALL follow the repository's version-bump convention and SHALL
be gated on the spec and test suites before publishing.

#### Scenario: Version bump convention

- **WHEN** a release is prepared
- **THEN** the version SHALL be bumped with
  `npm version <semver> --no-git-tag-version`, committed as `<semver>`,
  tagged `v<semver>`, and both commit and tag SHALL be pushed
- **AND** `npm run spec:validate` and `npm test` SHALL pass before the
  bump

#### Scenario: Manual publish

- **WHEN** the release is published to npm
- **THEN** it SHALL run interactively, because the npm account uses 2FA:
  device auth (browser flow) or an OTP prompt requires a TTY
- **AND** a `publishConfig.access: public` scoped package SHALL publish
  with `npm publish --access public`

#### Scenario: Token expiry recovery

- **WHEN** a publish fails with 404 on the scoped package or `npm whoami`
  returns 401
- **THEN** the stale credential SHALL be cleared (remove/deactivate the
  token) before retrying — npm masks invalid tokens on scoped publish as
  404
- **AND** `npm login` (device auth) SHALL mint a fresh token, after which
  publish SHALL succeed with an OTP or the device-auth flow

#### Scenario: Manual-only publishing policy

- **WHEN** repository CI workflows are inspected
- **THEN** no automated npm publishing workflow SHALL be present
- **AND** the dormant release-please publisher SHALL be removed
- **AND** README SHALL describe interactive gated publishing as the current release path

#### Scenario: Post-publish validation

- **WHEN** a release has been published
- **THEN** `npx -y @tommy-ca/lazypi@<version> --version` and
  `bunx @tommy-ca/lazypi@<version> --version` SHALL both report the
  released version
- **AND** both SHALL run from a directory outside the LazyPi checkout —
  npm exec resolves a checkout whose package.json is
  `@tommy-ca/lazypi@<version>` as the package itself and fails with
  `lazypi: not found`
- **AND** `status` SHALL report the full catalog installed and
  `install --yes` SHALL be an idempotent no-op on the operator install
  through both runners

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

### Requirement: Troubleshooting

The docs SHALL explain how to repair a catalog package whose runtime
dependency installation is missing or broken, so the operator can recover
without reinstalling Pi or LazyPi.

#### Scenario: Broken dependency footprint

- **WHEN** a catalog package fails at runtime with a missing dependency —
  for example pi-subagents and `Cannot find module 'acorn'`
- **THEN** the FAQ SHALL explain that the installed footprint is
  incomplete even though the package is present in settings
- **AND** the updating docs SHALL tell the operator to run `pi update` (or
  `npx @tommy-ca/lazypi update`) or reinstall the package
- **AND** the docs SHALL mention removing a stale
  `~/.pi/agent/extensions/<name>` checkout that shadows the package in
  the npm store
- **AND** the docs SHALL state that `pi update` respects existing version
  pins and does not advance pinned packages
- **AND** when a failure persists after a footprint repair, the docs SHALL
  tell the operator to reinstall the package at the catalog's current
  version (`pi install npm:<pkg>@<version>`)

### Requirement: CLI safety boundaries

The CLI SHALL reject inapplicable installation selectors, avoid setup for an empty unattended selection, and inspect version execution status.

#### Scenario: Selectors outside install

- **WHEN** `update`, `remove`, `status`, or `doctor` receives `--only` or `--except`
- **THEN** the CLI SHALL print help and exit 2
- **AND** it SHALL report `--only and --except are only supported by install`
- **AND** it SHALL NOT execute Pi or change settings

#### Scenario: Conflicting selectors retain command-scope precedence

- **WHEN** a non-install command receives both valid selectors
- **THEN** it SHALL retain the install-only selector diagnostic and exit 2 without side effects
- **AND** install with both selectors SHALL retain its existing mutual-exclusion diagnostic

#### Scenario: Empty unattended selection

- **WHEN** install resolves an empty unattended selection and settings are valid or absent
- **THEN** it SHALL report nothing selected and exit 0 before Pi setup
- **AND** it SHALL NOT run npm or Pi or create settings
- **AND** invalid settings SHALL still fail closed

#### Scenario: Failed version execution

- **WHEN** `pi --version` exits unsuccessfully or provides no output
- **THEN** doctor SHALL issue a nonfatal warning rather than a passing version check
- **AND** successful version execution with output SHALL retain its passing check

### Requirement: Installer documentation accuracy

User documentation SHALL distinguish package installation, intentional settings changes, backups, and runner caches.

#### Scenario: Subagent configuration changes

- **WHEN** users read the overview, FAQ, installation guide, or subagents page
- **THEN** the docs SHALL explain that selecting subagents can reset builtin model overrides even on re-runs
- **AND** the installation guide and subagents page SHALL list `context-builder`, `planner`, `researcher`, `reviewer`, `scout`, and `worker`
- **AND** the docs SHALL explain the session-model fallback and preservation of other override keys
- **AND** they SHALL describe timestamped backups before changing existing settings

#### Scenario: Persistent artifacts and removal selection

- **WHEN** users read the installation or removal guide
- **THEN** the docs SHALL distinguish installed packages, settings overrides, backup files, and runner caches
- **AND** they SHALL NOT promise fresh downloads or automatic removal of caches and backups
- **AND** removal instructions SHALL say that space selects packages to remove and an empty selection removes nothing

### Requirement: Executable CI contracts

Workflow checks SHALL verify required commands as executable run steps rather than raw substrings. CLI fixtures SHALL isolate settings and support the platform running the suite.

#### Scenario: Required workflow execution

- **WHEN** CI contract tests inspect Linux or Windows workflows
- **THEN** they SHALL check required command order using uncommented run steps
- **AND** conditional or multiline workflow forms outside the checker's supported shape SHALL fail closed
- **AND** regression mutations with a commented, false-conditioned, or reversed required command SHALL fail the check

#### Scenario: Portable update fixture

- **WHEN** the update delegation regression runs on Windows
- **THEN** its mock Pi SHALL use a `.cmd` launcher and retain the system PATH
- **AND** all platforms SHALL isolate `HOME`, `USERPROFILE`, and `PI_CODING_AGENT_DIR`
- **AND** temporary fixtures SHALL be cleaned up after the test

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

### Requirement: Permission gate catalog entry

The required support set SHALL include a permission-gate registration.

#### Scenario: Verdict package

- **WHEN** the candidate catalog is loaded
- **THEN** it SHALL contain id `verdict`, category `core`, source `npm:pi-verdict`
- **AND** required registration SHALL NOT certify native/headless authorization
- **AND** the packages index SHALL list all 6 candidate entries

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

### Requirement: Catalog retirement

Retirement SHALL remove selection and legacy-resolution metadata from curation,
not mutate installed state, narrow broad updates, or change removal passthrough.

#### Scenario: Retired curation and selector rejection

- **WHEN** pi-skillful, mention-skill, goal, btw, context-usage, simplify, fff,
  dynamic-workflows, ponytail, lsp, interactive-shell, autoresearch, todos, or
  memory is passed to `--only` or `--except`
- **THEN** install SHALL reject it before bootstrap or package commands
- **AND** settings, backups, and command counters SHALL remain unchanged
- **AND** these entries SHALL NOT exist in another curated tier

#### Scenario: Unmanaged state and removal passthrough

- **WHEN** an installed source leaves curation
- **THEN** its registration SHALL remain Other, not uninstalled or disabled
- **AND** strings, objects, pins, metadata, order, scope, unrelated settings, and
  package data SHALL remain intact
- **AND** broad `pi update` SHALL remain broad, including unmanaged sources
- **AND** retirement SHALL NOT freeze updates or auto-exclude declared conflicts
- **AND** retired IDs SHALL no longer resolve catalog or legacy sources
- **AND** remove SHALL retain unknown-target passthrough unchanged
- **AND** operators SHALL use exact installed sources for retired removal

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
