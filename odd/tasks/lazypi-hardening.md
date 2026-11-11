# LazyPi hardening: audit, verification layer, stacked delivery

Objective: audit the merged installer, correct verified defects, improve verification, and maintain the local delivery graph.
Branch: `audit/followup-foundation`; delivery: auto-chain, stacked-to-master with independent per-PR acceptance; runner: `npm test`, `npm run spec:validate`, isolated stub-first CLI checks.

## Specs

S1. "review and audit current project, with /skill:thermo-nuclear-code-quality-review and /skill:thermo-nuclear-review" — a full audited review of the repository using both methods, findings carrying their own reproduction.

S2. "update verification skills/tools," — the verification skill and its tools must cover the current CLI surface: `install`, `status`, `update`, `doctor`, `remove`, `--local`, and the documented flags.

S3. "build and verify," — build and verify the result. `npm test`, `npm run spec:validate`, and an isolated CLI proof must all pass.

S4. "recursive plan and update epics/issues graph," — a recursive plan and an updated epic/issue graph. Decided 2026-11-10: in-repo graph only, because GitHub issues are disabled on `tommy-ca/LazyPi`.

S5. "with swarm, arena, interrogate" — the audit must use a swarm fan-out, an arena bakeoff, and interrogate adversaries. Delivered: 4 code-quality reviewers, 2 adversaries, 3 arena candidates.

S6. "new stacked prs, ship the stack then" — deliver as new stacked pull requests and land the stack.

S7. (decision 2026-11-10) `pi` must resolve through the mise-managed harness; the accidental global install is removed.

S9. "build and update verification skills/tools and the feature maps, review and audit with swarm, arena, interrogate" (2026-11-11, after 0.11.0 shipped) — the verify skill, its feature docs, its scripts and the feature map must describe what the shipped CLI and suite actually do, and the audit must use a partitioned swarm, an arena bakeoff and an adversarial interrogate pass.

S8. "Reject update --local explicitly (recommended)". Accepted outcome: reject project-only update before spawning or writing; plain update requests extension packages across global and already-trusted project declarations, without changing project trust. Do not add unsupported `-l` or silently use `--approve`.

## Tasks

- T1 [S1,S6] Contract authority; inline; delivered in 154190e through PR #32; ancestor of baseline a567f9f.
- T2 [S1,S6] Settings integrity; inline; implementation delivered in 30c6c36 through PR #34, with corrected diagnostic; native acceptance unresolved, see L12.
- T3 [S1,S6] CLI decomposition; inline; delivered in 0f5c80f through PR #34; native review approved and acknowledged historically.
- T4 [S2] Verification layer; inline; delivered in 83d88d3 through replacement PR #37; historical #35 closed after base deletion, not rejection.
- T5 [S4] Documentation and graph; inline; delivered in b6d2c90 through PR #36; historical record corrections are T11.
- T6 [S6] Prior stack landing; inline; merged at a567f9f; delivery happened without completed settings authority and is not retrospectively approved.
- T7 [S1,S5] Follow-up audit and design; delegated read-only map, swarm, arena and interrogate; pending T8; source/contract audit and arena design returned, runtime audit incomplete and interrogate not run; no complete candidate verdict.
- T8 [S2,S3] Verification safety and baseline; delegated then parent-verified; delivered in fa68229, 2b69c76, d805dee and bb37e54; native slice review found one CRITICAL Windows defect, fixed in fa68229; suite 219 of 219 and spec:validate green in private state; Windows launcher NOT RUN; independent verdict pending the admission gate.
- T9 [S1,S3] Executable discovery; delegated then parent-verified; delivered in 2e4d8ce; 7 new behaviour tests, suite 226 of 226, differential clean; Windows resolution NOT RUN.
- T10 [S1,S3,S8] Update scope; delegated then parent-verified; delivered in b5027b7; suite 232 of 232 and spec:validate green; real Pi update behaviour and Windows NOT RUN.
- T11 [S4] Reconcile graph, inherited delivery claims and confirmed contract gaps; inline record updates plus delegated substantive changes under context backstop; pending; graph delivery/authority corrections written but uncommitted, contract reconciliation and final evidence remain incomplete.
- T12 [S3,S6] Independently verify exact PR slices and ship contiguous accepted stack; parent owns Git and delivery; blocked on the slice-1 targeted-validator slot, see L26; native terminal outcomes remain binding.

## Log

L1 (user request, verbatim):

```
review and audit current project, with /skill:thermo-nuclear-code-quality-review and /skill:thermo-nuclear-review
update verification skills/tools,
build and verify,
recursive plan and update epics/issues graph,
with swarm, arena, interrogate
new stacked prs, ship the stack then
```

