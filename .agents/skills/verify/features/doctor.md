# Doctor

`doctor` inspects the environment and the settings file and prints four
sections: Environment, Pi, Settings, Auth. It never installs, removes, or
writes; its only spawn is `pi --version`.

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi`, stub `npm`, stub `git`, and stub `which` in the one
`PATH` directory. The stub `pi` appends its argv to a log file outside the
checkout and answers `--version` with `0.5.0-fixture`; the stub `npm` logs and
exits 0; the stub `which` reports the stubs that exist, because `doctor` asks
`which` for `pi`, `npm`, and `git`. `PATH` holds that directory alone, so a
missing stub fails the drive instead of reaching a real `pi`, `npm`, or git.

## Drive

```sh
env -i PATH="$probe/bin" HOME="$probe/home" USERPROFILE="$probe/home" \
  PI_CODING_AGENT_DIR="$probe/agent" TMPDIR="$probe/tmp" \
  XDG_CONFIG_HOME="$probe/config" XDG_CACHE_HOME="$probe/cache" \
  XDG_DATA_HOME="$probe/data" XDG_STATE_HOME="$probe/state" \
  npm_config_cache="$probe/npm" npm_config_userconfig="$probe/npmrc" \
  npm_config_globalconfig="$probe/npmrc-global" TERM=dumb NO_COLOR=1 \
  LAZYPI_PROBE_CALLS="$probe/calls" node bin/lazypi.mjs doctor
```

Repeat with `doctor --local`, and with a `$probe/bin` that holds the `npm` stub
but no `pi` stub.

## Assert

With `{"packages":[]}` in the agent settings, a stub `pi`, and no provider
environment variables: exit 0, empty stderr, and these sections in order —
Environment (`✓ Node <version>`, `✓ npm is on PATH`, `✓ git is on PATH`), Pi
(`✓ \`pi\` is on PATH`, `✓ pi --version: 0.5.0-fixture`), Settings
(`✓ <agent dir>/settings.json is readable`), Auth
(`! No credentials detected — run \`pi\` then \`/login\`, or export a provider API key`).
A warning-only run ends with `1 warning(s) found.` and still exits 0. The
invocation log holds exactly `pi --version`.

With no `pi` stub on `PATH`: exit 1, `✗ \`pi\` is not on PATH — run
\`npx @tommy-ca/lazypi\` to install it`, a final line
`1 problem(s) found, 1 warning(s).`, and no `pi` invocation.

With `{` as the settings file: exit 2, `Could not parse <path> — <parser
message>` on stderr, no invocation.

`doctor --local` reads `<cwd>/.pi/settings.json`. A missing project file is a
warning (`! <cwd>/.pi/settings.json does not exist yet (Pi has not been run)`)
with exit 0; an existing one prints `✓ <cwd>/.pi/settings.json is readable` and
never reads the agent directory.

## Remains unverified

Missing `git`, a Node version below 20, and an unreadable `pi --version` are not
driven here, because the stub environment always provides the first two.
`doctor` says nothing about whether Pi loads any package: a ✓ line is not
extension, model, provider, or authentication evidence. Real project trust,
real credentials, and Windows behaviour stay unverified.
