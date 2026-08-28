# LazyPi

The [Pi](https://github.com/earendil-works/pi-mono) coding agent is minimal by design. LazyPi is opinionated by design. Run one command and get a complete, curated Pi setup — everything selected by default, nothing to research, nothing to configure. Remove what you don't want later.

## Quick start

```bash
npx @tommy-ca/lazypi
```

LazyPi will:

1. Install `pi` for you if it isn't installed yet.
2. Ask if you want to install all the packages or choose which to install.

That setup is the harness control plane — isolated sub-agents, a structured ask gate, skill visibility, $ skill mention, a long-objective gate, side chat, and context budgeting — plus tools (memory, web access, MCP, interactive shell overlays), long-running research loops, and the curated dark theme pack.

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

## Site / docs

The site at [lazypi.org](https://lazypi.org) lives in `docs/` and is a Jekyll site compiled by GitHub Pages automatically on push to `master`.

To preview locally (requires Ruby + Bundler):

```bash
cd docs && bundle install   # first time only
npm run docs:serve          # serves at http://localhost:4000 with livereload
```

Shared nav and footer are in `docs/_includes/`. Layouts are in `docs/_layouts/`. CSS variables and nav styles are in `docs/assets/css/site.css`.

## Releasing

LazyPi uses **Release Please** and **npm trusted publishing**.

To release a new version:

- Merge your normal PRs into `master`
- Merge the Release Please release PR when you are ready to publish
- GitHub creates the tag/release and publishes to npm automatically

---

For the full list of included packages and themes, see [lazypi.org](https://lazypi.org).
