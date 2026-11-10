# Lean autonomy-first LazyPi catalog
Objective: research and classify the catalog, reduce default selections without deleting user data, verify and ship reviewed changes.
Branch: `audit/lean-autonomy-core`; delivery: `auto-chain`, stacked-to-master; runner: `node --test`, `npm test`, `npm run spec:validate`.

## Specs

- S1. "research, explore current list of packages, verify and check against official docs, categorize/classify by features/functions, dedup, compact to lean packages". Preserve every catalog identity, source and legacy source. Assumption: no package is deleted without evidence of equivalence and explicit authorization. Research found overlaps, not exact duplicates.
- S2. User selected "6 core: autonomy-first": "Keep subagents, ask-user, skillful, web-access, goal, and dynamic-workflows in core. Move the other current core packages to optional." Existing registrations, configuration and data must not be removed as a consequence of this change. Preserve optional selection and full-catalog management.
- S3. "build and update verification skills/tools, build and verify". Add focused deterministic tests and improve the existing verification skill only where needed. Verify user-facing selection and preservation; update CLI help, documentation and complete OpenSpec deltas. Do not run a Ruby or documentation-compiler build, per prior user correction.
- S4. "with swarm, arena, interrogate, new stacked prs, ship the the stack". Use independent review, exact-head CI and gated GitHub merges to `tommy-ca/LazyPi` via the existing gh session over HTTPS. Fresh session authorization is recorded in L5. No force-push, npm publication or deployment.
- S5. "review and explore active worktrees, pick up session, recursive plan into epics/issues graph, update verification skills/tools, build and verify, with swarm, arena, interrogate, new stacked prs, ship the stack then". The user selected "Keep the graph in the feature document". Keep GitHub issues disabled, preserve the historical delivery worktree and unrelated PR #10, and recover from the current staged candidate.

## Tasks

- T1 [S1,S4] Capability mapping and arena; delegated read-only swarm plus candidate plans and cross-judge; evidence collected; no code changes.
- T2 [S3] Strengthen existing selection and state verification, including the project verification skill; inline; complete in `e477eea`; risk: none (test and verification instructions only).
- T3 [S1,S2,S3] Change catalog tiers, tests, CLI copy, documentation and OpenSpec together; inherited inline implementation complete in `d216973`; writer local gates passed, independent acceptance is T4; risk items 1 and 3 (existing installed-state preservation and default CLI contract).
- T4 [S3,S4] Interrogate and independently verify complete feature; delegated read-only for named risk items 1 and 3; complete: A PASS, updated B PASS+NOTES, C PASS+NOTES, including scoped T8 acceptance. Empty interrogate finding sets are not functional proof.
- T5 [S4] Deliver verified stack and merge only current-head gated PRs; parent owns Git and authorized delivery; complete: #14 merged as `efbb614`, #15 as `cab485c`, #16 as `a947acf`, after exact-patch independent verdicts and fresh current-head CI.
- T6 [S5] Recover worktree state and retain a local recursive epic/dependency graph; parent synthesis of read-only pickup swarm; complete, no source change.
- T7 [S2,S3,S5] Add stateful offline selection-preservation evidence and its verification feature guide; delegated bounded writer because the runtime context backstop fired; complete in `22300c9`, RED/GREEN and local gates observed, parent focused rerun passed; independent shipping acceptance is T4.
- T8 [S3,S4] Correct the reproduced hosted E2E tier-order expectations; inline bounded correction `d302c76`; complete: local gates, independent scoped PASS+NOTES and hosted E2E passed. Risk item 5 (CI verification script), no production edits.

### Epic and issue dependency graph

Local issue IDs below are task IDs, not GitHub issues. E0 owns the feature.

```text
E0 Lean autonomy catalog
+-- E1 Decision and research: T1 complete
+-- E2 Verification foundation: T2 complete in e477eea
+-- E3 Recovery and local graph: T6 complete
+-- E4 Catalog outcome
|   +-- T3 Catalog, spec and documentation: complete in d216973
|   +-- T7.1 Stateful global/project preservation evidence: complete in 22300c9
|   +-- T7.2 Offline verification feature guide: complete in 22300c9
|   +-- T7.3 Focused checks and full local gates: passed
+-- E5 Acceptance: T4 complete, independent exact-patch verdicts accepted
|   +-- T8 E2E tier-order correction and scoped recheck: complete
+-- E6 Delivery: T5 complete, #14/#15/#16 merged to master
```

