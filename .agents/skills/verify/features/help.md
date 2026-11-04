# Help and version

## Sub-features

The CLI displays usage, commands, options, and its version.

## How to get to it (user POV)

Run LazyPi with `--help` or `--version`.

## Driving it with the CLI

Use the isolated environment from the verify skill. Run the CLI with `--help`, capture its output and exit status, and check that it shows the commands relevant to the change. Run `--version` as the readiness check and compare it with the checkout's `package.json`. It does not run `lazypi doctor`.

## Gotchas

Help alone does not prove a command works. These drives do not exercise Pi or any extension.
