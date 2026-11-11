# Update

`update` delegates to Pi's extension updater. LazyPi reads the global settings
file, ensures `pi` is on `PATH`, prints the command it spawns, runs exactly one
`pi` command, and returns its exit status. It does not select, install, or
reconcile catalog entries.

Bare `pi update` upgrades the Pi harness itself. `pi update --extensions`
updates registered extension packages across the global scope and projects Pi
already trusts, so LazyPi always asks for `--extensions`. It never passes
`--approve`, because that changes project trust rather than update scope, and
never passes `-l`, because Pi rejects it for update.

`update --local` is rejected with exit 2 before LazyPi reads settings, spawns
anything, or writes a file: Pi cannot perform a project-only extension update.

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi` and stub `npm` as the only `PATH` entries. The stub `pi`
appends its argv and exit status to `$calls`, which is `$scratch/calls.jsonl`
outside the checkout, and exits 0, so a drive can assert the exact delegation
instead of observing a real update.

## Drive

```sh
env -i PATH="$bin" HOME="$scratch/home" USERPROFILE="$scratch/home" \
  PI_CODING_AGENT_DIR="$scratch/agent" TMPDIR="$scratch/tmp" \
  XDG_CONFIG_HOME="$scratch/config" XDG_CACHE_HOME="$scratch/cache" \
  XDG_DATA_HOME="$scratch/data" XDG_STATE_HOME="$scratch/state" \
  npm_config_cache="$scratch/npm" npm_config_userconfig="$scratch/npmrc" \
  npm_config_globalconfig="$scratch/npmrc-global" TERM=dumb NO_COLOR=1 \
  "$node_bin" "$repo/bin/lazypi.mjs" update
```

Every variable in that block comes from the verify skill's launch block, and
`$calls` is the stub log it writes. Repeat with `update --local`, and with a
corrupt settings file.

## Assert

Global: exit 0, stderr empty, stdout is exactly `pi update --extensions`, and
the invocation log holds exactly one line, `pi update --extensions`.

`update --local`: exit 2, the help text on stdout, and
`update does not support --local: pi cannot update project extensions on their own`
on stderr. The invocation log stays empty, which is what proves the rejection
happens before any child process starts. Both settings scopes and the backups
are byte-identical afterwards.

Corrupt settings (`{`): exit 2, `Could not parse <path> — <parser message>` on
stderr, and no invocation.

The automated half covers the scope rules, trust preservation and exit-code
passthrough in `node --test test/update-scope.test.mjs`, and the delegation in
`node --test test/update-selection.test.mjs`. See the manual-versus-suite split
in [the feature map](README.md#manual-drives-versus-the-automated-suite).

## Remains unverified

What `pi update --extensions` does to real registrations, defaults, archives and
trusted-project detection; whether an already-trusted project is updated at all;
network access; upgrading, downgrading, and pinned sources. The stub proves
LazyPi's argv, header, state preservation and exit-code passthrough, nothing
about Pi.
