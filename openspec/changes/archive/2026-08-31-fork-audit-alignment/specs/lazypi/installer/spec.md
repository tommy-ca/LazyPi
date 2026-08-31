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

- **WHEN** the catalog defines `skill-args`
- **THEN** its `source` SHALL be `npm:@juicesharp/rpiv-args`

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

## REMOVED Requirements

### Requirement: Skill Arguments

The catalog MAY provide a skill-parameter package so skill bodies accept
shell-style arguments and inline command expansion at invocation; when
cataloged, `skill-args` SHALL resolve to `npm:@juicesharp/rpiv-args`.

#### Scenario: Parameterized skill

- **WHEN** a skill is invoked with arguments
- **THEN** the skill body SHALL receive positional placeholders (`$1`, `$2`)
  and the raw input line
- **AND** inline `` !`cmd` `` blocks SHALL run and paste their output into
  the prompt before the model reads it

**Reason**: `skill-args` is on the Dropped packages list and is not in
`PACKAGES`. The installer never implemented placeholders; that runtime
lives in `npm:@juicesharp/rpiv-args`. Harness Skill Parameters already
covers the same behavior when a parameters package is installed.

**Migration**: Operators who want skill parameters run
`pi install npm:@juicesharp/rpiv-args`. Help and docs may still list it as
a non-catalog extra.
