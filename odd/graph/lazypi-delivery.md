# LazyPi delivery graph

In-repo graph only. GitHub issues are disabled on `tommy-ca/LazyPi`, so this file
is the durable epic and issue record. Pull requests are the delivery nodes.

Legend: `[x]` landed, `[~]` open with a decision pending, `[!]` blocked on
something outside the repository, `[ ]` not started.

Source of every item: the 2026-11-10 thermo-nuclear audit, recorded in
`odd/tasks/lazypi-hardening.md` (specs, tasks, log) and delivered through the
stacked pull requests below.

## Delivery order

The stack lands bottom-up. Each node depends on the one above it.

| Node | Pull request | Branch | Depends on |
|---|---|---|---|
| D1 contract authority | [#32](https://github.com/tommy-ca/LazyPi/pull/32) | `fix/contract-authority` | master |
| D2 settings integrity | [#33](https://github.com/tommy-ca/LazyPi/pull/33) | `fix/settings-integrity` | D1 |
| D3 decomposition | [#34](https://github.com/tommy-ca/LazyPi/pull/34) | `refactor/decompose-cli` | D2 |
| D4 verification layer | [#35](https://github.com/tommy-ca/LazyPi/pull/35) | `chore/verification-coverage` | D3 |
| D5 documentation truth | this branch | `docs/truth-and-graph` | master |

## E1 Settings and configuration integrity

The settings document could be destroyed, silently discarded, or disclosed.

- [x] E1.1 Refuse a symlinked or non-regular settings target before writing. A
  repository-committed `.pi/settings.json` symlink could copy a target's bytes
  into the tree and overwrite the target. D2.
- [x] E1.2 Write atomically through a same-directory temp file, chmod, fsync and
  rename, so a failed write cannot leave unterminated JSON. D2.
- [x] E1.3 Give backups millisecond resolution plus a counter, so two mutations
  in one second cannot overwrite the only recovery artifact. D2.
- [x] E1.4 Validate the document shape and fail closed with exit 2. A top-level
  array silently discarded the override write at exit 0 and a numeric top-level
  value threw a raw `TypeError` at exit 1. D2.
- [x] E1.5 Escape control characters from settings and auth before printing, so a
  committed project file cannot inject OSC 52 or forged error text into CI logs.
  D2.
- [~] E1.6 The `status` parse-error diagnostic was restored after native review
  caught that the shared printer changed it. Code fixed and pinned. The review
  lineage remains open at `correction_required` because the host rejected the
  correction-plan capture twice. Bookkeeping only, no code risk.

## E2 Credential handling

- [x] E2.1 A non-object `auth.json` yields no providers. `["nobody"]` previously
  produced a provider literally named `0` that `doctor` reported as healthy. D2.
- [x] E2.2 No secret value is printed or persisted. Verified by probe, and must
  stay that way under any future refactor. D2.

## E3 Command-line contract

- [x] E3.1 `--version` combined with an invalid argument reports the usage error
  and exits 2 instead of printing the version and exiting 0. D2.
- [x] E3.2 `ensurePi` takes the caller's interactivity decision, so `--only core`,
  the documented scripted path, no longer blocks on a bootstrap prompt. D2.
- [x] E3.3 `status` no longer prints the always-empty legacy-sources section, and
  `doctor` no longer warns about a git migration the tool cannot perform. D3.
- [~] E3.4 `update --local` emits `pi update --extensions` with no `-l` and no
  `--approve`, while install and remove pass both. Under Pi's default project
  trust, protected project resources are skipped, so project scope is silently
  dropped. Recorded as observed behaviour, not fixed. Needs a product decision.
- [~] E3.5 `hasCmd` shells out to `which`, so a missing `which` makes a present
  `pi` look absent and triggers an unsolicited global install. This exact defect
  damaged the development environment during the audit. Resolve through
  `process.env.PATH` plus an executable check. Not fixed.

## E4 Structural debt

- [x] E4.1 Delete the legacy-source subsystem. No catalog entry declares
  `legacySources`, so six functions, a derived field, four commands' call sites
  and two output blocks were unreachable. 163 lines deleted outright. D3.
- [x] E4.2 Delete the `buildSpawnOptions` identity wrapper and the three
  tautological tests asserting on it. D3.
- [x] E4.3 Replace eleven duplicated `if (interactive)` renderings with a
  message-value adapter, and separate interactivity from colour. D3.
- [x] E4.4 Split the executable into `bin/catalog.mjs` and `bin/pi-host.mjs`.
  Entrypoint 1180 to 773 lines, settings contract byte-identical after the move.
  D3.
- [x] E4.5 Fix the `stdout` parameter that shadowed the module-level `stdout`
  import. D3.
- [~] E4.6 The interactive clack rendering has no automated coverage because no
  test drives a TTY. The plain path is pinned by byte oracles and a differential.
  This gap predates the audit and survives it.
- [~] E4.7 `commandPath` is uncached, so `doctor` spawns `which` once per binary.
- [~] E4.8 The `parseArgs` invalid-argument path sets two flags for one condition,
  which `main` then decodes as a branch chain. Collapse to one outcome enum.
- [~] E4.9 `PI_CODING_AGENT_DIR` is unvalidated, so a relative value writes
  outside any intended root.

## E5 Contract layer

- [x] E5.1 Establish the active installer spec as the single catalog authority.
  Three documents claimed to be the contract, one of them demanding an 18-entry
  catalog the code does not ship. D1.
- [x] E5.2 Delete `2026-11-04-lean-autonomy-core`. It had no `tasks.md`, so
  archiving it silently rewrote the canonical spec to that false catalog. D1.
- [x] E5.3 Archive `2026-11-07-strict-minimal-pstack-catalog` without merging it,
  because `openspec archive` aborts on a requirement its successor already
  applied. D1.
- [x] E5.4 Fail when any active change delta claims a catalog that contradicts
  `PACKAGES`. Proved RED against the deleted trap delta. D1.
- [x] E5.5 Re-point `test/catalog-contract.test.mjs` from an archived delta to the
  live spec. D1.
- [ ] E5.6 Three shipped behaviours still have no active contract:
  `isolated-packed-verification`, `selection-before-bootstrap` and
  `ask-user-batch-docs` must be applied, not merely archived.
- [ ] E5.7 `2026-09-02-skill-layer-governance` would add obligations about
  `~/.agents`, a directory outside this repository. Decide whether to keep it.

## E6 Verification and CI

- [x] E6.1 Feature docs for `doctor`, `update`, `remove` and `--local`, with the
  manual-versus-suite split stated once. D4.
- [x] E6.2 Make `scripts/assert-installed-packages.mjs` tier-aware, reject a
  category name where an id belongs, and honour `PI_CODING_AGENT_DIR`. D4.
- [x] E6.3 Replace the `--yes --only optional` CI step, which printed "Nothing
  selected" and exited 0, with a gate asserting an empty optional selection
  mutates nothing and runs neither `pi` nor `npm`. Proved sensitive by injecting a
  spawn into the empty path. D4.
- [x] E6.4 Add `scripts/cli-surface.mjs`, wired into `npm test`, failing when an
  accepted command or flag has no feature-map entry. D4.
- [x] E6.5 Move native-proof fixture evidence out of the checkout. It was writing
  into `.atl/evidence` inside the tree, which had grown to 1.3 GB. D4.
- [~] E6.6 `windows-smoke.yml` is `workflow_dispatch` only, so no pull request
  ever runs it while the spec makes a Windows obligation normative. The trigger is
  recorded by a test instead of being invisible. Changing it is a CI cost decision.
- [~] E6.7 The native-proof job requires a ref that pushes and pull requests never
  produce, and uploads no artifact, so the receipts it exists to produce die with
  the runner.

## E7 Documentation truth

- [x] E7.1 `AGENTS.md` said four video categories where `docs/_data/videos.yml` has
  five. Corrected, and `videos.html`, `videos.yml` and `videos.css` are now in the
  structure block. D5.
- [x] E7.2 `CHANGELOG.md` had an empty `Unreleased` across the whole stack.
  Filled. D5.
- [x] E7.3 The audit claimed `v0.10.4` was never tagged. That was wrong, a
  lexicographic `git tag --list | tail` read as a missing tag. The tag exists.
  No change made.
- [~] E7.4 Two `.atl` scratch trees and the historical `odd/tasks/*.md` claims are
  now tracked, but the 1.3 GB historical evidence tree still occupies the
  checkout exclusion and is not part of the repository.

## Risk register

- **E1, E2, E4** touch stored user data and the security boundary for config files
  and credentials. Any future change here needs the same isolation discipline the
  audit used. A probe that runs the CLI without stub `pi` and `npm` first on PATH
  can install software globally, which is how the development environment was
  damaged once already.
- **E3.3** removes two user-visible output lines. A consumer parsing `status` or
  `doctor` output is affected.
