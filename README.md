# LazyPi

LazyPi is an opinionated package installer for [Pi](https://github.com/earendil-works/pi-mono). This checkout contains an **unpublished registration candidate**, not a release or a certified native PStack integration. It selects six core registrations, including Web Access by default. The optional category is empty.

## Quick start

```bash
npx @tommy-ca/lazypi
```

LazyPi will:

1. Ask if you want to install all the packages or choose which to install.
2. Offer to install `pi` if needed, after you select packages.

Cancelling selection or selecting no packages skips Pi bootstrap and package installation.

`--yes` installs all six core registrations. On a TTY, Install everything selects the same six, and the picker preselects all six. Registration does not prove effective loading, canonical role binding, tool dispatch, authorization, recovery, or readiness. Native integration and operator promotion remain unverified.

Install reads your Pi settings and skips matching installed sources, including older pins. Selecting subagents still resets the six builtin model overrides to the session-model fallback, even when already installed. Other override keys remain. Existing settings are backed up before those changes. See `docs/docs/installation.html`.

## Catalog

`--yes`, `--only core`, and TTY Install everything select all 6 core registrations. The picker preselects all six. The `optional` selector remains valid but empty: `--only optional` installs nothing and skips setup; `--except optional` selects all six.

| id | category | why |
| --- | --- | --- |
| pstack | core | Canonical Git checkout as registration and preservation reference only |
| subagents | core | Required delegation support with existing builtin model semantics |
| sandbox | core | Required sandbox support, disabled until explicitly configured |
| verdict | core | Required permission gate. Classifier failures fail closed; exemptions and manual shell escapes are not classified |
| pi-ask-user | core | Required structured questions, not hard approval |
| web-access | core | Default web search and fetching for research |

PStack identity is `git:github.com/tommy-ca/pstack`. Fresh installs pass
`git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8`.
An older matching canonical registration is skipped, not upgraded or duplicated.
`npm:@zenspc/pi-pstack` is independent, not an alias. Support sources remain
`npm:pi-subagents`, `npm:pi-better-sandbox`, `npm:pi-verdict`,
`npm:pi-ask-user`, and `npm:pi-web-access`, with existing npm install/update semantics.
The upstream recommendation is static-only and does not enforce switches.
Local required support is deliberately stricter than upstream's capability minimum.
Sandbox registration does not enable or configure containment. Ask User is not a hard approval gate.
Untrusted or unattended work still requires a container or VM.

### Retirement limits and capability losses

Retired IDs are pi-skillful, mention-skill, goal, btw, context-usage, simplify,
fff, dynamic-workflows, ponytail, lsp, interactive-shell, autoresearch, todos,
and memory. They reject in `--only` and `--except` before Pi setup or package
commands. They are not another tier. Previously dropped packages remain outside curation.

Catalog subtraction does not uninstall, disable active packages, delete data,
or prevent updates. Installed strings, objects, exact pins, metadata, order,
scope, and unrelated settings remain intact. Retired registrations appear as
Other. Broad `pi update --extensions` still includes installed packages outside
the catalog.
Retired IDs no longer resolve catalog or legacy sources on removal. Unknown
targets still pass unchanged to Pi, so use the exact installed source, for example
`lazypi remove npm:pi-btw@0.1.0`, not `remove btw`.

Curation deliberately loses skill discovery/hiding and mention expansion,
objective stopping, side chat, context telemetry, simplification and discipline
review, indexed search, LSP, interactive overlays, experiment/debt hooks, and
persistent todos/memory. PStack registration does not establish equivalent
replacements. Dynamic Workflows is a declared upstream source conflict, not
proof of a loaded tool collision. No automatic uninstall or exclusion occurs.
Other overlap is not verified runtime equivalence. `pi install` still works for
unmanaged sources. See `docs/docs/philosophy.html`.

## Commands

| Command | What it does |
| --- | --- |
| `npx @tommy-ca/lazypi` | TTY Install everything and `--yes` select all 6 core registrations. Picker otherwise. |
| `npx @tommy-ca/lazypi remove <id>` | Remove a catalog package by id (or pass a raw pi source) |
| `npx @tommy-ca/lazypi status` | Show which catalog packages are installed, missing, or extra |
| `npx @tommy-ca/lazypi update` | Run `pi update --extensions` for installed Pi extension packages |
| `npx @tommy-ca/lazypi doctor` | Check your environment for common problems |

`--only` and `--except` apply only to `install`. Other commands reject them
before running Pi. An empty unattended selection does not install Pi or packages.
`doctor` warns nonfatally when `pi --version` fails or returns no output.
Legacy migration helpers remain, but retired entries no longer supply ID or
legacy-source resolution. The candidate catalog carries no retired compatibility list.

## Updating

```bash
npx @tommy-ca/lazypi update
```

This runs `pi update --extensions`, which updates extension packages in the
global scope and in projects Pi already trusts. Existing pins are respected,
including older canonical PStack refs. Retirement does not freeze updates.

It is not a Pi harness self-update: bare `pi update` upgrades Pi itself, so
LazyPi never asks for it.

`lazypi update --local` is rejected with exit 2 before LazyPi reads settings,
spawns anything, or writes a file. Project-only update is unsupported because
Pi cannot perform it: Pi's extension update always spans the global scope and
trusted projects, and it rejects `-l` itself.

## Removing packages

```bash
npx @tommy-ca/lazypi remove
```

Shows an interactive picker of installed catalog packages. Space selects removal;
an empty selection removes nothing. Pass current catalog IDs directly to skip the picker:

```bash
npx @tommy-ca/lazypi remove subagents
npx @tommy-ca/lazypi remove npm:pi-subagents@0.13.3   # raw pi source also works
```

LazyPi needs no global installation. Runner caches, subagent settings overrides,
and timestamped settings backups can remain after package removal.

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

The Jekyll source lives in `docs/`. This fork does not enable GitHub Pages, and [lazypi.org](https://lazypi.org) still serves the upstream installer.

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

There is no automated npm publishing workflow. CI verifies the artifact;
publishing remains an interactive, gate-checked maintainer action.

---

The catalog table above is the candidate registration list. `docs/docs/philosophy.html` explains membership. Run `npx @tommy-ca/lazypi` to install.