L2. GitHub issues are disabled on `tommy-ca/LazyPi`, so the graph lands in-repo.

L3. Incident: an audit probe of the parent session, and separately a reviewer,
ran a real `npm install -g @earendil-works/pi-coding-agent`, installing 1.5.2 and
creating a `pi` symlink that competed with the mise-managed harness. Reported
immediately, user chose the mise-managed `pi`, package uninstalled, `pi` now
resolves to `npm-earendil-works-pi-coding-agent/1.5.0~aube~bf7e819e7e6c9773`. Root
cause is finding S3: `commandPath` shells out to `which`, so a missing `which`
makes a present `pi` look absent and `ensurePi` then offers a global install.

L4. Baseline before changes: `node --test` 179 pass 0 fail in 19 s;
`spec:validate` 40 archived plus 12 active items, 0 failed. Neither gate reads
delta-versus-spec consistency.

L5. T1 slice boundary: 602 authored changed lines in one commit, including the two
previously untracked `odd/tasks/*.md` files, which are kept because they are
claims that had no history. Past the ~400-line planning heuristic; the chained
strategy the user requested absorbs it.

L6. T1 verification. New gate proved RED against the deleted trap delta:
`claims exactly 18 entries; the catalog has 6`, `requires core entry
"pi-skillful"`, `requires core entry "goal"`. GREEN after removal. Gates after
T1: `node --test` 180 pass 0 fail; `spec:validate` 41 pass 0 fail.

L7. Decomposition decision. Arena candidate 1 (three modules, 980 lines, 67
deleted) is the base. Candidate 3 grafted: the message-value adapter rather than a
`say()` wrapper, the stdin-and-stdout TTY versus stdout-only color split, and the
warning that the byte oracle pins the two legacy status lines so they survive as a
literal. Candidate 2 grafted: the `installPlan()` pure-string assertion. Candidate
2 rejected on its own navigation weakness; candidate 3 rejected for growing the
total 6% and replacing one large module with a 232-line god-module.

L8. T2 landed as 2542745 on `fix/settings-integrity`. Eight rules, thirteen tests,
and the spec delta the change requires. Gates: `node --test` 193 pass 0 fail (was
180), `spec:validate` 13 active and 41 archived items 0 failed. A differential run
over `update`, `update --local`, `remove` by id, `remove` by source, `remove` with
no target, `status`, `status --local`, `install --local --yes`, `install --yes
--only subagents`, and `doctor` showed no unrequested change to stdout, stderr,
exit code, or stored bytes. Read paths still follow a symlinked settings file while
writes refuse it, so dotfile-managed configs stay readable.

L9. Slice boundaries in the delivery chain. Slice 1 `fix/contract-authority`:
154190e, 602 authored lines. Slice 2 `fix/settings-integrity`: 2542745, 868 authored
lines. Cumulative 1522. Both exceed the ~400-line planning heuristic; the chained
strategy S6 asked for is what absorbs that. Slice 2 grew `bin/lazypi.mjs` from 1047
to 1180 lines, which makes slice 3 mandatory rather than optional.

L10. Known debt deferred past this program: `hasCmd` and the `which` dependency
(security S3), `update --local` dropping project scope (S4), `PI_CODING_AGENT_DIR`
validation (S5), the `parseArgs` outcome enum, the two Windows quoting hypotheses,
and the 1.2 GB `.atl/evidence` tree written inside the checkout by a test that
never cleans up.

L11. Renewed request, verbatim:

```
review and audit current project, with /skill:thermo-nuclear-code-quality-review and /skill:thermo-nuclear-review
update verification skills/tools,
build and verify,
recursive plan and update epics/issues graph,
with swarm, arena, interrogate
new stacked prs, ship the stack then
```

L12. Follow-up baseline and authority, 2026-11-10. Clean checkout a567f9f contains
154190e, 30c6c36, 0f5c80f, 83d88d3 and b6d2c90 as measured ancestors. Earlier
claims that the open settings lineage was bookkeeping without risk are withdrawn.
The human selected "Authorize the supported recovery route". Native recovery
committed successor review-ce5ee99765aa1913 from review-930ad7d8e521922f with
provider-selected scope_changed. After the required inspect, successor STATUS
returned terminal lens_context_budget_exceeded for the accumulated historical
range. No retry, approval, acknowledgement, reset, or review-switch change followed.
That historical acceptance remains unresolved. New candidates must be narrow
work units against their actual parent, never a replay of the stopped range.

