# Verification coverage

## Why

The verification layer claimed coverage it did not have, and its main CI gate
could not fail.

`.github/workflows/test.yml` ran `node bin/lazypi.mjs --yes --only optional`
between the full install and the full-catalog assertion. That command prints
"Nothing selected — nothing to install." and exits 0 without reading or writing
anything, so the step only failed if the CLI itself stopped running. The spec
called it "a harmless empty selection for existing workflow compatibility",
which is exactly the property that makes it useless as an assertion.

`scripts/assert-installed-packages.mjs` could not detect the condition an empty
optional tier would create. It filtered the expected source set by package id
only, so `--except core` — a category name where a package id is expected —
excluded nothing, and a full-core profile reported six expected sources and
exited 0. It also read `$HOME/.pi/agent/settings.json` directly while the CLI
resolves its config directory through `PI_CODING_AGENT_DIR`, so the assertion
broke under a custom agent directory.

`test/ci-workflows.test.mjs` audited `windows-smoke.yml` step order without
noticing that the workflow is `workflow_dispatch`-only. It therefore cannot gate
a pull request while the spec's Portable update fixture scenario imposes a
Windows obligation.

`test/native-pstack-proof.test.mjs` created fixture evidence under
`.atl/evidence/...` inside the checkout and never removed it, which had grown to
1.2 GB and contradicted the verify skill's own rule that evidence lives outside
the checkout.

The feature map under `.agents/skills/verify/features/` had no entries for
`doctor`, `update`, `remove`, or `--local`, and it contradicted itself: the map
README said the checks do not cover removal or update, while two feature docs
described suite coverage of broad updates and raw removal passthrough.

## What changes

- The Linux workflow replaces the empty-selection install with a gate that
  asserts the empty optional selection contract: exit 0, unchanged settings
  bytes, and no `pi install` or `npm` spawn.
- `scripts/assert-installed-packages.mjs` gains `--tier core|optional|all`,
  derived from each package's category, rejects a category name passed where a
  package id is expected, and resolves its default settings path through
  `PI_CODING_AGENT_DIR`.
- Workflow checks assert each workflow's actual triggers, so the dispatch-only
  Windows workflow records that it cannot gate a pull request. The trigger
  itself is unchanged.
- Native-proof fixture evidence moves to a system temporary directory that the
  test removes when its process exits.
- Feature docs are added for `doctor`, `update`, `remove`, and `--local`, the map
  states the manual-versus-suite split once, and `scripts/cli-surface.mjs` fails
  when a command or flag the parser accepts has no coverage entry.

## Impact

- Affected specs: `lazypi/installer` (`Self-Deriving CI`, `Executable CI
  contracts`)
- Affected code: `.github/workflows/test.yml`,
  `scripts/assert-installed-packages.mjs`, `scripts/cli-surface.mjs`,
  `test/ci-workflows.test.mjs`, `test/native-pstack-proof.test.mjs`,
  `.agents/skills/verify/`
- No product behavior, catalog entry, help text, or `bin/` change
- New tests: `test/cli-surface.test.mjs`, plus tier, category-rejection,
  agent-dir, empty-selection, and trigger cases in existing test files
