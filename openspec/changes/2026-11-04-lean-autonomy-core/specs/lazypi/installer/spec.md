## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 18 entries: 6 core and 12 optional
- **AND** the categories SHALL be `core` and `optional`
- **AND** core SHALL contain subagents, pi-ask-user, pi-skillful, goal,
  web-access, and dynamic-workflows
- **AND** optional SHALL contain mention-skill, btw, context-usage, simplify,
  fff, ponytail, lsp, interactive-shell, autoresearch, todos, memory, and verdict

#### Scenario: Optional catalog tier

- **WHEN** install selection is computed without `--only` or `--except`
- **THEN** the selection SHALL be the 6 core entries only
- **AND** optional entries SHALL be selected only via `--only optional` (or
  matching package ids), `--except`, the interactive picker, or the
  interactive everything flow
- **AND** status and remove SHALL cover optional entries like core ones
- **AND** `--except` SHALL subtract from the full catalog (17 ids for
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
- **AND** `todos` SHALL resolve to `npm:@juicesharp/rpiv-todo`
- **AND** `npm:pi-manage-todo-list` and
  `git:github.com/tintinweb/pi-manage-todo-list` SHALL remain in `legacySources`
- **AND** `memory` SHALL resolve to `npm:@henryqw/pi-memory`
- **AND** `npm:pi-memory-md` and `git:github.com/VandeeFeng/pi-memory-md`
  SHALL remain in `legacySources`

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

### Requirement: Catalog documentation

`README.md` SHALL list each `PACKAGES` id in `PACKAGES` order with its
category and a rationale.

`README.md` SHALL state that `--yes` installs 6 packages.

`README.md` SHALL state that the TTY Install everything path installs 18
packages.

The TTY everything option label SHALL be Install everything.

Catalog documentation SHALL NOT call that option recommended.

`docs/docs/installation.html` SHALL NOT contain `(recommended)`.

`docs/index.html` SHALL NOT contain `(recommended)`.

`docs/docs/philosophy.html` SHALL explain why the default install is the
6 core packages.

`docs/docs/philosophy.html` SHALL explain why twelve packages are optional.

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
- **THEN** it SHALL state that `--yes` installs 6 packages
- **AND** it SHALL state that TTY Install everything installs 18 packages

#### Scenario: Philosophy page

- **WHEN** `docs/docs/philosophy.html` is read
- **THEN** it SHALL explain why 6 is the default install
- **AND** it SHALL explain why 12 packages are optional
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

### Requirement: Reconciled catalog contract

The active installer specification and public catalog summaries SHALL agree with the current catalog and accurately describe Verdict's classifier boundary.

#### Scenario: Counts and source migrations

- **WHEN** the active installer specification describes the catalog
- **THEN** it SHALL specify 18 entries: 6 core and 12 optional
- **AND** `--except todos` SHALL select 17 entries
- **AND** `todos` SHALL use `npm:@juicesharp/rpiv-todo` and retain its former npm and git sources as legacy sources
- **AND** `memory` SHALL use `npm:@henryqw/pi-memory` and retain its former npm and git sources as legacy sources

#### Scenario: Verdict summaries

- **WHEN** the CLI help or documentation summarizes the optional tier
- **THEN** it SHALL include Verdict
- **AND** summaries of its fail-closed behavior SHALL distinguish classifier failures from configured exemptions and manual shell escapes

### Requirement: Permission gate catalog entry

The optional tier SHALL include a permission-gate package.

#### Scenario: Verdict package

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain an entry with id `verdict`, category `optional`, and source `npm:pi-verdict`
- **AND** the total catalog SHALL be 18 entries: 6 core and 12 optional
- **AND** the packages index page SHALL list all 18 entries
