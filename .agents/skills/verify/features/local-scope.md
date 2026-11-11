# Local scope

`-l` / `--local` switches the settings file from the Pi agent directory to
`<cwd>/.pi/settings.json`. `install`, `status`, `doctor`, and `remove` accept it;
global is the default for every command. `update` refuses it: `update --local`
and `update -l` exit 2 with
`update does not support --local: pi cannot update project extensions on their own`
before LazyPi reads settings or starts a child, because Pi cannot update one
project's extensions alone. `--only` and `--except` stay install-only and are
rejected by the other four in both scopes.

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi` and stub `npm` as the only `PATH` entries. The stub `pi`
appends its argv and exit status to `$calls`, which is `$scratch/calls.jsonl`
outside the checkout. A project settings file lives under the drive's own
working directory, so create a fresh work directory per drive and write only
disposable fixtures.

## Drive

```sh
env -i PATH="$bin" HOME="$scratch/home" USERPROFILE="$scratch/home" \
  PI_CODING_AGENT_DIR="$scratch/agent" TMPDIR="$scratch/tmp" \
  XDG_CONFIG_HOME="$scratch/config" XDG_CACHE_HOME="$scratch/cache" \
  XDG_DATA_HOME="$scratch/data" XDG_STATE_HOME="$scratch/state" \
  npm_config_cache="$scratch/npm" npm_config_userconfig="$scratch/npmrc" \
  npm_config_globalconfig="$scratch/npmrc-global" TERM=dumb NO_COLOR=1 \
  "$node_bin" "$repo/bin/lazypi.mjs" status --local
```

Every variable in that block comes from the verify skill's launch block, and
`$calls` is the stub log it writes. Run it from `$scratch/work` with no
`.pi/settings.json`, then from a fresh `drive="$(mktemp -d "$scratch/work.XXXXXX")"`
that holds a fixture `$drive/.pi/settings.json`. Repeat with
`install --local --only core`, `install --local --yes --only optional`,
`doctor --local`, `remove --local pstack`, and the refusal `update --local`.
Snapshot both the project file and the agent directory before each run.

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

`update --local`: exit 2, the help text on stdout, and
`update does not support --local: pi cannot update project extensions on their own`
on stderr, with `$calls` empty, which is what proves the refusal happens before
any child process starts. Both settings files and the backup set are
byte-identical afterwards. This is a refusal drive, not a scope drive; see
[update](update.md) for the global delegation.

`doctor --local` reads only the project file; see [doctor](doctor.md).
`remove --local` adds `-l --approve` to every spawn; see [remove](remove.md).

With a corrupt agent settings file and a valid project file, `doctor --local`,
`status --local`, and `remove --local` all exit 0 and spawn only their own
command, so the local scope never falls back to the agent directory. `status
--local` against the same two-source fixture reports 2/6 and lists both
registrations as installed: `pstack` with source
`git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8` and
`subagents` with source `npm:pi-subagents`.

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
