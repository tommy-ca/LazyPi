## MODIFIED Requirements

### Requirement: Catalog Model

The unpublished candidate catalog SHALL be the exported `PACKAGES` array in
`bin/catalog.mjs`, re-exported by the executable `bin/lazypi.mjs`. Entries SHALL
carry `id`, `category`, `source`, `description`, and `hint`, MAY carry a
separate `installSource` for a fresh install argument, and SHALL NOT carry
`legacySources`. Identity matching SHALL continue to use `source`.

Selector parsing and resolution, source matching, and the installed predicate
SHALL live in `bin/catalog.mjs`. Host plumbing SHALL live in `bin/pi-host.mjs`,
which SHALL NOT import a prompt library and SHALL NOT print.

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

#### Scenario: Catalog resolution module

- **WHEN** the CLI resolves `--only` or `--except`, matches an installed
  source, or decides whether a catalog entry is installed
- **THEN** the decision SHALL come from `bin/catalog.mjs`
- **AND** the executable `bin/lazypi.mjs` SHALL remain the only entrypoint and
  SHALL re-export those names so every existing importer keeps working
- **AND** importing `bin/pi-host.mjs` SHALL NOT load `@clack/prompts`, print
  anything, or run the entrypoint
- **AND** an entry SHALL count as installed only when an installed source
  matches its `source`, with or without a version or pin suffix

### Requirement: Idempotent Install

`install` SHALL read the Pi settings file, skip every source already present,
and SHALL NOT carry a legacy-source migration path. Invalid settings JSON SHALL
fail the run before any `pi` spawn.

No catalog entry declares `legacySources`, so the legacy migration and
convergence scenarios below no longer describe installer behavior: a migration
no data can trigger is not a requirement, and the installer SHALL NOT report
migration work it cannot perform. Their scenario names are retained because a
MODIFIED block replaces the whole requirement and SHALL NOT drop a scenario
name.

#### Scenario: Legacy migration

- **WHEN** an installed source matches an entry's `legacySources`
- **THEN** no catalog entry declares `legacySources`, so the installer SHALL
  NOT carry a migration path
- **AND** it SHALL NOT print migration work it cannot perform
- **AND** local install and removal SHALL retain `-l --approve`; global
  operations SHALL omit these flags

#### Scenario: Legacy convergence

- **WHEN** a catalog entry's legacy source appears to be installed alongside
  its replacement source
- **THEN** no catalog entry declares `legacySources`, so `install` SHALL NOT
  detect, count, or report a migration for that entry
- **AND** the summary SHALL NOT carry a migration count

#### Scenario: Versioned npm equivalence

- **WHEN** an installed source is `npm:pkg@<version>` (or a pinned `git:`
  source) and a catalog source is the unpinned `npm:pkg` (or unpinned `git:`
  source)
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
- **THEN** it SHALL group catalog entries as installed, missing, and
  other (outside the catalog), with counts derived from `PACKAGES`
- **AND** it SHALL NOT print a legacy-source group, because no catalog entry
  can declare a legacy source
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
- **AND** missing git SHALL NOT produce a migration warning, because no
  catalog entry can declare a legacy source
- **AND** it SHALL warn non-fatally about unpinned git heads among installed
  sources outside the catalog
- **AND** an unpinned git head that matches a catalog `source` SHALL NOT
  produce that warning
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
