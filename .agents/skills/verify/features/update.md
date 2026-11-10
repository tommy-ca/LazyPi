# Update

`update` delegates to Pi. LazyPi reads the settings file, ensures `pi` is on
`PATH`, prints `pi update`, runs one `pi` command, and returns its exit status.
It does not select, install, or reconcile catalog entries.

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi`, stub `npm`, and stub `which` as the only `PATH` entry. The stub `pi`
appends its argv to a log outside the checkout and exits 0, so a drive can
assert the exact delegation instead of observing a real update.

## Drive

```sh
env -i PATH="$probe/bin" HOME="$probe/home" USERPROFILE="$probe/home" \
  PI_CODING_AGENT_DIR="$probe/agent" TMPDIR="$probe/tmp" \
  XDG_CONFIG_HOME="$probe/config" XDG_CACHE_HOME="$probe/cache" \
  XDG_DATA_HOME="$probe/data" XDG_STATE_HOME="$probe/state" \
  npm_config_cache="$probe/npm" npm_config_userconfig="$probe/npmrc" \
  npm_config_globalconfig="$probe/npmrc-global" TERM=dumb NO_COLOR=1 \
  LAZYPI_PROBE_CALLS="$probe/calls" node bin/lazypi.mjs update
```

Repeat with `update --local`, and with a corrupt settings file.

## Assert

Global: exit 0, stderr empty, stdout starts with `pi update`, and the
invocation log holds exactly one line, `pi update`.

`update --local`: exit 0, stderr empty, stdout still starts with `pi update`,
and the invocation log holds exactly `pi update --extensions`. The local scope
is not passed to Pi as `-l` on this path, so the printed header does not
describe the spawn. Observed behaviour, not an endorsement.

Corrupt settings (`{`): exit 2, `Could not parse <path> — <parser message>` on
stderr, and no invocation. The same rejection applies to `update --local`.

The automated half covers the global delegation only:
`node --test test/update-selection.test.mjs`. See the manual-versus-suite split
in [the feature map](README.md#manual-drives-versus-the-automated-suite).

## Remains unverified

What `pi update` and `pi update --extensions` do to real registrations,
defaults, and archives; whether a local update touches project registrations at
all; network access; upgrading, downgrading, and pinned sources. The stub proves
LazyPi's argv and exit-code passthrough, nothing about Pi.
