# Installer Specification (lazypi)

## MODIFIED Requirements

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