# LazyPi delivery graph

In-repo graph only. GitHub issues are disabled on `tommy-ca/LazyPi`, so this file
is the durable epic and issue record. Pull requests are the delivery nodes.

Legend: `[x]` landed, `[~]` in progress or awaiting a decision, `[!]` blocked on
external proof or authorization, `[ ]` not started. Source presence and passing
checks do not establish review acceptance.

Source of every item: the 2026-11-10 thermo-nuclear audit, recorded in
`odd/tasks/lazypi-hardening.md` (specs, tasks, log) and delivered through the
stacked pull requests below.

## Delivery order

The stack lands bottom-up. Each node depends on the one above it.

| Node | Pull request | Branch | Delivery evidence |
|---|---|---|---|
| D1 contract authority | [#32](https://github.com/tommy-ca/LazyPi/pull/32) | `fix/contract-authority` | `154190e` is an ancestor of baseline `a567f9f` |
| D2 settings integrity | [#33](https://github.com/tommy-ca/LazyPi/pull/33) | `fix/settings-integrity` | PR closed after base deletion; `30c6c36` landed through D3, native acceptance unresolved |
| D3 decomposition | [#34](https://github.com/tommy-ca/LazyPi/pull/34) | `refactor/decompose-cli` | `0f5c80f` is an ancestor of baseline `a567f9f` |
| D4 verification layer | [#37](https://github.com/tommy-ca/LazyPi/pull/37) | `chore/verification-layer` | Replaces closed [#35](https://github.com/tommy-ca/LazyPi/pull/35); `83d88d3` is an ancestor of baseline `a567f9f` |
| D5 documentation truth | [#36](https://github.com/tommy-ca/LazyPi/pull/36) | `docs/truth-and-graph` | `b6d2c90` is an ancestor of baseline `a567f9f` |

These are inherited delivery records cross-checked against local Git ancestry.
They do not retrospectively approve D2. Do not delete a stacked base branch
before retargeting and checking its dependent PR.

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
- [!] E1.6 The `status` parse-error diagnostic was restored and pinned, but that
  does not close native acceptance. After explicit human authorization, native
  recovery replaced `review-930ad7d8e521922f` with `review-ce5ee99765aa1913`.
  The successor stopped at `lens_context_budget_exceeded` for the accumulated
  historical range. No retry or approval followed. The earlier description as
  bookkeeping without risk was wrong and is withdrawn.

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
- [~] E3.4 Current global update delegates bare `pi update`, which self-updates Pi
  under its v1.5.0 public contract. Local update delegates `pi update --extensions`,
  which updates global and trusted project packages, not project-only packages.
  Pi rejects `-l` for update; `--approve` changes trust rather than scope. Human
  decision S8 rejects LazyPi `update --local` before spawning or writing, and
  makes plain update request extensions without overriding saved trust. T10
  implements and verifies this outcome; it has not shipped.
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
- [~] E4.9 Relative `PI_CODING_AGENT_DIR` is explicitly asserted by existing
  compatibility tests. The earlier wording treated an unproven policy concern
  as a defect. Preserve that behavior unless a separate requirement changes it.

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
- [~] E6.7 Native proof is dispatch-only with a pinned branch condition and no
  artifact upload. It emits structured stdout receipts in platform job logs.
  The earlier claim that receipts necessarily die with the runner was not
  established. Log retention and retrieval remain separate investigation items.

## E7 Documentation truth

- [x] E7.1 `AGENTS.md` said four video categories where `docs/_data/videos.yml` has
  five. Corrected, and `videos.html`, `videos.yml` and `videos.css` are now in the
  structure block. D5.
- [x] E7.2 `CHANGELOG.md` had an empty `Unreleased` across the whole stack.
  Filled. D5.
- [x] E7.3 The audit claimed `v0.10.4` was never tagged. That was wrong, a
  lexicographic `git tag --list | tail` read as a missing tag. The tag exists.
  No change made.
- [~] E7.4 The earlier claim that `.atl` scratch trees were tracked was not
  established and is withdrawn. Historical ignored evidence is not a shipped
  artifact. No cleanup or new measurement of that historical tree was performed
  during the follow-up audit.

## E8 Follow-up work and acceptance dependencies

The renewed request is logged verbatim in the feature document at L11. The
baseline is `a567f9f`. New work uses separate candidate ranges, not the stopped
historical range. Existing graph IDs remain local issue IDs, not GitHub issues.

```text
E8 Follow-up hardening
+-- T7 Source audit and lookup design [partial; pending T8]
|   +-- source/public-contract review [returned, no runtime proof]
|   +-- competing lookup sketches and cross-judge [returned, design only]
|   +-- interrogate of resulting candidates [pending]
+-- T8 Hermetic baseline and verification updates [landed as commits, PRs pending]
|   +-- initial setup [failed before tests or probes, retained]
|   +-- repaired payload [prepared, explicit new attempt authorized]
|   +-- new attempt [invalid entrypoint guard; all named checks NOT RUN]
|   +-- premise challenge and census [reports/census.mjs]
|   +-- delivered f8a907b, 6fa18a1, de67d34, e69d421 [suite 219/219, Windows NOT RUN]
+-- T9 POSIX executable lookup correction [landed c08ace4; Windows NOT RUN]
+-- T10 Truthful update scope and rejection [landed 8f4a6ab; real Pi update unobserved]
+-- T11 Graph and contract reconciliation [record correction in progress]
+-- T12 Independently accepted PR slices and bottom-up landing [pending]
```

T8's baseline precedes product-source changes. T9 and T10 each carry behavior,
regression tests, help/docs and their own spec delta. They do not require another
broad CLI decomposition. T12 requires exact-patch independent verdicts, applicable
native review, and current-head CI for each slice. The failed preparation remains
failed even if a later explicitly authorized attempt succeeds. Model agreement,
source excerpts and historical test totals are not runtime proof.

Evidence is under `/tmp/lazypi-followup-audit/reports`; the canonical task and
acceptance record is `odd/tasks/lazypi-hardening.md`. The append-only decision trail
is `decisions.tsv` in that reports directory. The latest baseline report is
`03-prepared-baseline.md`, `04-premise-and-census.md` and `04-census.txt`. L19-L23 in the feature
document record the bounded stop, the premise challenge and the delivered
isolation slices. No pull request exists for those slices yet.

## Risk register

- **E1, E2, E4** touch stored user data and the security boundary for config files
  and credentials. Any future change here needs the same isolation discipline the
  audit used. A probe that runs the CLI without stub `pi` and `npm` first on PATH
  can install software globally, which is how the development environment was
  damaged once already.
- **E3.3** removes two user-visible output lines. A consumer parsing `status` or
  `doctor` output is affected.
