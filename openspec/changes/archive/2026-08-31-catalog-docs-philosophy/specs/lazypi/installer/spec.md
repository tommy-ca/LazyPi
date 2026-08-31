## ADDED Requirements

### Requirement: Catalog documentation

`README.md` SHALL list each `PACKAGES` id in `PACKAGES` order with its
category and a rationale.

`README.md` SHALL state that `--yes` installs 12 packages.

`README.md` SHALL state that the TTY Install all or Install everything
path installs 17 packages.

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
- **AND** it SHALL state that TTY Install all or Install everything
  installs 17 packages

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
