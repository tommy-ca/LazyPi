---
name: verify
description: "Use when verifying LazyPi CLI changes or recording isolated user-visible evidence."
---

# Verify LazyPi

Run from the repository root. This skill covers isolated CLI checks, not live extension behavior. Never use real Pi settings, credentials, package stores, or a user's working directory. A temporary HOME is not a network sandbox.

## Isolation rule

A child `PATH` in this repository holds one fixture stub directory and nothing
else. It never carries the inherited `PATH`, never carries `/usr/bin` or `/bin`,
and never carries the running Node install directory, because that directory
also contains a real `npm`. Every stub starts through the absolute interpreter
`#!"$node_bin"`, so running a stub needs no `PATH` lookup at all. A command with
no stub must fail the drive; it must never fall through to a real tool.

## Launch and readiness

Find Node with `command -v node` and confirm dependencies are already installed. Do not install dependencies or run `npx` as a verification shortcut. Create a private scratch directory, a stub bin directory, and a separate evidence directory outside the checkout:

```sh
repo="$PWD"
node_bin="$(command -v node)"
scratch="$(mktemp -d)"
evidence="$(mktemp -d)"
bin="$scratch/bin"
calls="$scratch/calls.jsonl"
mkdir -p "$scratch/home" "$scratch/agent" "$scratch/work" "$bin" \
  "$scratch/tmp" "$scratch/config" "$scratch/cache" "$scratch/data" "$scratch/state" "$scratch/npm"
printf '{"packages":[]}\n' > "$scratch/agent/settings.json"
: > "$calls"
: > "$scratch/npmrc"
: > "$scratch/npmrc-global"
cd "$scratch/work"
run="$(mktemp -d "$evidence/version.XXXXXX")"
printf '%s\n' '"$node_bin" "$repo/bin/lazypi.mjs" --version (isolated environment)' > "$run/command.txt"
env -i PATH="$bin" HOME="$scratch/home" USERPROFILE="$scratch/home" PI_CODING_AGENT_DIR="$scratch/agent" "$node_bin" "$repo/bin/lazypi.mjs" --version > "$run/stdout.txt" 2> "$run/stderr.txt"
rc=$?
printf '%s\n' "$rc" > "$run/exit.txt"
```

This readiness check succeeds only when the recorded exit status is zero and `stdout.txt` contains the expected checkout version. It does not run `lazypi doctor` or check Pi, authentication, or package health. Do not use shell `errexit`, which would prevent recording a failed exit. Each CLI invocation is a fresh process. Repeat the readiness check after an unexpected failure, creating a new `$run` directory each time. Keep the exact scratch and evidence paths.

Every variable a feature drive needs comes from this block: `$repo`, `$node_bin`,
`$bin`, `$calls`, `$scratch`, and `$evidence`. The drive environment adds
`TMPDIR="$scratch/tmp"`, the four `XDG_*` directories, and
`npm_config_cache="$scratch/npm"` with the two distinct npm config files
`npm_config_userconfig="$scratch/npmrc"` and
`npm_config_globalconfig="$scratch/npmrc-global"`. The stub log every drive reads
is `$calls`, which is `$scratch/calls.jsonl`.

## Drive

Use the feature map in `features/README.md`, which also states the split between these manual drives and the automated suite. Run commands with the same `env -i`, isolated directories, Node path, and working directory as the readiness check. Create a new directory under `$evidence` for every invocation. Record the command, stdout, stderr, exit status, and relevant scratch state separately, including on failure. Assert the visible result and side effects, not just successful exit. A fake Pi proves only LazyPi's orchestration, not actual Pi or extension functionality.

## Stub-first commands

`install`, `status`, `doctor`, and `remove` may be driven with `--local`; `update` is driven to assert its `--local` refusal, which exits 2 before LazyPi reads settings or spawns a child. Every drive needs stub `pi` and stub `npm` in the one `PATH` directory. `doctor` alone probes for `git`, so only that drive also needs a stub `git`, and a missing `git` stub prints no line at all instead of a problem. Redirecting `HOME`, `USERPROFILE`, `PI_CODING_AGENT_DIR`, the XDG directories, `TMPDIR`, and the npm config and cache is necessary and not sufficient: environment redirection alone does not stop a real `npm install -g`. The stub is what keeps a spawn from reaching a real tool.

