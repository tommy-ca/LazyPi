# Installer Specification (lazypi)

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Catalog Model

The catalog SHALL be the exported `PACKAGES` array in `bin/lazypi.mjs`; every
entry SHALL carry `id`, `category`, `source`, `description`, and `hint`, and
MAY carry `legacySources`.

#### Scenario: Lean catalog shape

- **WHEN** the catalog is loaded
- **THEN** it SHALL contain exactly 16 entries: 12 core and 4 optional
- **AND** the categories SHALL be `core` and `optional`
- **AND** core SHALL contain subagents, pi-ask-user, pi-skillful,
  mention-skill, goal, btw, context-usage, simplify, web-access, fff,
  dynamic-workflows, and ponytail
- **AND** optional SHALL contain lsp, interactive-shell, autoresearch, and
  todos

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
  skill-args, memory, mcp, or ralph-wiggum

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