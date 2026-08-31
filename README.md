# LazyPi

The [Pi](https://github.com/earendil-works/pi-mono) coding agent is minimal by design. LazyPi is opinionated by design. Run one command and get the 12-package harness core. The 5-package optional tier installs when you ask. Remove what you don't want later.

## Quick start

```bash
npx @tommy-ca/lazypi
```

LazyPi will:

1. Install `pi` for you if it isn't installed yet.
2. Ask if you want to install all the packages or choose which to install.

That setup is the harness core — isolated sub-agents, a structured ask gate, skill visibility, $ skill mention, a long-objective gate, side chat, context budgeting, code simplification review, web research, FFF search, a workflow engine for sub-agent fan-out, and ponytail discipline review. A five-package optional tier (targeted LSP diagnostics, interactive shell overlays, autonomous research loops, structured todo tracking, markdown-backed memory) installs on request with `--only optional`. Other extras (skill arguments, MCP, ralph-wiggum, themes) install on demand with `pi install`.

That's it.  Once done - run `pi` and experience a feature rich coding agent experience.

Install is **idempotent** — LazyPi reads your Pi settings and skips any package that is already installed, so re-running is safe.

## Commands

| Command | What it does |
| --- | --- |
| `npx @tommy-ca/lazypi` | Install all or selected catalog (interactive picker by default) |
| `npx @tommy-ca/lazypi remove <id>` | Remove a catalog package by id (or pass a raw pi source) |
| `npx @tommy-ca/lazypi status` | Show which catalog packages are installed, missing, or extra |
| `npx @tommy-ca/lazypi update` | Run `pi update` for installed Pi packages |
| `npx @tommy-ca/lazypi doctor` | Check your environment for common problems |

## Updating

```bash
npx @tommy-ca/lazypi update
```

## Removing packages

```bash
npx @tommy-ca/lazypi remove
```

Shows an interactive picker of installed packages. Or pass ids directly to skip the picker:

```bash
npx @tommy-ca/lazypi remove subagents
npx @tommy-ca/lazypi remove npm:pi-subagents@0.13.3   # raw pi source also works
```

There is nothing to "uninstall" for LazyPi itself — `npx` doesn't leave it around.

## Troubleshooting

Run the built-in health check with `npx @tommy-ca/lazypi doctor`.

**Stale cached run after a release?** Both runners cache resolved versions: `bunx`
serves from its package cache and `npx` reuses the extracted copy in
`~/.npm/_npx`, so a bare `npx @tommy-ca/lazypi` / `bunx @tommy-ca/lazypi` can
keep serving the previous release until the cache is cleared. Run
`bun pm cache rm` (and/or delete the stale `~/.npm/_npx` entry), pin
`@tommy-ca/lazypi@latest`, and check `npx @tommy-ca/lazypi --version` to see
which release is actually running.

**`lazypi: not found` when running npx inside the LazyPi repo?** npm exec
matches the spec against the local tree, and the checkout itself is
`@tommy-ca/lazypi@<version>` — so it skips the npx install and tries to run
`lazypi` from `./node_modules/.bin`, which never exists for the project's own
name. Run npx from any other directory (e.g. `~`); bunx and pinned-version
specs behave the same way, so `cd` out of the checkout first.

## Site / docs

The site at [lazypi.org](https://lazypi.org) lives in `docs/` and is a Jekyll site compiled by GitHub Pages automatically on push to `master`.

To preview locally (requires Ruby + Bundler):

```bash
cd docs && bundle install   # first time only
npm run docs:serve          # serves at http://localhost:4000 with livereload
```

Shared nav and footer are in `docs/_includes/`. Layouts are in `docs/_layouts/`. CSS variables and nav styles are in `docs/assets/css/site.css`.

## Releasing

LazyPi ships from `master` with a manual, gate-checked release flow:

- Run the gates: `npm test` and `npm run spec:validate`
- Bump: `npm version <semver> --no-git-tag-version`, commit `<semver>`,
  tag `v<semver>`, push commit and tag
- Publish interactively (`npm publish --access public`) — the npm account
  enforces 2FA, so publish needs a TTY for the OTP or device-auth flow.
  If publish 404s on the scoped package, the stored token has expired:
  clear it and `npm login` again (npm masks invalid tokens as 404)
- Create the GitHub release for the tag
- Validate the published artifact from a neutral directory (outside the
  checkout): `npx -y @tommy-ca/lazypi@<version> --version` and
  `bunx @tommy-ca/lazypi@<version> --version` must both report the
  released version, then `status`/`install --yes` must be idempotent.

The repo also carries a release-please workflow intended for CI trusted
publishing, but it is **not provisioned** (no `NPM_TOKEN` secret), so it
is not the current publish path. Wire the secret and test the workflow
before treating releases as automated.

---

For the full list of included packages and optional extras, see [lazypi.org](https://lazypi.org).