L13. Isolation authorization. The human selected "Authorize the isolated scratch
root" for /tmp/lazypi-followup-audit, created only when absent with mode 0700.
Use only this root for reports, baseline copies, test fixtures and isolated
HOME/XDG/Pi/npm/tmp state. Stub pi and npm before every mutating CLI probe.
No real installs, credentials, npm publication, deploy, force-push, unrelated
deletion or historical worktree mutation is authorized. Retain the existing
in-repo graph and keep GitHub issues disabled.

L14. Throughput checkpoint and designed workflow. Reuse the existing small-module
architecture rather than repeat the prior decomposition. Map first, then run a
partitioned structure/verification swarm. Arena compares bounded verification and
lookup designs with a cross-judge; interrogate challenges the resulting candidates.
Capture a hermetic baseline before source mutation. Implement verified findings
as independently reversible work units, each carrying its tests, docs and delta.
Prefer a verification-foundation slice, executable-discovery slice, justified
local-update slice and record-reconciliation slice. Forecast approximately
600-1000 authored changed lines across those slices; measure each actual diff and
make one coherent slicing pass if a PR exceeds 400. Parent owns Git. The runtime
context backstop requires the next substantive multi-step unit to be delegated;
no parallel writers share edit ownership. No application build script exists;
check JavaScript syntax and the offline packed-artifact path, not a Ruby build or
live extension install. Runtime model routing is configured by Pi; its delegate
API exposes no model selector, so model diversity is not assumed.

L15. Initial source map mwb5hyd7-1-n026 found current lookup still shells to which,
local update still delegates update --extensions without scope arguments, relative
agent directories explicitly preserve Pi compatibility, and native receipt logs
exist despite absent artifact upload. These are source-backed candidates, not new
runtime reproductions. Do not equate graph prose or validator success with proof.

L16. Contract finding and product decision. Primary Pi v1.5.0 docs/source at
https://raw.githubusercontent.com/earendil-works/pi/v1.5.0/packages/coding-agent/docs/cli.md
and src/package-manager-cli.ts plus src/core/package-manager.ts establish that
bare update self-updates Pi; update --extensions updates global and trusted
project packages; update rejects -l; --approve changes trust, not update scope.
Parent read bin/lazypi.mjs:587 and confirmed global ["update"] versus local
["update", "--extensions"]. The human selected exactly "Reject update --local
explicitly (recommended)" to the question "Pi cannot perform a project-only
package update. Which LazyPi behavior should this audit implement? In either
choice, plain lazypi update will request extension-package updates rather than
Pi self-update." This resolves T10's product fork, not its runtime verification.

L17. Failed baseline and explicit new attempt. Verifier mwb76z5d-2-64ed failed
preparation copying assumed node_modules/picocolors, exit 1, zero tests and
zero CLI probes. Original report and incomplete scratch remain preserved.
Parent read actual Clack manifests, checked scratch capacity, and created
/tmp/lazypi-followup-audit/prepared-v2 with tracked baseline a567f9f and complete
existing dependencies plus private state and fail-closed pi/npm stubs. No tests
or probes ran during preparation. After the task list confirmed no active or
uncertain child, the human selected "Authorize the prepared baseline attempt"
for one new gentle-ai-verify attempt covering npm test, spec validation, syntax,
CLI documentation mapping, offline packed-driver test and stubbed missing-which
reproduction. This is a separate request and does not erase the failed attempt,
reset a native budget or grant another retry.

L18. Arena result. Candidates mwb7815i-4-5ksj and mwb7815n-5-ko5v plus cross-judge
mwb7cunn-6-tcxg favor direct filesystem lookup with existing host signatures.
Choose A's smaller shape; graft B's JSON argv assertions, child-exit propagation
and physical creation of a Pi stub during bootstrap. Use a short private scan
rather than a new policy/generator interface unless implementation proves it
necessary. No cache across bootstrap. Narrow the initial implementation to POSIX
lookup, preserving the existing Windows branch without claiming native Windows
proof. Candidate agreement is design evidence only, not executed proof. Reports
and the append-only trail are under /tmp/lazypi-followup-audit/reports.

L19. New attempt outcome and bounded stop. Verifier mwb8lg2b-7-5zxz finished
PARTIAL/ISSUES. Parent read the finalized 03-prepared-baseline.md. The guard
incorrectly asserted fast-string-width/index.js instead of resolving its declared
entrypoint. It exited 1 before every named command; zero tests and zero CLI
probes ran. This is a verifier preparation error, not a missing dependency,
application defect or unavailable verification capability. No repair/retry ran.
The unmodified suite separately overrides child PATH without both stubs in
test/audit-seams.test.mjs:113-119 and 208-210. Parent did not waive that boundary.
The graph modification observed by the verifier is confirmed parent-owned from
the recorded edit tool call, not a concurrent unknown writer. Fresh task listing
shows no active or uncertain child. Product source is unchanged; only this task
file and the delivery graph are modified. Structural git diff --check passed.
No new PR, test pass, native approval or completed feature is claimed.

