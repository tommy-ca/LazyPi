# Installer Specification (lazypi)

## MODIFIED Requirements

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
- **AND** `--except` SHALL subtract from the full catalog (16 ids for
  `--except todos`)

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
- **AND** `--except` SHALL subtract from the full catalog (16 ids for
  `--except todos`)

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
  invoked as ComSpec argv (`/d /s /c` plus the program plus the args)
- **AND** sources SHALL remain extra argv elements
- **AND** the CLI SHALL NOT join sources into a shell string
- **AND** the CLI SHALL NOT default spawnSync `shell: true`

#### Scenario: Unknown argument

- **WHEN** the CLI receives an unknown command or argument
- **THEN** it SHALL print help and exit 2

#### Scenario: Version flag

- **WHEN** `-V` or `--version` is passed
- **THEN** the CLI SHALL print the package version (from `package.json`) and
  exit 0

## REMOVED Requirements

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

**Reason:** LazyPi installs `fff`. It does not register search tools. Those
runtime rules live in the package. Catalog Model Search substrate source
and harness Search substrate stay.

**Migration:** None. Operators keep `fff` from the core catalog. Search
behavior is unchanged.
