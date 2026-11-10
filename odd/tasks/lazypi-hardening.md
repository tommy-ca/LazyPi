# LazyPi hardening: audit, verification layer, stacked delivery

Branch: chained PRs from `master`, first slice `fix/contract-authority`.
Delivery strategy: chained PR stack, landed bottom-up. Runner: `node --test`;
gates: `npm test` and `npm run spec:validate`.

## Specs

S1. "review and audit current project, with /skill:thermo-nuclear-code-quality-review and /skill:thermo-nuclear-review" — a full audited review of the repository using both methods, findings carrying their own reproduction.

S2. "update verification skills/tools," — the verification skill and its tools must cover the current CLI surface: `install`, `status`, `update`, `doctor`, `remove`, `--local`, and the documented flags.

S3. "build and verify," — build and verify the result. `npm test`, `npm run spec:validate`, and an isolated CLI proof must all pass.

S4. "recursive plan and update epics/issues graph," — a recursive plan and an updated epic/issue graph. Decided 2026-11-10: in-repo graph only, because GitHub issues are disabled on `tommy-ca/LazyPi`.

S5. "with swarm, arena, interrogate" — the audit must use a swarm fan-out, an arena bakeoff, and interrogate adversaries. Delivered: 4 code-quality reviewers, 2 adversaries, 3 arena candidates.

S6. "new stacked prs, ship the stack then" — deliver as new stacked pull requests and land the stack.

S7. (decision 2026-11-10) `pi` must resolve through the mise-managed harness; the accidental global install is removed.

## Tasks

- T1 Contract authority: kill the trap delta, archive the superseded one, re-point the contract test, add the delta-vs-PACKAGES gate — S1, S6 — done, 154190e.
- T2 Settings integrity and security: symlink refusal, control-character escaping, atomic write, collision-free backups, type validation, exit codes, version precedence, phantom auth providers, single interactivity policy — S1, S6 — delegated.
- T3 Subtraction and decomposition: delete the dead legacy subsystem and the identity wrapper, add the message-value output adapter, split `bin/catalog.mjs` and `bin/pi-host.mjs` — S1, S6 — pending.
- T4 Verification layer: feature docs for `doctor`/`update`/`remove`/`--local`, tier-aware assertion script, honest CI gates, `.atl` evidence outside the checkout — S2 — pending.
- T5 Documentation truth and the in-repo delivery graph — S4 — pending.
- T6 Land the stack — S6 — pending.

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