L25. Update-scope unit delivered. Commit 8f4a6ab. parseArgs now refuses
`update --local` and `-l` before settings are read or any child starts, with exit
2 and one message, and `cmdUpdate` prints and spawns one shared
EXTENSION_UPDATE_ARGV so the header cannot describe a different command than the
spawn. Parent spot checks: 38 of 38 tests across the five touched files, and the
help oracle byte-identical to live --help at 2921 characters. Full suite at HEAD
232 pass 0 fail 0 skipped, spec:validate 18 active-change and 41 archived items 0
failed. The unit's differential run showed 5 of 7 probes byte-identical and exactly
the two intended differences. One correction batch was needed because four
assertions in three out-of-surface files pinned the replaced argv and help bytes;
the product decision was already the human's, so the parent authorized those
mechanical updates instead of bouncing the decision back. Windows, real
`pi update --extensions`, trusted-project detection and pin handling remain
unobserved. Six stale prose sites remain outside every delegated surface:
docs/docs/index.html, philosophy.html, removing.html, and three sentences in the
accumulated installer spec. Six slice reviews are possible and would each spend
model runs, so review of slice f8a907b is parked pending human confirmation.

L24. Provider stop on the accumulated candidate. T9 landed as c08ace4 after the
parent spot check reproduced 7 of 7 focused, 226 of 226 suite and spec:validate 17
active-change plus 41 archived items with 0 failed, and confirmed no product code
spawns which any more. Review start for the branch tip then returned
lens_context_budget_exceeded with mutation_outcome none: no review authority was
created, nothing needs abandoning or repairing, and retrying that exact candidate
cannot succeed. The provider's stated continuation is to review smaller candidates
in a chained sequence. Parent recorded the stop and did not retry it. Committed
slices available for separate review: f8a907b, 6fa18a1, de67d34, e69d421, 38bb837,
c08ace4. The review reminder's earlier invalid_request is separate: untracked
files from the in-flight T9 unit needed an explicit scope, and that request
performed no mutation either.

L23. Isolation slice delivered and parent-verified. Commits f8a907b (helper plus
13 migrated fixtures), 6fa18a1 (guard), de67d34 (verification skill) and e69d421
(spec delta adding change 2026-11-10-verification-isolation). Parent ran the checks
itself: guard 6 of 6 pass, full suite 219 pass 0 fail 0 skipped, spec:validate 16
active-change and 41 archived items 0 failed, census down from 22 to 13 findings
with no real offender left under test/. Guard strength proven by planting a probe
fixture: two rules failed naming zz-parent-probe.test.mjs, green again after
removal, no leftover. A missing stub throws before any child runs. Assertion
accounting on the diff: settings-integrity swapped eight calls() emptiness checks
for eight external() checks with the same intent but tighter scope, and dropped a
literal assert.equal(result.error, undefined); audit-seams gained assertions and
keeps the documented absent-pi case at line 46 with exit 127, the message and an
empty external call list. Delivery slices recorded as three: f8a907b, then
6fa18a1, then de67d34..e69d421; slice one is large because 860 of its 1235 lines
are deletions in a mechanical migration, so review focus is the helper plus a skim
of the migrated fixtures. The independent verifier gate refused admission because
the launch text carried no supported Risk line and instructed inline verification
without a retry, so the item 3 contract change has parent-run probes and no
independent verdict; that gap is recorded, not waived. Windows launcher remains
unobserved.

L22. Harness failure, no work performed. Worker mwb9jix4-1-irue failed after four
assistant turns with zero tool calls, error provider_unavailable. Parent inspected
the repository: only L21 tracking edits exist, no untracked files, no scratch from
that task. This is a runtime/provider failure, not a scope, permission, budget or
product outcome, and it produced no code, no test result and no partial edit.
The same authorized unit is re-dispatched. If the runtime stays unavailable, the
parent performs the unit inline under the same scope instead of escalating it into
extra ceremony.

