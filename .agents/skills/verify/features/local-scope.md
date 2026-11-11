# Local scope

`-l` / `--local` switches the settings file from the Pi agent directory to
`<cwd>/.pi/settings.json`. `install`, `status`, `update`, `doctor`, and `remove`
all accept it; global is the default for every command. `--only` and `--except`
stay install-only and are rejected by the other four in both scopes.

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi` and stub `npm` as the only `PATH` entries. The stub `pi` logs
its argv outside the checkout. A project settings file lives under the drive's
own working directory, so create a fresh work directory per drive and write only
disposable fixtures.

## Drive

```sh
env -i PATH="$probe/bin" HOME="$probe/home" USERPROFILE="$probe/home" \
  PI_CODING_AGENT_DIR="$probe/agent" TMPDIR="$probe/tmp" \
  XDG_CONFIG_HOME="$probe/config" XDG_CACHE_HOME="$probe/cache" \
  XDG_DATA_HOME="$probe/data" XDG_STATE_HOME="$probe/state" \
  npm_config_cache="$probe/npm" npm_config_userconfig="$probe/npmrc" \
  npm_config_globalconfig="$probe/npmrc-global" TERM=dumb NO_COLOR=1 \
  LAZYPI_PROBE_CALLS="$probe/calls" node bin/lazypi.mjs status --local
```

Run it from a work directory with no `.pi/settings.json`, then from one that
has a fixture file. Repeat with `install --local --only core`,
`install --local --yes --only optional`, `update --local`, `doctor --local`, and
`remove --local pstack`. Snapshot both the project file and the agent directory
before each run.

## Assert

`status --local` with no project file: exit 0, stdout begins
`Settings file: <cwd>/.pi/settings.json`, the next line is
`(not found — Pi has not written settings yet)`, and the catalog header reports
0/6. A corrupt agent settings file does not change that result, so the agent
directory is not consulted.

`install --local --only core` against a project file that already holds the
pinned pstack source and `npm:pi-subagents`: exit 0, four spawns of the form
`pi install -l --approve <source>` (sandbox, verdict, pi-ask-user, web-access),
no spawn for the two registrations already present. Because subagents is
selected, the project file is rewritten with the six blanked builtin subagent
models and a new `.lazypi.<timestamp>.bak` holding the previous bytes.

`install --local --yes --only optional`: exit 0, stdout exactly
`Nothing selected — nothing to install.`, no invocation, and both settings
files byte-identical.

`update --local` spawns `pi update --extensions` and no `-l`; see
[update](update.md) for why that argument set is reported rather than assumed.
`doctor --local` reads only the project file; see [doctor](doctor.md).
`remove --local` adds `-l --approve` to every spawn; see [remove](remove.md).

With a corrupt agent settings file and a valid project file, `doctor --local`,
`status --local`, and `remove --local` all exit 0 and spawn only their own
command, so the local scope never falls back to the agent directory. `status
--local` against the same fixture reports 1/6 and lists `subagents` as installed
with source `npm:pi-subagents`.

Local reads and writes never touch `PI_CODING_AGENT_DIR`. The automated half
pins that separation and install's `-l --approve` argv in
`test/agent-dir.test.mjs`, `test/settings-integrity.test.mjs`, and
`test/pstack-retirement.test.mjs`. Removal's `-l --approve` argv is only pinned
by the drive in [remove](remove.md). See the manual-versus-suite split in
[the feature map](README.md#manual-drives-versus-the-automated-suite).

## Remains unverified

Real Pi project trust, what `--approve` records, and whether a real local
install or removal leaves the project usable without a re-approval. Symlink and
non-regular settings targets are covered by the settings-integrity suite, not by
this drive. Interactive local runs, Windows project paths, and repository
permission semantics stay unverified.
