# Installer Specification (lazypi)

## Purpose

The `lazypi` CLI SHALL install, report, update, check, and remove a curated
catalog of Pi packages with idempotent, reproducible behavior and a
self-deriving CI contract.

## Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 17 entries: 12 core and 5 optional
- **AND** the categories SHALL be `core` and `optional`
- **AND** core SHALL contain subagents, pi-ask-user, pi-skillful,
  mention-skill, goal, btw, context-usage, simplify, web-access, fff,
  dynamic-workflows, and ponytail
- **AND** optional SHALL contain lsp, interactive-shell, autoresearch,
  todos, and memory

#### Scenario: Optional catalog tier

- **WHEN** install selection is computed without `--only` or `--except`
- **THEN** the selection SHALL be the 12 core entries only
- **AND** optional entries SHALL be selected only via `--only optional` (or
  matching package ids), `--except`, the interactive picker, or the
  interactive everything flow
- **AND** status and remove SHALL cover optional entries like core ones

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

#### Scenario: Side chat best alternative

- **WHEN** the catalog defines `btw`
- **THEN** its `source` SHALL be `npm:@narumitw/pi-btw`
- **AND** the replaced `npm:pi-btw` SHALL remain in `legacySources`

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

#### Scenario: Optional sources

- **WHEN** the catalog defines `lsp`
- **THEN** its `source` SHALL be `npm:@narumitw/pi-lsp`
- **AND** `interactive-shell` SHALL resolve to `npm:pi-interactive-shell`
- **AND** `autoresearch` SHALL resolve to `npm:pi-autoresearch`
- **AND** the git source `git:github.com/davebcn87/pi-autoresearch` SHALL
  remain in `legacySources`
- **AND** `todos` SHALL resolve to `npm:pi-manage-todo-list`
- **AND** the git source `git:github.com/tintinweb/pi-manage-todo-list`
  SHALL remain in `legacySources`
- **AND** `memory` SHALL resolve to `npm:pi-memory-md`
- **AND** the git source `git:github.com/VandeeFeng/pi-memory-md` SHALL
  remain in `legacySources`

#### Scenario: Essential control plane sources

- **WHEN** the catalog defines skill visibility and skill mention
- **THEN** `pi-skillful` SHALL resolve to `npm:pi-skillful`
- **AND** `mention-skill` SHALL resolve to `npm:@zigai/pi-mention-skill`
- **AND** the catalog SHALL ship exactly one mention implementation

#### Scenario: Skill arguments source

- **WHEN** `skill-args` is considered for catalog promotion
- **THEN** the canonical source SHALL be `npm:@juicesharp/rpiv-args`

#### Scenario: Search substrate source

- **WHEN** the catalog defines `fff`
- **THEN** its `source` SHALL be `npm:@ff-labs/pi-fff`
- **AND** its default mode SHALL be additive (`tools-and-ui`)

#### Scenario: Workflow engine source

- **WHEN** the catalog defines `dynamic-workflows`
- **THEN** its `source` SHALL be `npm:@quintinshaw/pi-dynamic-workflows`

#### Scenario: Discipline review source

- **WHEN** the catalog defines `ponytail`
- **THEN** its `source` SHALL be `npm:@dietrichgebert/ponytail`

### Requirement: Idempotent Install

`install` SHALL read the Pi settings file, skip every source already present,
and apply legacy-source migration when a catalog entry's legacy source is
installed. Invalid settings JSON SHALL fail the run before any `pi` spawn.

#### Scenario: Legacy migration

- **WHEN** an installed source matches an entry's `legacySources`
- **THEN** the installer SHALL run `pi remove <legacy>` before
  `pi install <source>`
- **AND** a failed migration SHALL fail the entry without installing

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

#### Scenario: Scoped install

- **WHEN** `--only core` or `--except <id>` is passed
- **THEN** only matching categories or package ids are selected

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
- **AND** it SHALL warn non-fatally about unpinned git heads among installed
  sources outside the catalog
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
- **THEN** the install SHALL have been `lazypi --yes` followed by
  `lazypi --yes --only optional` (core then optional)
- **AND** it SHALL find every non-excluded `PACKAGES` source in settings.json
- **AND** the `status` header SHALL report the expected count over
  `PACKAGES.length`

#### Scenario: E2E regression

- **WHEN** CI runs the packed-CLI e2e harness
- **THEN** `scripts/e2e-install.mjs` SHALL drive the packed artifact against a
  real `pi` in a sandboxed agent dir
