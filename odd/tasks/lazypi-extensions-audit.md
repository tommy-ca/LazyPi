# LazyPi extensions audit and verified stack

Objective: research, audit, and ship stacked PRs for the current catalog, verifying docs, catalog metadata, tests, and upstream alternatives. Current local snapshot: 18 entries, 12 core and 6 optional.
Branch: audit/extensions-doc-safety. Delivery: auto-chain, stacked-to-master. Runner: node --test, npm test, npm run spec:validate.

## Specs

- S1. Audit every catalog extension for catalog/docs/test alignment with upstream.
- S2. Research alternatives for each extension; migrate if a clearly better option exists (install-first).
- S3. Update verification skills/tools and run build+verify.
- S4. Use swarm, arena, interrogate; deliver stacked PRs and ship.

## Tasks

- T1 [S1] Read-only catalog audit; inline synthesis and delegated swarm; reports received but upstream evidence requires verification because child runs failed on unavailable configured tools; pending.
- T2 [S2] Remediation arena; delegated plan candidates and cross-judge completed; candidate B selected with candidate A's smaller local-docs slice; pending synthesis and verification.
- T3 [S1,S3] Correct locally established safety and catalog-count documentation; inline; complete in `e65f242`; risk: none.
- T4 [S1,S2,S3] Verify upstream claims, alternatives, compatibility and verification tools; inline or delegated as warranted; in progress; CLI verify skill in `ab19323`, upstream guidance in `44ee39d`; extension behavior and alternatives remain pending.
- T5 [S3,S4] Interrogate patches, independently verify high-risk slices, and deliver stacked PRs; initial stack merged; follow-up pending.
- T6 [S1,S3,S4] Correct independently confirmed active spec, catalog summary, CLI help and Verdict safety-copy drift; inline; commit `e6c67ed` merged as `e5094ab` via PR #13; risk items 2 and 3 (security guidance and shared CLI/catalog contract).

## Log

### L1. Original request

"research, explore, review and audit all the extensions for lazypi, ... with swarm, arena, interrogate, new stacked prs, ship the stack then"

### L2. Pickup and evidence

- User selected the extensions audit and authorized anonymous HTTPS reads of public npm metadata and linked public upstream repositories. Prior recorded GitHub delivery authorization is limited to `tommy-ca/LazyPi` using the existing gh session over HTTPS; no npm publication is authorized.
- The pre-existing untracked task record described 17 packages; the current catalog contains 18. Preserve this record and its original log.
- Swarm `990060c6-c255-40dd-8ff8-8b0a79f3e37f` returned four reports but each child was marked failed because configured `codegraph` and `web_enable` tools were unavailable. Treat upstream claims as leads until independently verified.
- Arena `05e4c70f-bf18-4d6e-941a-7a22ebdf9d96` compared two read-only plans. Cross-judge `eaad582a-7fcf-4cb0-bd90-df2f6b872275` selected candidate B, with candidate A's combined local documentation slice and differential-check guidance. No distinct model-family coverage is claimed without runtime evidence.
- Engram tools are unavailable; the mirror is pending. Estimated delivery exceeds 400 authored lines; auto-chain uses stacked-to-master per prior recorded choice.

### L3. Local documentation slice

- Commit `e65f242` corrects catalog counts, removes unsupported Simplify safety guarantees, and distinguishes legacy package registration from memory content conversion. It does not change installer behavior.
- The catalog documentation test failed before the corrections and passed afterward. Final focused test: 7 passed; `npm test`: 72 passed; `npm run spec:validate`: 37 passed; `git diff --check`: passed. No Jekyll build was run.
- Jekyll build was not run. Next: validate upstream claims and inspect verification tools before planning further changes.

### L4. Upstream and verification-tool evidence