Dependencies: T1 and T2 precede T3. T6 precedes T7. T7.1 precedes T7.2 and T7.3. T3 plus T7 complete before T4. T5 may open frozen PRs to overlap hosted CI with T4, but each T5 merge requires that slice's independent verdict and current-head CI. No additional upstream/package research is required absent a new unresolved fact.

Delivery boundaries: PR A is `e5094ab..e477eea`, existing-status verification, 26 additions and one deletion. PR B is `e477eea..d216973`, the coherent catalog/spec/docs unit with its behavioral tests, 429 additions and 103 deletions under the recorded size exception. PR C is `d216973..22300c9`, stronger offline preservation evidence and its guide, 193 additions. The third slice keeps the existing catalog exception unchanged. Do not split matching behavior and contracts or add unlimited scope under the old exception.

Verification: use existing dependencies, a fail-closed fake Pi, disposable state and minimal child environments. Run focused Node tests, `npm test`, telemetry-disabled spec validation, diff checks and documented isolated status/help/version drives. No application build script exists. Ruby/Jekyll compilation and live extension behavior are excluded, not passed. Each PR requires an independent exact-patch verdict and current-head hosted CI before merge.

## Log

### L1. Original request

"research, explore current list of packages, verify and check against official docs, categorize/classify by features/functions, dedup, compact to lean packages, build and update verification skills/tools, build and verify, with swarm, arena, interrogate, new stacked prs, ship the the stack"

### L2. Scope and decisions

- User selected "6 core: autonomy-first". Preserve core `subagents`, `pi-ask-user`, `pi-skillful`, `web-access`, `goal`, and `dynamic-workflows`; move the remaining former core entries to optional.
- Prior user correction: "forget about ruby or docs compiler, as we do not have source code". No Ruby/Jekyll toolchain or documentation compiler will be run.
- Current catalog baseline is `e5094ab0c2110f8c7bb0f4e9c434fe211005a493`. Prior audit history is the pre-existing untracked `odd/tasks/lazypi-extensions-audit.md`; preserve it.
- Capability swarm `0d5a2273-e5c5-43a1-a0d1-1c8e4918d950` found partial overlap but no established exact duplicate. Arena `2792dfa4-642b-4d7d-bf19-574962df05af` compared aggressive and conservative plans; cross-judge `dd301856-ca5f-4eeb-b200-47d87a965099` recommended the aggressive plan's evidence and the conservative plan's state-preservation checks. The user chose the intermediate autonomy-first option.
- An arena worker read a Ponytail skill file under another harness when given a mistaken path. This exceeded the permitted scope; user was informed. Do not inspect that harness again.
- Prior registration-only probes are not functional equivalence proof. Package count is a selection-footprint proxy, not a measured disk, performance or resource saving.
- No `.atl/skill-registry.md` or Engram tool was available. Exact skills were injected directly; Engram mirror pending.
- Estimated authored change exceeds 400 lines including complete OpenSpec requirement copies and tests. Use a verification slice followed by a coherent catalog/spec/docs slice; keep each independently verifiable. Existing public behavior and stored user state are high risk.

### L3. Existing-state verification

- Commit `e477eea` adds a real `status` fixture with a pinned BTW source, legacy Memory source, and unrelated package, and verifies settings bytes do not change. The verification skill now documents the same isolated fixture.
- The behavior already existed, so no meaningful RED was expected for this baseline-protection test. Focused tests passed (7); `npm test` passed (75); `npm run spec:validate` passed (37 archived changes); `git diff --check` passed. The skill's real isolated status drive exited 0, displayed all three sources, and left settings unchanged; evidence `/tmp/tmp.DXmx8WYqwF`.

### L4. Six-package default