- **AND** it SHALL assert fresh install, idempotency, legacy migration,
  removal, status, and doctor

#### Scenario: Derived e2e counts

- **WHEN** the e2e harness asserts install counts
- **THEN** the expected counts SHALL derive from `PACKAGES.length`
- **AND** count assertions SHALL NOT be hardcoded literals

#### Scenario: Catalog shape pin

- **WHEN** `npm test` runs
- **THEN** a test SHALL fail if `PACKAGES` ids, categories, or current
  sources diverge from the Lean catalog shape and Optional sources
  scenarios
- **AND** a test SHALL fail if a Dropped packages id appears in `PACKAGES`
- **AND** a test SHALL fail if the Windows smoke workflow asserts the full
  catalog without installing the optional tier
- **AND** CI SHALL run `npm run spec:validate` alongside `npm test`

### Requirement: Search Tools

The catalog SHALL provide an FFF-based search substrate that registers
fuzzy file and content search tools alongside Pi's built-in find/grep.

#### Scenario: Additive search

- **WHEN** the search package is installed with its default mode
- **THEN** `fffind`, `ffgrep`, and `fff-multi-grep` SHALL be registered as
  additional tools
- **AND** the built-in `find` and `grep` tool names SHALL remain available
- **AND** replacing the built-in names SHALL require an explicit override
  mode

#### Scenario: Paged content search

- **WHEN** a content search returns more matches than a page
- **THEN** the result SHALL include a cursor for fetching the next page

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

#### Scenario: CI trusted publishing

- **WHEN** the release-please workflow is considered for release
  production
- **THEN** it SHALL NOT be treated as the current publish path until an
  `NPM_TOKEN` secret exists in the repository
- **AND** releases SHALL be manual until that secret is provisioned

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

`README.md` SHALL list each `PACKAGES` id in `PACKAGES` order with its
category and a rationale.

`README.md` SHALL state that `--yes` installs 12 packages.

`README.md` SHALL state that the TTY Install everything path installs 17
packages.

The TTY everything option label SHALL be Install everything.

Catalog documentation SHALL NOT call that option recommended.

`docs/docs/installation.html` SHALL NOT contain `(recommended)`.

`docs/index.html` SHALL NOT contain `(recommended)`.

`docs/docs/philosophy.html` SHALL explain why the default install is the
12 core packages.

`docs/docs/philosophy.html` SHALL explain why five packages are optional.

`docs/docs/philosophy.html` SHALL name the membership bar as control
plane or discipline, not meal-prep or chrome.

`docs/docs/philosophy.html` SHALL name Dropped packages as outside the
catalog.

`docs/docs/philosophy.html` SHALL state that `pi install` still works for
Dropped packages.

`docs/docs/philosophy.html` SHALL state that LazyPi does not manage
Dropped packages.

`docs/docs/index.html` SHALL point at the philosophy page.

`docs/docs/index.html` SHALL NOT feature Dropped ids as optional extras.

#### Scenario: README catalog table

- **WHEN** `README.md` is read
- **THEN** it SHALL list each `PACKAGES` id in `PACKAGES` order
- **AND** each listed id SHALL have category `core` or `optional`
- **AND** each listed id SHALL have a rationale

#### Scenario: Default versus everything counts

- **WHEN** `README.md` describes install counts
- **THEN** it SHALL state that `--yes` installs 12 packages
- **AND** it SHALL state that TTY Install everything installs 17 packages

#### Scenario: Philosophy page

- **WHEN** `docs/docs/philosophy.html` is read
- **THEN** it SHALL explain why 12 is the default install
- **AND** it SHALL explain why 5 packages are optional
- **AND** it SHALL name the membership bar as control plane or
  discipline, not meal-prep or chrome
- **AND** it SHALL name Dropped packages as outside the catalog
- **AND** it SHALL state that `pi install` still works for those packages
- **AND** it SHALL state that LazyPi does not manage them

#### Scenario: Overview does not merchandise dropped extras

- **WHEN** `docs/docs/index.html` is read
- **THEN** it SHALL point at `philosophy.html`
- **AND** it SHALL NOT feature Dropped ids as optional extras

#### Scenario: TTY option label is not recommended

- **WHEN** `docs/docs/installation.html` or `docs/index.html` is read
- **THEN** the TTY option label SHALL be Install everything
- **AND** neither page SHALL contain `(recommended)`

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
