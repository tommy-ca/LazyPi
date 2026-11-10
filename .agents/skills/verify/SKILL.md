---
name: verify
description: "Use when verifying LazyPi CLI changes or recording isolated user-visible evidence."
---

# Verify LazyPi

Run from the repository root. This skill covers isolated CLI checks, not live extension behavior. Never use real Pi settings, credentials, package stores, or a user's working directory. A temporary HOME is not a network sandbox.

## Launch and readiness

Find Node with `command -v node` and confirm dependencies are already installed. Do not install dependencies or run `npx` as a verification shortcut. Create a private scratch directory and a separate evidence directory outside the checkout:

```sh
repo="$PWD"
node_bin="$(command -v node)"
scratch="$(mktemp -d)"
evidence="$(mktemp -d)"
mkdir -p "$scratch/home" "$scratch/agent" "$scratch/work"
printf '{"packages":[]}\n' > "$scratch/agent/settings.json"
cd "$scratch/work"
run="$(mktemp -d "$evidence/version.XXXXXX")"
printf '%s\n' 'node bin/lazypi.mjs --version (isolated environment)' > "$run/command.txt"
env -i PATH="$(dirname "$node_bin"):/usr/bin:/bin" HOME="$scratch/home" USERPROFILE="$scratch/home" PI_CODING_AGENT_DIR="$scratch/agent" "$node_bin" "$repo/bin/lazypi.mjs" --version > "$run/stdout.txt" 2> "$run/stderr.txt"
rc=$?
printf '%s\n' "$rc" > "$run/exit.txt"
```

This readiness check succeeds only when the recorded exit status is zero and `stdout.txt` contains the expected checkout version. It does not run `lazypi doctor` or check Pi, authentication, or package health. Do not use shell `errexit`, which would prevent recording a failed exit. Each CLI invocation is a fresh process. Repeat the readiness check after an unexpected failure, creating a new `$run` directory each time. Keep the exact scratch and evidence paths.

## Drive

Use the feature map in `features/README.md`, which also states the split between these manual drives and the automated suite. Run commands with the same `env -i`, isolated directories, Node path, and working directory as the readiness check. Create a new directory under `$evidence` for every invocation. Record the command, stdout, stderr, exit status, and relevant scratch state separately, including on failure. Assert the visible result and side effects, not just successful exit. A fake Pi proves only LazyPi's orchestration, not actual Pi or extension functionality.

## Stub-first commands

`install`, `status`, `update`, `doctor`, and `remove` may be driven, including with `--local`, only when stub `pi` and stub `npm` executables are the first `PATH` entries. Redirecting `HOME`, `USERPROFILE`, `PI_CODING_AGENT_DIR`, the XDG directories, `TMPDIR`, and the npm config and cache is necessary and not sufficient: environment redirection alone does not stop a real `npm install -g`. The stub is what keeps a spawn from reaching a real tool.

```sh
mkdir -p "$scratch/bin"
printf '#!/bin/sh\ncase "$1" in --version) echo 0.5.0-fixture;; esac\nprintf "pi %%s\\n" "$*" >> "%s"\nexit 0\n' "$scratch/calls" > "$scratch/bin/pi"
printf '#!/bin/sh\nprintf "npm %%s\\n" "$*" >> "%s"\nexit 0\n' "$scratch/calls" > "$scratch/bin/npm"
chmod 755 "$scratch/bin/pi" "$scratch/bin/npm"
: > "$scratch/calls"
```

Every drive then uses `PATH="$scratch/bin:/usr/bin:/bin"` plus the isolated environment. Assert the invocation log, not only the printed output: an empty log proves a command spawned nothing, and its exact lines pin the argv. A stub that exits 0 also proves nothing about Pi's own behavior.

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