- Added a public CLI regression before changing the catalog: it failed with `Selected: 12/18` and showed migration of an existing legacy BTW registration. After the change, default and explicit core selection install the six selected sources and preserve unselected pinned/legacy and external registrations; optional selection and individual FFF selection remain available.
- Updated the catalog, help, package pages, landing page, FAQ, project instructions and active OpenSpec. Archived the two prior completed OpenSpec changes without changing their content, then added a complete four-requirement delta. Offline archive rehearsal applied the prior changes and new delta and matched each current active requirement; evidence `/tmp/lazypi-lean-archive.Oi0uRK/archive.log`.
- Focused tests passed (37), full tests passed (80), spec validation passed (39 archived changes), and diff check passed. Invalid selector probes for status/update/doctor/remove retained exit 2 and identical output except for intentionally changed category help; scratch settings hash stayed unchanged.
- The staged coherent catalog slice is 532 changed lines, including 209 mechanically generated complete OpenSpec delta lines. A separate verification slice is commit `e477eea`. The user selected "Allow size exception" for the oversized catalog PR because splitting its behavior, tests, docs and contract would produce an inconsistent intermediate state.
- Next: re-run checks after the final test changes, independently verify the exact patch and full feature, then ship only when current-head gates pass.

### L5. Current-session pickup and authorization

- Original current request, verbatim: "review and explore active worktrees, pick up session, recursive plan into epics/issues graph, update verification skills/tools, build and verify, with swarm, arena, interrogate, new stacked prs, ship the stack then".
- The user selected "Resume through verified stack delivery", authorizing inspection of `/tmp/lazypi-delivery.u2Oa2s` and the existing gh session over HTTPS only for `tommy-ca/LazyPi` issue operations, feature-branch pushes, stacked PRs and independently verified current-head-green merges. No force-push, npm publication or deployment.
- GitHub reports issues disabled. The user selected "Keep the graph in the feature document". No repository setting change or issue creation will be attempted. Later user instruction, verbatim: "Review the delivered subagent output and continue."
- Pickup swarm tasks `mw3ejfpx-1-jj7d` and `mw3ejfq2-2-e9ri` returned. Root HEAD is `e477eea`; the catalog slice has 429 staged additions and 103 staged deletions, with no tracked unstaged changes at pickup. The clean historical sibling is at `aa7bab1` and has no node_modules. Do not restart its already merged delivery. Both untracked task records are preserved.
- Root cwd has live Pi processes, including the current orchestration. No coordinating peer was advertised for this root; cwd alone does not establish a separate writer. Only the parent owns Git, and subsequent workers receive narrow edit surfaces.
- Fresh authorized GitHub reads report master at `e5094ab0c2110f8c7bb0f4e9c434fe211005a493` and unrelated open PR #10. Do not touch that PR. Origin CLI is absent, so use gh. Existing hosted CI is part of PR gates; do not substitute local package-install probes.
- Static inspection confirms unchanged package sources and aliases. Existing core-install tests only record Pi calls; add bounded stateful-fake evidence for resulting registrations and preserved object metadata/data in global and project scope. Account for intentional subagent override writes rather than demanding unchanged whole settings bytes after installation.
- Continuation arena candidates `mw3epwai-3-cjq4` and `mw3epwak-4-n0j3` converged on no production rewrite and a focused stateful test plus verification guide. Base B preserves the main driver's safety prohibition and adds a dedicated feature page; cross-judge `mw3etbg7-5-67bf` agreed. Retain shared exact-output and opposite-scope checks, require fail-closed executable lookup, reject unnecessary edits to the main driver, and measure the final size. Both candidates were read in full. No model diversity is claimed because the runtime provides no per-call model selector.
- Throughput checkpoint: reuse the completed research and committed verification unit, one bounded evidence writer, then parallel read-only reviewers of the frozen final candidate. Local checks use existing dependencies only. All previously recorded GREEN results remain historical until rerun. Engram is now available; mirror this reconciled document before the next source write.

### L6. Bounded evidence and frozen delivery units

