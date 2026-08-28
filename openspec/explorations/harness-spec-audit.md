# Harness Spec Audit — Chasen Liao Pi harness (reconstructive spec)

Source: `https://gist.github.com/tommy-ca/d3f3af63c59f33899a09901bc94070c5` —
"Pi Coding Agent Harness — Formal Specification" (PI-HARNESS-CHASEN-2026-08),
itself a reconstruction of the X post by Chasen Liao (2026-08-27). This file is
the exploration/audit record; the normative contract lives in
`specs/harness/control-plane/spec.md`.

## Thesis

Pi is intentionally incomplete (read/write/edit/bash only). The operator
composes discipline, capability, and control plane. "Keep the core tiny. Put
discipline in AGENTS.md, capability in on-demand Skills, and control-plane in
Packages."

## Three layers (lifetimes + load cost)

| Layer | Changes | Context cost | Failure mode if overloaded |
| --- | --- | --- | --- |
| 1. AGENTS.md | Rarely | Resident every session | Contradictory rules, prompt bloat |
| 2. Skills | Weekly, 4–6 visible | Name+description only; body on demand | Wrong skill routed |
| 3. Packages | Pain-driven | Extension code + tool schemas | Routing noise, supply-chain risk |

Key loading contracts: AGENTS.md from `~/.pi/agent/` then ancestors then cwd
(`AGENTS.override.md` replaces per-directory); skill discovery precedence
`~/.pi/agent/skills/` → `~/.agents/skills/` → `.pi/skills/` → `.agents/skills/` →
package skills → `settings.json` `skills` → `--skill`.

## Normative coding loop

```
CONFIRM GOAL AND ACCEPTANCE → READ CODE AND RULES → APPLY MINIMAL DIFF
→ RUN MOST RELEVANT TESTS → INSPECT DIFF → [FRESH REVIEWER] → DONE IFF EVIDENCE
```

Stage contracts: Clarify (ask_user on underspecified target/create-vs-edit/
acceptance) → Scout (read-only recon) → Worker (single writer per directory) →
Fresh reviewers (read-only, parallel, never inheriting worker transcript) →
Parent aggregate. Parallelism rules: never identical-prompt fanout; one writer
per directory or managed worktrees; no pipeline for small tasks.

## Control plane (published set in the source post)

pi-subagents (substrate: scout/researcher/worker/reviewer/oracle/delegate +
workflowScript/runs.all/runs.run/fresh), pi-skillful (visibility, hide unused),
@eko24ive/pi-ask (ask gate; the LazyPi equivalent is pi-ask-user),
pi-simplify (recent-diff complexity), $ mention (pi-mention-skills /
@tunglam/pi-inline-skills), @tavily/pi-extension (web research; LazyPi
equivalent pi-web-access), @narumitw/pi-goal (long-objective gate:
goal_complete/goal_blocked/goal_wait), pi-context-usage (/context dot grid),
@narumitw/pi-btw (side thread, non-mutating), @ff-labs/pi-fff (Rust FFF index
replacing find/grep).

## Security posture (normative)

Extension RCE = packages run as user (review before install); prompt injection
= expected local-agent risk (trust is not a sandbox; containers for untrusted
trees); destructive shell unconstrained (AGENTS.md + operator attention);
multi-writer clobber (single-writer + worktrees); secret exfil via researcher
(keep research off the writer).

## Anti-patterns (adopted)

No checkbox todos (state/evidence over checkboxes); no dozens-of-skill
libraries all visible; no parallelizing one-file work; no reviewer inheriting
the worker transcript; no AGENTS.md-as-a-novel; no blind grep dumps into
context; no trusting project-local packages in untrusted clones.

## Gaps vs the LazyPi catalog (as of the simplify change)

The source harness runs ≈10 packages and explicitly omits checkbox todos;
LazyPi previously shipped 25 including a todo list, powerbar, plannotator,
slopchop, usage, raw-paste, autoresearch, and compound. The adopted gaps:
goal + context-usage replace todos/usage; fff and $ mention are deferred;
powerbar/plannotator/slopchop/raw-paste were dropped as non-essential UI.