- Independently read public upstream documentation for memory, BTW, and Verdict. Memory lists two companion packages and a configured balanced model; BTW says its side model does not execute tools; Verdict says it does not guard manual `!` shell escapes. These describe retrieved upstream documentation, not verified installed versions.
- Read-only verification-tool scout `78c301fe-f8ee-4db5-98b4-34e419b8d117` found no project-local verify skill and no reusable offline driver for actual extension behavior. Existing E2E installs packages over the network and does not prove extension functionality. It inherits environment and is not safe to treat as an isolated offline check.
- A real `status` CLI drive with an empty temporary settings file and a minimal environment returned exit 0 and `Installed from LazyPi catalog (0/18)`. Evidence remains at `/tmp/tmp.gdeFgLlyum/status.txt`. This proves only the isolated status path, not extension execution.
- Project-local CLI verification skill committed in `ab19323` on `audit/extensions-verify-skill`, stacked on `e65f242`. It covers isolated help/version and empty status only; extension execution and installation remain unverified.
- Initial skill review identified an unsafe install no-op check and evidence overwriting. The check was removed and evidence capture corrected. Scoped recheck `ea9128a6-44e1-4544-9c82-4ff42bf0615f` resolved all three findings.
- Re-ran the corrected skill's doctor and status drive with temporary settings, confirmed settings unchanged and evidence retained at `/tmp/tmp.wz9YgXkuhO`. `npm test` passed 72 tests, spec validation passed 37 items, and `git diff --check` passed. No live extension session was run.

### L5. Upstream guidance slice

- Commit `44ee39d` corrects BTW commands and tool-access guidance, documents Memory prerequisites and its repository, corrects the package index, and clarifies Verdict's shell-escape boundary and status command. Evidence: npm metadata plus the linked upstream READMEs; immutable Memory and Verdict release commits were inspected. BTW registry documentation is current but not pinned to a source commit.
- Independent verifier `bbd30593-b4f9-41a5-ae16-87d27db184b1` passed the slice with two advisories. Both were corrected and rechecked in `f38108c1-1636-4a09-84a6-f48f2980961c`; final verdict pass. Parent and verifier observed focused tests (7 passed), full tests (72 passed), and spec validation (37 archived changes plus 9 current items). No extension execution was verified. Risk item 2: security guidance.

### L6. Extension interface guidance

- Commit `c063110` refreshes web-access tool names, Ponytail's default debt marker and review scope, and the subagents builtin roster. Claims were checked against release-commit READMEs: web-access `4af1a7f7757d450ba0afefe2d98737384dc9a9b4`, Ponytail `7801d061243d7b753bad0e0b3c057cd250b11755`, and subagents `0398b9e8d6f03dc6054dbf13dfe851c7a20bff3a`. Floating installs and older versions may differ. Installer override behavior was not changed.
- Focused docs tests passed (7), full tests passed (72), spec validation passed (37 archived changes), and diff check passed. The docs were structurally read back; no live extension behavior or Jekyll build is claimed. Risk: passive documentation.

### L7. Extension safety guidance

- Commit `45cd3b5` documents autoresearch's executable scripts and Git changes, interactive-shell's optional Jev privacy boundary, workflow isolation limits, and Skillful visibility limits. Parent checked release-commit upstream READMEs.
- Independent verifier `60ed720d-883d-487c-8c67-c171fe74f158` passed the first three pages and `f6d28bdb-2803-49ff-9d16-b75ee5a0fb8d` passed Skillful after the exact authorized URL was supplied. Parent and verifier observed focused tests (7 passed), full tests (72 passed), and spec validation (37 archived changes plus 9 current items). No extension execution or site build was verified. Risk item 2: security guidance.

### L8. Compatibility guidance