- Writer `mw3exji3-6-6nqa` changed only `test/agent-dir.test.mjs`, `.agents/skills/verify/features/README.md` and the new `install-orchestration.md` feature page. The existing manual driver's installation prohibition and production logic were untouched. The data shape is ordered string/source-object registrations plus unrelated configuration and explicit intended subagent overrides.
- RED against the pre-change CLI `e5094ab` exited 1 with both new tests failing on expected `Selected:          6/18` versus actual `Selected:          12/18`. GREEN against the catalog passed both scope tests. Writer focused tests passed 34, full suite passed 82, telemetry-disabled spec validation passed 9 active items and 39 archived changes, and diff checks passed. No command timed out. Evidence and baseline scratch remain in `/tmp/lazypi-arena-b-red.utYczf` for parent-managed cleanup.
- Parent inspected all allowed changes and reran the guide's exact focused command: both new tests passed, exit 0, with no failures/skips. Parent also observed tracked/staged whitespace checks pass. These are fake-Pi orchestration proofs, not live Pi or extension execution. The new POSIX launcher tests skip Windows.
- Preserved the original staged index as catalog commit `d21697311e6565cdf7516ff18e43facf0d22601c`, then committed the additional three-file evidence unit as `22300c9f68664efd401cb0df456c8fd235d50a6b`. No inherited staged change was dropped. Both local task records remain untracked and are not delivery candidates.
- One honest slicing pass chose three independently coherent PRs rather than increasing the old catalog exception. Parent owns Git. New delivery branch names are `test/existing-registration-preservation`, `feat/autonomy-core-catalog` and `test/stateful-core-preservation`. Hosted CI runs the repository's existing package installation/e2e workflow on disposable GitHub runners; local installation probes remain forbidden.
- Independent PR A verifier `mw3ezt7v-7-qfdw` returned PASS for base `e5094ab`, head `e477eea`, stable patch-id `c9707f91b208b6e55ef2309ee641f75247ffa028`. Focused 7, suite 75, spec 10 active and 37 archived passed. Real isolated version/empty-status/existing-status matched baseline stdout/stderr and preserved settings bytes. Evidence is `/tmp/gpxfvjsC/gayXBQMB/tmp.lBQ3DGcJgD/evidence/`. Its observed root changes were the authorized concurrent writer, not verifier mutations.
- PR B stable patch-id is `baecb448cc3895c81acdddf02fe8b977766730fc`; C is `70c517b50a04a73d743fe8bc1b8b8e42c1d607fc`. Interrogate judges `mw3f6yn9-8-tfju` and `mw3f6ynb-9-4luu` independently review exact B; C verifier is `mw3f6ync-a-4bhb`. Verdicts pending. No model diversity is claimed without observed model identities.
- Initial native assessments at root were unassessable because the task records were undeclared untracked files. Read-only inspect excluded these records and created no lineage. An exact-slice assessment in registered `.worktrees/review/catalog-autonomy` at B, base `e477eea`, succeeded: native risk medium, `reviewDue: false`, reason `under_budget`. Contract-risk escalation still requires independent verification; no native receipt, approval or consumption is claimed. No review START was run.
- Remote push/PR creation used only the approved gh HTTPS credential helper and the three named refs. Created PR A https://github.com/tommy-ca/LazyPi/pull/14, B https://github.com/tommy-ca/LazyPi/pull/15, and C https://github.com/tommy-ca/LazyPi/pull/16, each based on its immediate parent. Current-head hosted runs are `42013743547`, `42013749679` and `42013753462`; all were in progress at the first snapshot. Nothing is armed or merged. No npm publication, deployment, force-push, repository setting change, unrelated PR change or historical-worktree cleanup occurred.
- C verifier `mw3f6ync-a-4bhb` returned PASS+NOTES for the exact recorded patch. Guide command passed both scope tests, focused tests passed 21, full suite passed 82, spec validation and whitespace checks passed. Independent fixture probes verified rejected Pi/npm/which commands and unchanged settings, valid append behavior and duplicate-install idempotence. C changes no production bytes. Notes are POSIX-only fixture coverage and no live-extension proof. Scratch/evidence are `/tmp/lazypi-C-verify.iVEAlJsR`.
- Both strict-JSON interrogate judges returned `{"rows": []}`. These are empty finding sets, not usable functional-check reports or observed model identities. Do not invent command results from them. Dedicated B functional verifier `mw3fcmty-b-l8u1` was assigned the required independent exact-patch checks separately. A/C verdicts were posted on their PRs.