On POSIX the CLI resolves `pi`, `npm`, and `git` by walking `PATH` itself, so it
spawns no lookup tool and no stub `which` is needed there. On Windows it still
asks `where` (`bin/pi-host.mjs`), so a Windows drive needs a `where` stub and
native Windows resolution remains unverified. A candidate is accepted only as a
regular file with an execute bit, and `PATH` holds that one private directory, so
a command with no stub is simply not found.

```sh
cat > "$bin/pi" <<EOF
#!$node_bin
import { appendFileSync } from "node:fs";
const entry = { command: "pi", argv: process.argv.slice(2) };
process.on("exit", (status) => appendFileSync("$calls", JSON.stringify({ ...entry, status }) + "\\n"));
if (process.argv[2] === "--version") process.stdout.write("0.5.0-fixture\\n");
EOF
cat > "$bin/npm" <<EOF
#!$node_bin
import { appendFileSync } from "node:fs";
const entry = { command: "npm", argv: process.argv.slice(2) };
process.on("exit", (status) => appendFileSync("$calls", JSON.stringify({ ...entry, status }) + "\\n"));
EOF
chmod 755 "$bin/pi" "$bin/npm"
```

Every drive then uses `PATH="$bin"` plus the isolated environment, and nothing
else on `PATH`. Assert the invocation log, not only the printed output: an empty
log proves a command spawned nothing, and its JSON lines pin the argv and the
exit status. A stub that exits 0 also proves nothing about Pi's own behavior. If
a drive needs another external command, add a stub for it in `$bin`; do not add a
system directory or the Node install directory to `PATH`.

To model a tool that is not installed, remove its stub: `rm "$bin/pi"`. With
`PATH` holding only that private directory the command is then not found.
Without `--yes` the CLI must fail before spawning a child, and the empty
invocation log proves it did not fall back: with no `pi` stub,
`install --only web-access` exits 127 and logs nothing.

`--yes` is the exception, and it has to be read rather than assumed. With no `pi`
stub, `install --yes` and `update --yes` spawn
`npm install -g @earendil-works/pi-coding-agent` through the stub `npm` before
they exit 127. That spawn is the escape that once installed Pi over a
mise-managed harness, so a `--yes` drive asserts the log contains it instead of
asserting the log is empty.

### The same rule in the automated suite

`test/helpers/cli-spawn.mjs` builds that environment for every test that spawns
`bin/lazypi.mjs`: stub `pi`, `npm`, `git`, and `which` in one private directory,
that directory as the whole `PATH`, JSON argv plus exit status for every
invocation, and a clear failure when a requested command has no stub.
`test/cli-isolation-guard.test.mjs` enforces it: a test file may not build a child
`PATH` from `process.env.PATH`, may not put `/usr/bin`, `/bin`, or the Node
install directory on a child `PATH`, and may not spawn the CLI outside the
helper. A new CLI-spawning test uses `createCliSandbox(t)` and its `run`,
`spawn`, or `shellCommand`, so the guard stays green.

Extension execution is still out of scope. Real package installation or
execution requires separately authorized destinations, disposable state, and
effective OS-level isolation, which a stub-first drive does not provide. Do not
run Pi extensions, and do not run `scripts/e2e-install.mjs` directly: its child
`PATH` is the inherited one, so un-stubbed it reaches the real `pi`, `npm`, `git`,
and `sh` and runs a real `npm pack` and `npm install` against the network. Its
only sanctioned use is `node --test test/e2e-harness.test.mjs`, which supplies
stub npm and stub Pi and a private `PATH`. The driver creates private HOME, Pi,
XDG, temporary, and npm state and passes an allowlisted environment to every
command, and that is still not OS containment. See
[packed verification checks](features/install-orchestration.md#offline-packed-verification)
for the stub-only command, state setup, evidence, and limits.

Do not claim extension coverage from package registration or `status` output.

## Evidence and cleanup

Keep proof in the separate `$evidence` directory. After the final drive, stop only processes started by that drive, return to `$repo`, and remove only the exact `$scratch` directory. Confirm the evidence files still exist. Report their path, commands, results, and any unverified features. Use `/maintain-verification-skill` to review this skill when the CLI changes.