- Commit `ae3b8b2` distinguishes LazyPi's Node requirement from current extension requirements, clarifies subagent model precedence, describes LSP server requirements and permissions, and fixes Goal's configuration path and nesting. Node metadata does not establish a runtime failure; no support floor or installer behavior was changed.
- Independent verifier `a74b8b25-27b2-484c-a35a-10b854ff42ff` passed with a Goal-path advisory, corrected and rechecked in `e94afc07-e4c3-4c48-8a37-eddfe6579efe`. Parent and verifier observed focused tests (7 passed), full tests (72 passed), and spec validation (37 archived changes plus 9 current items). No extension execution or site build was verified. Risk item 2: language-server process permissions guidance.
- User authorized anonymous HTTPS reads of public npm metadata and linked public repositories for candidate alternatives. Swarm `b561849c-d4ee-4b43-845b-fb67afed4215` produced per-entry alternatives reports for the current catalog. No clearly superior replacement was established; bounded search encountered registry rate limiting and no candidate was executed. Reports are under the workflow's `alternatives/` artifacts; do not treat this as exhaustive market coverage.
- `bwrap --unshare-net` basic availability probe returned exit 0. A later unsandboxed `pi --help` invocation loaded extensions from the user's normal Pi configuration and emitted loader warnings; this was not an isolated verification and may have read ambient Pi configuration. No credential access is claimed or ruled out from that output. Future Pi probes must use an empty environment, isolated agent directory, and enforced filesystem/network isolation.
- Read-only scout `dc95b46f-6884-418f-95e1-90dcb380ec8c` mapped a possible offline RPC registration probe using a fresh Pi process and an empty-root bubblewrap namespace. The required runtime/dependency mount closure, no-auth startup, isolation effectiveness, and explicit extension loading remain untested. Registration alone would not prove behavior. No package execution is authorized by the earlier public-read permission.
- Interrogate review `8094cbc3-c0a2-499c-8aa2-e116d10c1f60` failed before either review: `opencode-go/deepseek-flash:max` was unavailable and `opencode-go/glm-5.3-flash:max` hit a 429 usage limit. Fallback `bc3e464f-d0d9-4ba9-af97-6d49a1514f15` produced one review; the other model failed. No diverse-model verdict is claimed.
- The reviewer found stale catalog counts and package summaries, an obsolete Memory link, weak documentation checks, and misleading doctor terminology. The first correction and recheck found another stale total count. A second correction updated overview, first steps, and FAQ; the second recheck `cd1a919c-55b8-4301-ac9f-1505dfd533b9` found the same count-alignment blocker still open at `docs/index.html:23` ("why 5 are optional"). The correction bound is exhausted. Current review fixes are uncommitted on `audit/extensions-review-fixes`. Last parent checks after the second correction: focused 7 passed, full 72 passed, spec validation 37 archived passed, diff check passed.

### L9. User-authorized correction

- User said "resume" after the correction bound was exhausted. Corrected the remaining stale optional count in `docs/docs/index.html:23` (the recheck had named the wrong path) and added a regression assertion. The reviewer scoped recheck `904b19cc-044f-49c1-badf-789835d436a6` reports the blocker resolved and focused tests 7/7 passed.
- Commit `5b370c3` contains the catalog page and skill terminology corrections. Parent checks: focused 7 passed, full 72 passed, spec validation 37 archived passed, `git diff --check` passed. No Jekyll build or live extension execution was performed. Diverse-model interrogate remains unavailable; one completed reviewer did find issues and its scoped rechecks resolved them.

### L10. Delivery regrouping

- Independent per-slice workflow `f2a44a30-0307-4a28-88dd-57309346d4d0` found the original bottom slice incomplete because it left stale catalog pages until the top slice, and found Verdict's existing blanket tool-call claim unsafe. The remaining slices returned PASS+NOTES. All seven temporary verifier directories were removed by the parent.
- Corrected Verdict's documented `ignoreTools` exemptions in `b54a941`; scoped verifier `8c00c2d1-f310-4bec-ba10-da0590fe2ed5` confirmed the original security blocker resolved. Parent checks passed: focused 7, full 72, spec 37 archived, diff check.
- Regrouped without rewriting or deleting the original branches: delivery PR 1 is `21204bf..4f1f1e9` (all coherent catalog and extension documentation with its tests); delivery PR 2 is `4f1f1e9..75e1599` (isolated CLI verification skill). The final delivery tree exactly matches `b54a941`. Worktree `/tmp/lazypi-delivery.u2Oa2s` is parent-owned and contains an untracked dependency symlink for checks. Parent observed focused 7, full 72, spec 37 archived for PR 1. Each regrouped PR still requires an independent exact-patch verdict and current-head CI.