### L7. Independent proof, first merge and hosted correction

- B's focused tests passed 32, full suite 80, active spec 9 plus 39 archived and diff checks passed, but its first standalone differential command failed at shell parsing before execution with exit 2 and `syntax error near unexpected token '('`. No product defect was reproduced. Delivery paused without an automatic retry.
- The user selected "Authorize one corrected missing probe". Follow-up `mw3fkle0-c-f622` executed that missing probe once, with no suite reruns. It returned PASS+NOTES: rejected-selector/version/help and empty/existing-state comparisons matched except for literal expected category/help/count changes, and global/project settings hashes were unchanged after every invocation. Original failure remains recorded.
- PR #14's current-head hosted run passed. Fresh head/base/patch-id/mergeability matched its independent verdict, then it was merge-committed as `efbb6145d7b03eca4c943ed866b17581b7dba7cd`. GitHub confirmed MERGED. Merge commits preserve reviewed commit identities without rebasing, force-pushing or synchronizing trunk into feature branches.
- PR #15 was retargeted to master after #14 merged. Its patch-id remained `baecb448cc3895c81acdddf02fe8b977766730fc`, but hosted run `42013749679` failed. The merge command was not reached. PR #16 remains open and unarmed.
- The hosted failure is at `scripts/e2e-install.mjs:77`: Stage 1 successfully installed the six core packages; Stage 1.5 installed optional entries, then compared the appended core-plus-optional registrations against raw catalog order. Category demotion interleaves the catalog, exposing the outdated E2E assumption. The idempotent-rerun assertion repeats the same assumption. Correct both expected sequences without changing CLI behavior or weakening order checks.
- T8 is one bounded source correction with its own commit and targeted independent recheck. The existing hosted E2E assertion is observed RED. Local live installation remains forbidden, so use structural/ordinary local gates and require the corrected real hosted E2E to pass before merge. Do not rerun failed CI unchanged.
- Writer RED and PR #16 proof were preserved under `.atl/evidence/lean-autonomy-catalog/writer-red` and `pr16`; B proof, including the corrected probe, is under `pr15`. Parent removed only the three reported scratch roots after copying evidence. PR #14's child-managed temporary directory was already unavailable when checked; its returned verifier report remains in the session record. Do not claim those raw files remain on disk.

### L8. Bounded E2E source correction

- Corrected only `scripts/e2e-install.mjs`: derive optional sources once, retain their count, and expect `fullSources = [...coreSources, ...optionalSources]` in both full-catalog assertions. Removed the unused raw-catalog helper import. No sorting, membership weakening, production change or new dependency was introduced.
- Parent observed `node --check`, the existing E2E-harness unit test, full 80-test suite, spec 9 active plus 39 archived, and diff checks pass in the registered B review worktree. The real local installation harness remains excluded; actual hosted RED is the failure reproduction, and fresh hosted GREEN is still required.
- Correction commit is `d302c7674d278b5a16ba816eddfd2447db45bb73`, five insertions and four deletions above `d216973`. New B patch-id is `e8c63ed23aea5ab81ad980a881f11f38cf6129c1`. C inherited the feature-parent correction via normal merge `606eb1d56ea1941b9a4c3eac7817e314f6894fe4`; its own patch-id remains `70c517b50a04a73d743fe8bc1b8b8e42c1d607fc`. No force-push, rebase or trunk-into-feature synchronization.
- Updated B native assessment succeeded with nativeRisk medium and `reviewDue: false`. Risk item 5 requires a separate correction recheck. Verifier follow-up `mw3fu5p9-d-2w9i` inspects only the corroborated ordering correction and carries forward the prior unchanged-production proof; no new full sweep or differential rerun is requested.
- Fast-forward pushes of only B/C were launched with the approved HTTPS gh helper. Job 9 waits for the new exact-B-head hosted test run and then watches it to completion. Existing failed CI is not rerun unchanged. PR #15 and #16 remain open and unarmed pending correction acceptance and current-head gates.

### L9. Correction acceptance and completed stack delivery

- The scoped verifier confirmed the exact one-file correction, unchanged production CLI bytes, successful syntax check and focused E2E-harness check. Its order instrument then failed because `assert.deepStrictEqual` compared arrays from different VM realms. It returned FAIL without retry, and no merge followed from that incomplete proof.
- The user selected "Correct the verifier comparison once". Follow-up `mw3g0zp7-e-t8jd` performed only the explicitly authorized instrument correction and unfinished probe once. Exit 0, empty stderr: both actual stage assertions accepted literal core-then-optional order and rejected interleaving, omissions, duplicates, reversals and source substitutions. No product bytes changed or completed suites were repeated. Updated B received independent PASS+NOTES. The original shell and realm-instrument failures remain recorded, not rewritten as passes.
- Fresh exact-B-head hosted run `42015992132` passed, including the real packed-install E2E. PR #15's fresh head/base/patch-id/mergeability/checks matched, then GitHub confirmed MERGED at `cab485c97317e0d92cfde551b6af39a3a92fb8b6`.
- After confirming #15 merged, fetched master and proved its tree identical to reviewed B. Retargeted #16 to master; its own patch-id remained `70c517b50a04a73d743fe8bc1b8b8e42c1d607fc`. Exact head/base and mergeability matched, and its latest current-head pull-request run `42015993199` passed. An earlier duplicate run `42015992000` was cancelled and superseded. Fresh gates used the latest check per workflow/name, never a cancelled run as success. GitHub confirmed #16 MERGED at `a947acf2841dcdcef883f8b921646676f13c83a1`.
- Fetched final master and proved Git tree `9636d2b7b4d36d79b5b5674a710d43b8924a39c1` exactly equals verified C head `606eb1d56ea1941b9a4c3eac7817e314f6894fe4`. Final master push CI run `42017167544` is being observed by job 13; its result is pending at this log entry, not claimed passed.
- Preserved original and corrected correction-probe evidence under `.atl/evidence/lean-autonomy-catalog/pr15-correction`, then removed only `/tmp/lazypi-pr15-correction.EwToARS0`. Removed only the session-created catalog review worktree after checking it clean and merged. Root remains `audit/lean-autonomy-core` at `606eb1d`; the historical `/tmp/lazypi-delivery.u2Oa2s` remains unchanged at `aa7bab1`. Both local task records remain untracked and preserved.
- Remeasured the actual current catalog: 18 entries, six core (`subagents`, `pi-ask-user`, `pi-skillful`, `goal`, `web-access`, `dynamic-workflows`) and twelve optional. No source/alias deletion, npm publication, deployment, force-push, rebase, issues-setting change or unrelated PR #10 mutation occurred. Native review was not due; no review START, receipt, approval or consumption is claimed.
- Verification limits remain explicit: local fake-Pi proofs do not establish live extension functionality; POSIX fixtures skip Windows; no local installation, dependency installation, Ruby/Jekyll or documentation-compiler build ran. Principles applied from the loaded skills: prove it works through public behavior, keep the context bounded, and preserve reviewable work units.

### L10. Final merged verification and closure

- Final master push run `42017167544` PASSED with exit 0, including unit tests, OpenSpec validation, packed artifact smoke test, default and optional installation, full-catalog assertion and real sandboxed packed-install E2E. Its head is the final merge `a947acf2841dcdcef883f8b921646676f13c83a1`, whose tree was independently compared to the reviewed C tree. No applicable required check remains pending or failing.
- Hosted CI reports Node.js 20 action-runtime deprecation and ubuntu-latest migration annotations. These are environment advisories, not failures; workflow/dependency modernization is outside this feature and was not attempted.
- All feature tasks T1-T8 are complete with evidence above. No further product or delivery work remains authorized for this feature. Both task records and ignored proof artifacts are retained; source working tree and index are unchanged. Do not infer npm release or deployment authorization from these merges.