L21. Premise challenge and authorized continuation. The premise under test was "a test that prepends its own stub bin directory to PATH is isolated from real tools." The rerunnable census reports/census.mjs, output reports/04-census.txt, found 28 scanned files and 22 findings: 6 sites inheriting the real PATH, 8 forcing /usr/bin or /bin onto a child PATH, and 8 literal dependency paths. Holders are parent-authored preparation guards outside the repository and the test fixtures themselves, not product code; bin/pi-host.mjs external which is the separate T9 defect. The census also showed that putting the running Node install directory on a child PATH exposes the real npm binary on this host, so the repair must not do that. The human answered "approve and resume" to the proposed bounded verification-foundation continuation. Authorized scope: one implementation worker makes CLI-spawning tests physically unable to reach a real pi, npm or system tool, adds an enforceable guard test, and updates the verification skill documentation, with one correction batch, focused and full private-state checks, and independent acceptance of the changed candidate. Not authorized: product-source fixes, another baseline attempt, commits, PRs, native operations, credentials, installs or publication. The two failed preparations stay preserved.

L20. Needs your decision. This automatic cycle ends without another verification
attempt. Proposed bounded continuation: one scoped implementation worker corrects
verification prerequisites using module/manifest resolution and repairs the
identified test fixture PATH overrides, with corresponding regression checks and
verification-skill documentation. One correction batch is the worker limit.
Checks are focused prerequisite/isolation tests and the repaired suite in private
stub-first state, followed by independent acceptance of that changed candidate.
Do not rerun or relabel either failed baseline attempt. The original installer
fixes, adversarial review and stacked delivery remain the authorized objective,
but their missing proof and the historical native stop are not waived.

L26. Native review of slice 1 and its one real finding. Reviewers ran on
openai/gpt-6.1-sol (risk, reliability) and the provider refuter on
opencode-go/deepseek-v4.1-flash, three model runs in total. The refuter returned
correction_required with R3-windows-executable-path, CRITICAL and introduced: the
helper treated any command without a forward slash as a bare stub name, so on
Windows the Node executable with backslashes was mistaken for a stub and every
sandbox.run threw. Parent accepted the finding, fixed it with isAbsolute plus both
separators, and committed it in the review worktree as the bounded correction at
11 declared diff lines. Parent then rebased the branch so slice 1 carries the fix,
and slice 1's tree now equals the reviewed correction tree exactly:
1b71c0cac665c9f8b6865e2646958f69ee619a8e. The rebase rewrote commit identities;
slice 1 fa68229, guard 2b69c76, skill d805dee, isolation delta bb37e54, records
118c4bb, resolution 2e4d8ce, skill words 1dd69b1, update scope b5027b7, records
c3a4eff. Post-rebase suite is 232 of 232 and spec:validate 18 plus 41 with 0
failed, and the Windows guard fix is present in the slice-1 commit itself. The
provider then required a targeted validator and the facade rejected its issued
binding twice as missing or stale, with no mutation either time. Parent did not
compose substitute tokens and is not retrying; the reviewer of immutable trees
produced no verdict, so lineage review-8a1de3d2981a5139 stays open at
correction_required and needs a human decision or a facade fix.

L27. Option-1 diagnosis and slice-1 closure. The earlier acceptance was blocked
by the facade, not by the provider: a capture compares the provider-issued
binding against a STATUS fetched through the route recorded at start, and that
route carried no base-ref, so no binding could ever match. A fresh lineage started
with an explicit base-ref and committed-only carried the selector, and every
capture matched on the first try. Lineage review-bab47ba5a7e4d10c reviewed the
corrected candidate tree 1b71c0cac665c9f8b6865e2646958f69ee619a8e with two
openai/gpt-6.1-sol reviewers, reached approved on the last admitted event, and was
acknowledged, burning its authority. One informational WARNING remains,
R3-missing-pi-restored at test/pstack-retirement.test.mjs:47, non-blocking and
explicitly not a reason to re-review the candidate. The stuck lineage
review-8a1de3d2981a5139 stays recorded as blocked by the missing selector; its
refuter finding was fixed and is what the fresh lineage reviewed. Total review
spend so far is five model runs. Remaining slices are unreviewed and the stack is
not yet pushed.

- T13 [S9] Partitioned swarm audit of the verification surface; delegated read-only explorers over skill text, feature docs, scripts and prose/fixture coverage; pending.
- T14 [S9] Arena bakeoff for how the feature map and its enforcement should be updated; delegated candidates plus cross-judge; pending.
- T15 [S9,S2] Implement the winning verification design, fix audited staleness and wire the enforcement; delegated writer; pending.
- T16 [S9,S5] Interrogate the resulting candidate with independent adversarial reviewers; pending.
- T17 [S9,S6] Deliver as one reviewable PR; parent owns Git; pending.

