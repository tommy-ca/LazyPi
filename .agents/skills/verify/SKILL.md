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
mkdir -p "$scratch/home" "$scratch/agent" "$scratch/work" "$bin"
printf '{"packages":[]}\n' > "$scratch/agent/settings.json"
: > "$calls"
cd "$scratch/work"
run="$(mktemp -d "$evidence/version.XXXXXX")"
printf '%s\n' 'node bin/lazypi.mjs --version (isolated environment)' > "$run/command.txt"
env -i PATH="$bin" HOME="$scratch/home" USERPROFILE="$scratch/home" PI_CODING_AGENT_DIR="$scratch/agent" "$node_bin" "$repo/bin/lazypi.mjs" --version > "$run/stdout.txt" 2> "$run/stderr.txt"
rc=$?
printf '%s\n' "$rc" > "$run/exit.txt"
```

This readiness check succeeds only when the recorded exit status is zero and `stdout.txt` contains the expected checkout version. It does not run `lazypi doctor` or check Pi, authentication, or package health. Do not use shell `errexit`, which would prevent recording a failed exit. Each CLI invocation is a fresh process. Repeat the readiness check after an unexpected failure, creating a new `$run` directory each time. Keep the exact scratch and evidence paths.

## Drive

Use the feature map in `features/README.md`, which also states the split between these manual drives and the automated suite. Run commands with the same `env -i`, isolated directories, Node path, and working directory as the readiness check. Create a new directory under `$evidence` for every invocation. Record the command, stdout, stderr, exit status, and relevant scratch state separately, including on failure. Assert the visible result and side effects, not just successful exit. A fake Pi proves only LazyPi's orchestration, not actual Pi or extension functionality.

## Stub-first commands

`install`, `status`, `update`, `doctor`, and `remove` may be driven, including with `--local`, only with stub `pi`, stub `npm`, and a stub `which` in the one `PATH` directory. Redirecting `HOME`, `USERPROFILE`, `PI_CODING_AGENT_DIR`, the XDG directories, `TMPDIR`, and the npm config and cache is necessary and not sufficient: environment redirection alone does not stop a real `npm install -g`. The stub is what keeps a spawn from reaching a real tool.

The CLI resolves `pi` and `npm` through `which`, so the stub `which` must answer
for the stubs that exist and exit 1 for anything else. Without it every tool
looks missing, and with a real `which` a missing stub would fall through to the
host.

```sh
cat > "$bin/which" <<EOF
#!$node_bin
import { existsSync } from "node:fs";
const name = process.argv[2];
const path = "$bin/" + name;
if (!name || !existsSync(path)) process.exit(1);
process.stdout.write(path + "\\n");
EOF
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
chmod 755 "$bin/which" "$bin/pi" "$bin/npm"
```

Every drive then uses `PATH="$bin"` plus the isolated environment, and nothing
else on `PATH`. Assert the invocation log, not only the printed output: an empty
log proves a command spawned nothing, and its JSON lines pin the argv and the
exit status. A stub that exits 0 also proves nothing about Pi's own behavior. If
a drive needs another external command, add a stub for it in `$bin`; do not add a
system directory or the Node install directory to `PATH`.

To model a tool that is not installed, remove its stub and keep the stub `which`,
which then answers not-found: `rm "$bin/pi"`. The CLI must fail before it spawns
anything, and the empty invocation log proves it did not fall back.

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
run Pi extensions, and do not run `scripts/e2e-install.mjs`: it is a live network
driver, not an offline check. It creates private HOME, Pi, XDG, temporary, and
npm state and passes an allowlisted environment to every command. This is not OS
containment. Do not run it without separately authorized effective OS isolation
and disposable installation destinations. See
[packed verification checks](features/install-orchestration.md#offline-packed-verification)
for the stub-only command, state setup, evidence, and limits.

Do not claim extension coverage from package registration or `status` output.

## Evidence and cleanup

Keep proof in the separate `$evidence` directory. After the final drive, stop only processes started by that drive, return to `$repo`, and remove only the exact `$scratch` directory. Confirm the evidence files still exist. Report their path, commands, results, and any unverified features. Use `/maintain-verification-skill` to review this skill when the CLI changes.
