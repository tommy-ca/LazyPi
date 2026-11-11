# Doctor

`doctor` inspects the environment and the settings file and prints four
sections: Environment, Pi, Settings, Auth. It never installs, removes, or
writes; its only spawn is `pi --version` (read the caveat under
[remains unverified](#remains-unverified) before relying on that line).

## Isolation recipe

Use the stub-first recipe in [the verify skill](../SKILL.md): private `HOME`,
`USERPROFILE`, `PI_CODING_AGENT_DIR`, XDG directories, `TMPDIR`, and npm
config/cache, with stub `pi`, stub `npm`, and stub `git` in the one
`PATH` directory. `doctor` is the only command that probes for `git`, so it is
the only drive that needs a stub `git` at all. The stub `pi` appends its argv
and exit status to `$calls`, which is `$scratch/calls.jsonl` outside the
checkout, and answers `--version` with `0.5.0-fixture`; the stub `npm` logs and
exits 0. On POSIX the CLI walks `PATH` itself and spawns no lookup tool; on
Windows it asks `where`, which stays unverified. `PATH` holds that directory
alone, so a missing stub fails the drive instead of reaching a real `pi`, `npm`,
or git.

The verify skill's stub block creates `pi` and `npm` only, so create the `git`
stub this drive needs:

```sh
cat > "$bin/git" <<EOF
#!$node_bin
import { appendFileSync } from "node:fs";
const entry = { command: "git", argv: process.argv.slice(2) };
process.on("exit", (status) => appendFileSync("$calls", JSON.stringify({ ...entry, status }) + "\\n"));
EOF
chmod 755 "$bin/git"
```

## Drive

```sh
env -i PATH="$bin" HOME="$scratch/home" USERPROFILE="$scratch/home" \
  PI_CODING_AGENT_DIR="$scratch/agent" TMPDIR="$scratch/tmp" \
  XDG_CONFIG_HOME="$scratch/config" XDG_CACHE_HOME="$scratch/cache" \
  XDG_DATA_HOME="$scratch/data" XDG_STATE_HOME="$scratch/state" \
  npm_config_cache="$scratch/npm" npm_config_userconfig="$scratch/npmrc" \
  npm_config_globalconfig="$scratch/npmrc-global" TERM=dumb NO_COLOR=1 \
  "$node_bin" "$repo/bin/lazypi.mjs" doctor
```

Every variable in that block comes from the verify skill's launch block, and
`$calls` is the stub log it writes. Repeat with `doctor --local`, and with a
`$bin` that holds the `npm` and `git` stubs but no `pi` stub (`rm "$bin/pi"`).

## Assert

With `{"packages":[]}` in the agent settings, a stub `pi`, and no provider
environment variables: exit 0, empty stderr, and these sections in order —
Environment (`✓ Node <version>`, `✓ npm is on PATH`, `✓ git is on PATH`), Pi
(`✓ \`pi\` is on PATH`, `✓ pi --version: 0.5.0-fixture`), Settings
(`✓ <agent dir>/settings.json is readable`), Auth
(`! No credentials detected — run \`pi\` then \`/login\`, or export a provider API key`).
A warning-only run ends with `1 warning(s) found.` and still exits 0. The
invocation log holds exactly `pi --version`. Removing the `git` stub is not a
failure: the Environment section simply drops its `✓ git is on PATH` line and
neither the problem nor the warning count changes.

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

Missing `git` and a Node version below 20 are not driven here, because the stub
environment always provides both. An unreadable `pi --version` is no longer on
this list: `test/remaining-seams.test.mjs` drives a `pi --version` that exits 1
with error output and asserts the nonfatal
`Could not read `pi --version` output` warning. What stays untested is the
invocation log itself: no test asserts that `doctor` spawns only `pi --version`,
so that sentence is code-true and unpinned until this drive records `$calls`.
The exit-1 problem path is manual-only; exit 2 on corrupt settings is pinned by
`test/audit-seams.test.mjs`.

`doctor` says nothing about whether Pi loads any package: a ✓ line is not
extension, model, provider, or authentication evidence. Real project trust,
real credentials, and Windows behaviour stay unverified.
