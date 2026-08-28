# Fork the pi-packages (owned control plane)

## Why

The harness's control plane still resolves to third-party npm sources and two
git heads — one of them unpinned (`memory`) — that the operator neither owns
nor can patch. The gist audit and rpiv-mono audit both point the same way: the
most-trusted path is a small set of owned forks under `@tommy-ca/pi-*`, kept
in one npm-workspace monorepo with lockstep releases, ship-manifest tests, and
a clean migration path back into the LazyPi catalog. Owning the forks makes
the control plane reviewed source, stable-versioned, and customizable to the
harness (for example owned web research with a keyless default, a live task overlay that is
not a checkbox list).

## What Changes

- A new `pi-packages` monorepo (npm workspaces, biome, vitest, husky,
  lockstep versions per the rpiv-mono conventions) housing forked packages
  published as `@tommy-ca/pi-<name>`.
- Tier 1 forks: `pi-subagents`, `pi-ask-user`, `pi-web-tools` (replaces
  `pi-web-access`; provider pluggability already ships upstream, the fork
  differentiates on ownership/trim and a keyless default), `pi-btw`.
- Tier 2: `pi-goal` and `pi-context-usage` forks (smallest viable surface from
  `@narumitw/pi-goal` and `pi-context-usage`).
- Packages dropped from the catalog (memory, mcp, interactive-shell,
  ralph-wiggum, themes) are optional extras and out of the fork's scope.
- LazyPi catalog repoints each affected entry: `source` → the fork's npm
  package, `legacySources` → the upstream source(s), `forked: true`.
  Existing migration mechanics handle remove-then-install when the user next
  runs `install`/`update`. `status` and `doctor` gains an "owned forks" view.
- No catalog source remains an unpinned git head.

## Capabilities

### New Capabilities

- `lazypi/ownership`: the fork/ownership contract (published, individually
  installable, ship-manifest tested, lockstep-versioned, reviewed)

### Modified Capabilities

- `lazypi/installer`: catalog sources repointed to `@tommy-ca/pi-*` with
  `legacySources`, ownership marker in status/doctor
- `harness/control-plane`: memory and web research resolve to owned forks

## Impact

- New repo `github.com/<owner>/pi-packages` (private until first publish) and
  its CI (node 22/24, check + coverage, publish-on-tag)
- `bin/lazypi.mjs` — catalog entries + status/doctor sections; docs site pages
  for forked packages
- `scripts/assert-installed-packages.mjs` — unchanged (self-deriving)
- Operator's own `~/.pi/agent/settings.json` migrates with one
  `npx @tommy-ca/lazypi install` run