### L11. Regrouped stack opened

- Independent exact-patch workflow `06e0ac86-c397-49d0-8132-0b4ee3da1c87` returned PASS+NOTES for both slices: docs base `21204bf`, head `4f1f1e9`, patch-id `dc3a992788961932c0ed08e9984598970a97c566`; verification skill base `4f1f1e9`, head `75e1599`, patch-id `4b727f6d61374f102ebf0b773e77e3c00398e985`. Both used isolated snapshots and observed focused 7, full 72, spec 37 archived; no site build or live extension session.
- GitHub forge is gh (Origin CLI absent); remote master matched `21204bf`. Existing unrelated PR #10 was left alone. Pushed only the two delivery branches over explicitly authorized HTTPS with the existing gh session. PR #11 is https://github.com/tommy-ca/LazyPi/pull/11; PR #12 is https://github.com/tommy-ca/LazyPi/pull/12, based on PR #11. Independent verdict comments were posted. Both PRs were open, non-draft, mergeable, and test checks were in progress at their exact verified heads.

### L12. First PR merged

- PR #11 exact head `4f1f1e9` passed GitHub test run `41824695038`; base `21204bf`, patch-id and mergeability matched the independent verdict. Squash-merged as `c632618c6063ab8f113e3a1d992842d50d4a0ecf`; GitHub confirmed MERGED.
- PR #12 incorporated the new master via a normal merge commit, without force-push, and was retargeted to master. New head `aa7bab1df1d7b3fd2e81154dd558ff5143f71a7d`, base `c632618c6063ab8f113e3a1d992842d50d4a0ecf`, patch-id unchanged at `4b727f6d61374f102ebf0b773e77e3c00398e985`. The independent verdict remains applicable to the same patch; GitHub test run `41825222627` is pending. No merge is armed.

### L13. Second PR merged

- PR #12 current head `aa7bab1df1d7b3fd2e81154dd558ff5143f71a7d` passed GitHub test run `41825222627`; base `c632618c6063ab8f113e3a1d992842d50d4a0ecf`, patch-id `4b727f6d61374f102ebf0b773e77e3c00398e985`, and mergeability matched the independent verdict. Squash-merged as `cca6a3bba8e704f4c0a0ed615d46ef8d747e2878`; GitHub confirmed MERGED. No force-push or npm publication was performed.
- Both delivery PRs are merged. Broader live extension proof, a Jekyll build, complete runtime compatibility proof, and diverse-model interrogate remain unverified. The CLI verify skill is deliberately limited to non-mutating local CLI paths. Existing unrelated PR #10 was not touched. Parent-owned worktree `/tmp/lazypi-delivery.u2Oa2s` remains; no cleanup of Git worktrees was authorized.

### L14. Authorized offline extension probe

- User said "resume" and authorized execution of locally cached catalog extensions only inside a validated offline sandbox with an empty Pi configuration and no credentials. No package installation or remote execution is authorized by that choice.
- A bubblewrap empty-root probe with network, PID, IPC and UTS namespaces verified that the real home and host `/run` were absent, the empty agent directory had no auth file, and the isolated network namespace had no routes or Unix sockets. Pi 1.5.0 started offline in RPC mode with no discovered extensions and returned an empty command list.
- Cached `pi-interactive-shell` 0.15.1 initially failed to load because `zigpty` was absent from the mount whitelist. After read-only mounts of its specific cached dependencies, a fresh isolated process returned the `spawn`, `attach`, and `dismiss` commands from the explicit extension path; baseline returned no commands. No subprocess was launched. Evidence is `/tmp/lazypi-offline.cJOpPZ`. Registration is not proof of full behavior.
- Cached copies are older than the latest registry releases audited (for example interactive-shell 0.15.1 versus 0.18.0). An isolated pi-ask-user startup returned an empty command list, which does not establish tool registration. No current-version runtime claim is made.

