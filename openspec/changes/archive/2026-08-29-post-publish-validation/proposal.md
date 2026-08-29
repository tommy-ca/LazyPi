# Post-publish validation becomes part of the release contract

## Why

Every release in this session (0.8.0, 0.8.1, 0.9.0) was validated
post-publish the same way, manually, from learned experience: fetch the
published artifact from the registry through both runners, from a neutral
directory, and exercise version/help/status/install. That habit caught
real issues (registry fetch verification, the npx local-tree quirk
discovered this way) and belongs in the contract, not in tribal memory.
The Release Flow requirement (added 2026-08-29 in release-ops-reality) is
missing this final gate.

## What Changes

- **Spec** (`lazypi/installer`, Release Flow): ADDED `Post-publish
  validation` scenario — after publishing, `npx -y
  @tommy-ca/lazypi@<version> --version` and `bunx
  @tommy-ca/lazypi@<version> --version` SHALL both report the released
  version; they SHALL run from a directory outside the LazyPi checkout
  (npm exec resolves the checkout itself as the package and fails with
  `lazypi: not found`); and `status` + `install --yes` SHALL report the
  full catalog as installed (idempotent no-op) on the operator install.
- **README** "Releasing" gains the validation step.
- **Exploration**: `release-ops-audit.md` resolution extended.

## Capabilities

### Modified Capabilities

- `lazypi/installer`: Release Flow — post-publish validation scenario

## Impact

- `openspec/specs/lazypi/installer/spec.md` (via change delta), `README.md`,
  `openspec/explorations/release-ops-audit.md`
- No code, catalog, or CI changes