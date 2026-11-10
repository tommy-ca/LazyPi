# Remove

`remove` resolves each target and runs `pi remove` once per resolved source.
LazyPi removes nothing itself: whatever changes in the settings file is Pi's
write. It prints nothing on success and returns Pi's exit status.

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi` and stub `npm` first on `PATH`. The stub `pi`
appends its argv to a log outside the checkout and exits 0. Write only
disposable fixture settings; never point this drive at a real profile.

## Drive

```sh
env -i PATH="$probe/bin:/usr/bin:/bin" HOME="$probe/home" USERPROFILE="$probe/home" \
  PI_CODING_AGENT_DIR="$probe/agent" TMPDIR="$probe/tmp" \
  XDG_CONFIG_HOME="$probe/config" XDG_CACHE_HOME="$probe/cache" \
  XDG_DATA_HOME="$probe/data" XDG_STATE_HOME="$probe/state" \
  npm_config_cache="$probe/npm" npm_config_userconfig="$probe/npmrc" \
  npm_config_globalconfig="$probe/npmrc-global" TERM=dumb NO_COLOR=1 \
  LAZYPI_PROBE_CALLS="$probe/calls" node bin/lazypi.mjs remove subagents
```

Repeat with a raw source (`remove npm:pi-btw@0.1.0`), an id that is not in the
catalog (`remove not-a-catalog-id`), a category name (`remove core`), no target
(`remove`), each of those with `--local`, and a corrupt settings file.

## Assert

With `npm:pi-subagents` in the settings file: exit 0, stdout and stderr empty,
and the log holds exactly `pi remove npm:pi-subagents`.

A catalog id resolves to the exact installed source when the registration is
not the identity source. With the pinned pstack source in a project settings
file, `remove --local pstack` spawns
`pi remove -l --approve git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8`.
Everything else passes through unresolved: `remove npm:pi-btw@0.1.0` spawns
`pi remove npm:pi-btw@0.1.0`, `remove not-a-catalog-id` spawns
`pi remove not-a-catalog-id`, and a category name is not a selector, so
`remove core` spawns `pi remove core`.

`remove` with no target on a non-TTY: exit 2, stderr
`Usage: npx @tommy-ca/lazypi remove <id|source> [...]`, and no invocation.
Corrupt settings: exit 2, `Could not parse <path> — <parser message>` on stderr,
and no invocation. `--local` adds `-l --approve` to every spawn and reads
`<cwd>/.pi/settings.json`; see [local scope](local-scope.md).

The automated half covers raw passthrough, exact-source removal, and the
`--local` argv in `test/pstack-retirement.test.mjs`. See the manual-versus-suite
split in [the feature map](README.md#manual-drives-versus-the-automated-suite).

## Remains unverified

Real removal semantics: whether Pi uninstalls files, prunes caches, deletes
session data, or rewrites anything beyond `packages`. Failure handling for a
second target after a failed `pi remove` is not driven here. The interactive
picker (space to select, empty selection removes nothing) needs a TTY and is not
part of this recipe.