### L15. Multi-model review follow-up

- Interrogate `f1d92ce2-c2d4-44b4-a842-3158452be560` completed with configured fallback seats Sol and Luna. Sol found the overview omits Verdict from the optional-package description and flagged unqualified fail-closed summaries. Luna found stale active installer-spec counts and memory/todo sources, an omitted CLI-help package, stale project instructions, and test gaps. Findings are being reconciled against source; neither reviewer ran live extensions or used remote access.
- Active `openspec/specs/lazypi/installer/spec.md` independently confirms 17/5 and old optional sources despite a current 18/6 catalog. Read-only mapper `65d2910f-986b-4cc9-9acf-0837d78f0beb` identified stale catalog, selector, source and documentation requirements and confirmed missing migration deltas for current memory/todo sources. Preserve historical archived specs. Add a focused contract-drift check and an OpenSpec delta.
- Cached offline startup probes additionally established command registration for `pi-skillful` 0.4.0 (`skillful`), `pi-autoresearch` 1.6.2 (`autoresearch`), and `pi-subagents` 0.58.0 (`subagents`). The cached `pi-web-access` 0.26.0 failed to start because its transitive `htmlparser2` dependency was not mounted; this does not establish a package defect. No commands or model calls were executed. All results remain version-specific registration evidence only.
- T6 started on `audit/extensions-contract-followup` from merged master. Added tests first and observed three failing checks for stale spec, missing Verdict help, and incomplete overview; corrected catalog counts/sources, security wording, help and docs, and added a new OpenSpec delta. Focused tests 11 passed, full suite 73 passed, spec validation 37 archived changes passed, diff check passed. LSP reported unavailable default servers and did not provide a diagnostics pass.
- Differential status and version outputs matched the base. For status, update, doctor, and remove with `--only verdict`, both versions exited 2 and output matched except the intentionally corrected shared help line. Scratch `/tmp/lazypi-contract-diff.9xc0Be` is retained pending cleanup.
- Independent verifier `fea6aa35-713c-48e5-8bd3-36d9f8ae321e` found the initial OpenSpec delta incomplete because it only added a requirement. Corrected it to include all three complete MODIFIED requirements and added a regression test; scratch mutation observed RED against the incomplete delta and GREEN against the correction. Scoped independent recheck `0050a233-5763-4c66-b28b-d5a892cb63c2` reconstructed the active spec from baseline plus delta and resolved the blocker. Parent and verifier observed focused 12 passed, full 74 passed, and spec validation 10 current and 37 archived passed. No OpenSpec archive operation or live current-version extension execution was run.
- T6 committed as `e6c67ed` (373 authored changed lines, including complete OpenSpec requirements). Exact-commit verifier `3a5809f9-0581-4398-bcfc-3af8125da432` returned PASS+NOTES for base `cca6a3b`, head `e6c67ed`, patch-id `bc9247ef6b3a31df2f881a14a664b0642586a342`; all committed files matched the verified candidate. OpenSpec archive, current-version extension execution, and Jekyll build remain unverified.
- Opened https://github.com/tommy-ca/LazyPi/pull/13 against master using authorized HTTPS and posted the independent verdict. The check-registration monitor timed out without an event; a subsequent GitHub read found current-head test run `41883376624` succeeded. Base `cca6a3b`, head `e6c67ed`, stable patch-id `bc9247ef6b3a31df2f881a14a664b0642586a342`, and mergeability matched the independent verdict. Squash-merged as `e5094ab0c2110f8c7bb0f4e9c434fe211005a493`; GitHub confirmed MERGED. No force-push or npm publication occurred.
- Remaining proof at merge: current published extension versions were not executed; the Jekyll build was unavailable; the OpenSpec archive operation was not run. Cached offline probes initially established command registration for four older versions, not full behavior. Existing unrelated PR #10 remains untouched.

### L16. Resumed offline verification

