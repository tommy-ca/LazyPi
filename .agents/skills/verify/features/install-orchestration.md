# Offline default-install orchestration

The stateful fake-Pi tests exercise LazyPi's default installation in global and project scope. They run the public CLI with disposable settings and a minimal child environment. The private `PATH` contains only the fixture executables. Unexpected Pi commands and npm fallback fail closed.

Run from the repository root with existing dependencies:

```sh
node --test --test-name-pattern="default install preserves state with stateful fake Pi" test/agent-dir.test.mjs
```

Expected result: two passing tests on POSIX. Windows skips these tests because the private executable fixture uses POSIX launchers.

The tests check:

- The six core sources and their order, exact Pi arguments, and project `-l --approve` flags.
- Final registrations containing the original entries followed by the six installed sources, with no removal calls.
- Preserved pinned current and legacy source objects, their metadata, an external registration, and an existing string registration.
- Unchanged opposite-scope settings and separate configuration and data bytes.
- The six intended blank built-in subagent model overrides, preserved override metadata, and an unchanged custom agent model.
- Successful exit, exact stdout, and empty stderr.

The fake only appends package registrations. It does not install packages, resolve dependencies, access the network, or execute extensions. These tests do not prove live Pi behavior, authentication, interactive picking, update, removal, or extension functionality. The additional state checks protect existing behavior; the six-versus-twelve default selection distinguishes the catalog change from its baseline.

This command is a dedicated automated fixture, not permission to run installation through the [manual verification driver](../SKILL.md). That driver's install, update, and remove prohibition remains unchanged.

## Offline packed verification

`test/e2e-harness.test.mjs` runs the public `scripts/e2e-install.mjs` with fake npm, Pi, and packed-bin executables. Its private PATH contains only fixtures with absolute Node launchers. No npm package download, real Pi, extension execution, or global bootstrap occurs. POSIX runs the tests. Windows skips them because the launchers require POSIX.

For the prerequisite-only task, keep all test state and raw evidence in the authorized writer directory. Run from the repository root with existing dependencies and a foreground timeout of at most 30 seconds:

```sh
repo="$PWD"
node_bin="$(command -v node)"
state="$repo/.atl/evidence/strict-minimal-pstack/runtime/writer-packed"
mkdir -p "$state/home" "$state/tmp" "$state/agent" "$state/config" "$state/data" "$state/cache" "$state/state" "$state/npm-cache"
printf '' > "$state/npmrc"
printf '%s\n' 'node --test test/e2e-harness.test.mjs' > "$state/command.txt"
env -i PATH="$(dirname "$node_bin")" \
	HOME="$state/home" USERPROFILE="$state/home" TMPDIR="$state/tmp" \
	XDG_CONFIG_HOME="$state/config" XDG_DATA_HOME="$state/data" \
	XDG_CACHE_HOME="$state/cache" XDG_STATE_HOME="$state/state" \
	PI_CODING_AGENT_DIR="$state/agent" NPM_CONFIG_CACHE="$state/npm-cache" \
	NPM_CONFIG_USERCONFIG="$state/npmrc" NPM_CONFIG_GLOBALCONFIG="$state/npmrc" \
	"$node_bin" --test test/e2e-harness.test.mjs > "$state/stdout.txt" 2> "$state/stderr.txt"
printf '%s\n' "$?" > "$state/exit.txt"
```

Do not use shell `errexit`. Expected result is exit 0, ten passing tests on POSIX, and empty stderr. Each fixture also records its script argv, stdout, stderr, exit, and observed child environment under `$state/tmp/packed-fixture-*`. Keep these paths for the parent to inspect and remove. Do not delete scratch during this task.

The checks cover every command's private cwd and environment, private tarball destination, Pi preflight ordering, unchanged packed-bin argv and stage order, missing or failing Pi, rejected tarball paths, setup failures, later-stage failures, and cleanup versus `--keep`. The fixture supplies PACKAGES-derived settings so the real script exercises its exact array assertions. It does not validate npm's actual archive contents or Pi's actual behavior.

The live script remains `node scripts/e2e-install.mjs`, with optional `--keep`. Do not run that command for this prerequisite delivery. It requires network access, a pre-existing Pi executable, disposable installation destinations, separate authorization, and effective OS containment. It creates its run root under the caller's temporary directory and reports `sandbox: <path>`. Every npm, Pi, and packed-bin subprocess uses that root as cwd and private HOME, USERPROFILE, Pi, XDG, temp, npm config, and cache paths. Only PATH and the explicit Windows process variables SystemRoot, WINDIR, COMSPEC, and PATHEXT can be inherited. Provider credentials, SSH or session tokens, NODE_OPTIONS, npm configuration, proxies, and Pi overrides are not inherited.

Packing reads the checkout by explicit path but writes the tarball inside the run root. `--keep` retains that root and its tarball even after setup failure. Without `--keep`, cleanup covers setup and later assertion failures. A missing or failing Pi exits before npm runs, so unattended installation cannot bootstrap Pi globally. This private-state boundary is not OS containment. It does not prevent executables from accessing the network or host files, and offline passes do not certify native runtime or security readiness.
