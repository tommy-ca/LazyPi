## MODIFIED Requirements

### Requirement: Self-Deriving CI

The exact-source assertion used by CI SHALL derive from `PACKAGES` rather than
a separate manifest, so catalog edits propagate to CI automatically. Unit
tests SHALL pin catalog ids, categories, and sources against the Catalog
Model so a missed spec delta cannot stay green.

#### Scenario: Full-install assertion

- **WHEN** `scripts/assert-installed-packages.mjs --check-status` runs after
  a full catalog install
- **THEN** `lazypi --yes` SHALL install all 6 core registrations
- **AND** the expected source set SHALL come from `PACKAGES`, filtered by
  `--tier` and then by `--except`
- **AND** it SHALL require exact equality to non-excluded fresh install sources
  (`installSource` when present, otherwise `source`), rejecting unexpected sources
- **AND** this clean-install assertion SHALL NOT be used as preserved-profile proof
- **AND** the `status` header SHALL report the expected count over
  `PACKAGES.length`

#### Scenario: Tier-aware expectation

- **WHEN** `scripts/assert-installed-packages.mjs` runs with `--tier core`,
  `--tier optional`, or `--tier all`
- **THEN** each package's `category` SHALL decide whether it is in the expected
  set
- **AND** `all` SHALL be the default and SHALL match the unfiltered catalog
- **AND** an unknown tier SHALL fail with a printed message naming the valid
  tiers
- **AND** an expected set that is empty SHALL NOT pass an assertion against a
  profile that has sources installed

#### Scenario: Category rejected where a package id is expected

- **WHEN** `--except` receives a category name rather than a package id
- **THEN** the assertion SHALL fail with a printed message that names `--tier`
  as the tier selector
- **AND** it SHALL NOT silently exclude nothing and report a passing assertion

#### Scenario: Agent directory resolution

- **WHEN** `PI_CODING_AGENT_DIR` is set and no explicit `--settings` path is
  passed
- **THEN** the assertion SHALL read the settings file the CLI would read under
  that agent directory
- **AND** an explicit `--settings` path SHALL still override it

#### Scenario: Empty optional gate

- **WHEN** CI asserts an empty optional selection
- **THEN** it SHALL assert that the exit status is 0, the settings bytes are
  unchanged, and no packaging command ran
- **AND** it SHALL NOT run a bare empty selection as the gate, because that
  command exits 0 without touching state
- **AND** a failure of that assertion SHALL fail the job

#### Scenario: CLI surface coverage

- **WHEN** `npm test` runs
- **THEN** a check SHALL read the commands and flags the argument parser accepts
- **AND** it SHALL fail when a command or flag has no entry in the verification
  feature map
- **AND** it SHALL fail when a coverage entry names a command or flag the parser
  does not accept
- **AND** it SHALL fail when a mapped feature doc is missing, unlisted in the
  feature map, or silent about its command or flag

#### Scenario: Verification feature map

- **WHEN** the verification feature map is read
- **THEN** it SHALL carry one entry per accepted command and flag, including
  `doctor`, `update`, `remove`, and `--local`
- **AND** each entry SHALL record its isolation recipe, the commands to drive,
  what to assert, and what remains unverified
- **AND** it SHALL state the manual-versus-automated coverage split in one place
  and SHALL NOT describe removal or update coverage contradictorily

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

### Requirement: Executable CI contracts

Workflow checks SHALL verify required commands as executable run steps rather than raw substrings. CLI fixtures SHALL isolate settings and support the platform running the suite.

#### Scenario: Required workflow execution

- **WHEN** CI contract tests inspect Linux or Windows workflows
- **THEN** they SHALL check required command order using uncommented run steps
- **AND** conditional or multiline workflow forms outside the checker's supported shape SHALL fail closed
- **AND** regression mutations with a commented, false-conditioned, or reversed required command SHALL fail the check

#### Scenario: Workflow triggers recorded

- **WHEN** CI contract tests inspect a workflow
- **THEN** they SHALL assert the workflow's actual trigger list
- **AND** a workflow that runs only on manual dispatch SHALL be recorded as
  unable to gate a pull request
- **AND** the gap SHALL be visible in the check rather than inferred from the
  workflow file

#### Scenario: Portable update fixture

- **WHEN** the update delegation regression runs on Windows
- **THEN** its mock Pi SHALL use a `.cmd` launcher and retain the system PATH
- **AND** all platforms SHALL isolate `HOME`, `USERPROFILE`, and `PI_CODING_AGENT_DIR`
- **AND** temporary fixtures SHALL be cleaned up after the test
