# Release-ops reality: codify the actual release flow, cut dead spec

## Why

The 0.9.0 release cycle surfaced hard-won operational facts that the
repository claims incorrectly or not at all:

- README still promises the Release Please flow ("merge the release PR,
  GitHub publishes automatically") — release-please stopped producing
  releases at 0.6.4 (last `chore(master): release 0.6.4 (#75)`); every
  version since (0.6.5, 0.7.0, 0.8.0, 0.8.1, 0.9.0) was released
  manually.
- The release-please workflow is unprovisioned: the repo has no secrets
  (no `NPM_TOKEN`), so its `npm publish --provenance` step cannot ever
  authenticate. The workflow stays as the intended automation path, but
  the spec must call it what it is: not the current process.
- npm auth reality (learned the hard way this cycle): an expired device
  token makes publish fail with E404 (npm masks unauthorized scoped
  writes); `npm publish` without a token refuses with ENEEDAUTH instead
  of prompting; the account's 2FA requires an interactive TTY (OTP or
  device-auth browser flow). The manual release process and its auth
  mechanics deserve a spec scenario so the next release is 20 minutes,
  not 20 attempts.
- Spec cruft: the Catalog Model "Skill arguments source" scenario is a
  conditional that can never fire — `skill-args` is on the Dropped list
  and never cataloged. Ponytail: cut the dead branch.

## What Changes

- **Spec** (`lazypi/installer`):
  - ADDED `Requirement: Release Flow` — version-bump convention (`npm
    version <semver> --no-git-tag-version`, `X.Y.Z` commit, `vX.Y.Z` tag,
    push), publish via interactive session (device auth / 2FA OTP),
    token-expiry recovery (clear stale tokens before retry; npm 404s
    invalid tokens on scoped publish), and the unprovisioned CI path
    (release-please is the intended automation once an `NPM_TOKEN`
    secret exists; until then releases SHALL be manual).
  - Dead-scenario attempted removal: **blocked** — the OpenSpec validator
    (specs-apply.js MODIFIED guard) has no scenario-level removal; the
    "Skill arguments source" conditional (cannot fire: `skill-args` is
    Dropped) stays in the spec and is flagged in the exploration instead.
- **README**: "Releasing" section rewritten to the actual manual process
  plus the automation gap.
- **AGENTS.md**: two discipline notes — (1) any change touching
  `PACKAGES` data, CLI behavior, or release mechanics SHALL carry a spec
  delta (verify with `rg` before ever declaring `skip_specs` — the
  `essential` field drift of 2026-08-29 was caught exactly this way);
  (2) release checkpoints: run `npm run spec:validate` and `npm test`
  before bumping.
- **Exploration**: `release-ops-audit.md` records the evidence (release
  history, secret absence, auth flow findings).

## Capabilities

### Added Capabilities

- `lazypi/installer`: Release Flow requirement

### Modified Capabilities

- `lazypi/installer`: Release Flow added; dead Skill-arguments scenario
  flagged (removal unsupported by the OpenSpec scenario guard — see
  proposal)

## Impact

- `openspec/specs/lazypi/installer/spec.md`, `README.md`, `AGENTS.md`,
  `openspec/explorations/release-ops-audit.md`
- No code, catalog, or CI behavior changes; `.github/workflows/release-please.yml`
  untouched (still the intended automation once provisioned)