- User said "resume". Ruby, Bundler and Jekyll are not available on PATH; the site build remains unavailable without installing a toolchain.
- An initial `openspec archive` check succeeded in `/tmp/lazypi-archive-check.Sago9O`, but it ran without network isolation or an explicit telemetry opt-out. OpenSpec reported anonymous telemetry was enabled; whether it sent telemetry is unknown. No credentials were supplied. Future archive checks must disable telemetry and isolate networking.
- Repeated archive from the actual baseline specification with `OPENSPEC_TELEMETRY=0` in an empty-environment, network-isolated bubblewrap sandbox. It exited 0 and applied one added and three modified requirements. The resulting three modified requirements matched the current active spec and the added reconciliation requirement was present. Evidence: `/tmp/lazypi-archive-offline.zjdg74/archive.log`. No workspace files or historical archived changes were modified.
- Re-ran cached `pi-web-access` 0.26.0 offline with its cached dependency closure mounted read-only; it exited 0 and registered `curator` from the explicit extension path. Together with earlier probes, five older cached packages have command-registration evidence only. No model calls, extension command handlers, package downloads, or installs occurred.
- User authorized anonymous HTTPS downloads of current npm tarballs and required dependencies from `registry.npmjs.org`, followed by non-destructive startup checks in the offline sandbox. The sandbox has not been established as a hostile-code security boundary.
- Downloaded current interactive-shell 0.18.0, verified its npm SHA-512, fetched two missing exact dependencies with verified SHA-512, and reused three cached matching direct dependencies. Offline Pi 1.5.0 registered `spawn`, `attach`, and `dismiss` from the explicit package path. No command handler or model call ran.
- Downloaded current releases with no declared runtime dependencies and verified each tarball SHA-512. Offline RPC checks attributed `context` to pi-context-usage 2.1.0, `simplify` to pi-simplify 0.2.3, `ponytail` to @dietrichgebert/ponytail 5.3.3, `autoresearch` to pi-autoresearch 1.9.0, and `automode` to pi-verdict 0.16.0. Pi-ask-user 0.17.2 started without errors but exposes no slash command in `get_commands`; its tool registration is unproven. Evidence and tarballs remain in `/tmp/lazypi-current-pkg.EcYCeR`.
- Downloaded and SHA-512-verified current Goal, BTW, LSP, Dynamic Workflows, Todos, Skillful, Subagents, Mention Skill, Memory and FFF tarballs and their required staged dependencies. Fresh offline RPC processes registered expected commands for Goal 0.54.15, BTW 0.63.4, LSP 0.49.12, Dynamic Workflows 3.15.0, Todos 2.15.0, Skillful 0.5.1, Subagents 0.84.0, Memory 10.2.1, and FFF 0.11.0. Mention Skill 0.11.0 started without errors but exposes no slash command; its mention behavior is unproven. FFF reused cached `ffi-rs` 1.3.7 and its Linux native dependency.
- Current web-access 0.46.0 started offline and registered `curator` using a verified SDK tarball plus a read-only cached dependency closure. Some SDK dependencies were absent from that closure, so this is startup/registration evidence only, not proof the SDK or web tools work. All direct package tarballs were integrity-checked.
- Aggregated evidence: 18 current package startups returned successful RPC responses; 16 expected slash commands were attributed to their explicit extension paths. For the other two, an offline Pi SDK probe with an in-memory session showed `ask_user` only when pi-ask-user 0.17.2 was explicitly loaded, and showed the `input` handler registered by @zigai/pi-mention-skill 0.11.0. These are registration checks, not execution of the tool or handler.
- No extension command handlers, model calls, npm lifecycle scripts, or npm installations ran. Some checks reused cached dependencies; pi-web-access's SDK dependency closure was not complete. Evidence remains in `/tmp/lazypi-current-pkg.EcYCeR`.
- User correction: "forget about ruby or docs compiler, as we do not have source code". Stop Ruby/Jekyll toolchain work; no toolchain or gem downloads were made. The site build is explicitly skipped, not passed.
