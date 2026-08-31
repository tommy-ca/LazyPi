# Design: fork audit alignment

## Context

The CLI already implements the lean catalog. This change is a contract
repair plus the CI/docs copies that drifted with it. No new install path.

## Decisions

1. Pin `PACKAGES` in a unit test rather than parse the spec as a second
   catalog. The test lists the same ids, categories, and sources the spec
   names. Dropped ids must be absent. Windows YAML must contain
   `--only optional` before the full-catalog assert.
2. Keep `openspec validate` as the structure gate. The new test is the
   membership gate. Do not add `spec:validate` to GitHub Actions in this
   change; that is a separate ops decision.
3. Keep Catalog Model's "Skill arguments source" scenario. A MODIFIED
   requirement cannot drop scenarios; archive would refuse. The WHEN never
   fires because Dropped packages forbids the id.
4. Leave Search Tools on the installer spec. `fff` is cataloged core, and
   the scenarios describe the package's default mode, not a LazyPi code
   path.
5. Do not restore upstream compound, load-order, fat catalog, themes page,
   or CNAME. `PI_CODING_AGENT_DIR` is already in the fork.

## Risks

A future catalog add that updates `PACKAGES` and the pin test but skips
the spec delta will still fail AGENTS.md review. The pin makes that
visible in `npm test`.
