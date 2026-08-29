# Simplify the harness-extras integration (audit follow-up)

## Why

A simplification audit of the shipped harness-extras change (commit 7b31252)
was run with the pi-simplify doctrine (changed-lines clarity, preserve
function, no over-simplification) and the dsh-find-simplifications doctrine
(dead / duplicated / speculative / over-built / added-then-removed /
mirrored-fact surfaces, call-site proof, thin candidates rejected) on
2026-08-29. Six evidence-backed P2 findings, zero P0/P1. Three folds in
`bin/lazypi.mjs` + `scripts/`, one missed docs sweep that the archived
harness-extras proposal explicitly promised, one comment that contradicts
its own code, one enumeration grammar inconsistency.

## What Changes

1. `packageInstallStatus` — hoist the source-match query computed twice
   (`installed` and `present` each ran the identical
   `[...installedPiSources].some(...)`); one Set scan per call.
2. `cmdStatus` "others" filter — call the `isLegacySourceForPackage` helper
   instead of re-implementing its exact body inline, so matcher changes
   cannot drift between call sites (mirrored fact).
3. `scripts/e2e-install.mjs` — derive the three hardcoded `12` install-count
   assertions from `PACKAGES.length`; the archive proposal itself states the
   convention ("all other assertions already derive from PACKAGES") and the
   same file already derives the status header count. Completes the
   Self-Deriving CI contract for count assertions.
4. `docs/faq.html` + `docs/docs/first-steps.html` — extend the
   ten-package enumerations to the 12-package set (both were missed by the
   harness-extras count sweep; mirrored sentences in README and the docs
   overview were updated).
5. `bin/lazypi.mjs` `sourcesMatch` comment — drop the sentence "Git sources
   stay exact: pins are meaningful SHAs", which contradicts the matcher
   (pinned git sources match, per test `sourcesMatch("git:.../a/b",
   "git:.../a/b@abc123")` is true); keep the npm pin rationale.
6. `docs/docs/index.html` — fix the core-row enumeration grammar
   ("…, and FFF search, a workflow engine…, and ponytail discipline review")
   to match the README wording.

## Rejected thin candidates (recorded, per doctrine)

- New helper for the "others" filter: after finding 2 there is a single use
  — keep inline (YAGNI).
- "10 entries" mentions in `explorations/installed-others-audit.md`: dated
  audit snapshot whose own integration plan names 12 — intentional record,
  not stale.
- Archived change specs with ten-package wording: immutable by project rule.
- The two new package pages: template-conformant, no genuine bloat vs
  `subagents.html`.

## Spec delta

Installer spec, Self-Deriving CI: e2e count assertions SHALL derive from
`PACKAGES.length` (new scenario "Derived e2e counts").