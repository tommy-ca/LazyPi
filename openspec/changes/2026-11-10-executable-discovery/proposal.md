# Executable discovery without an external lookup tool

## Why

`bin/pi-host.mjs` resolved `pi` and `npm` by spawning the external `which`
command. `which` is itself a program that can be missing, and when it was, a
present `pi` looked absent. `install` then offered a global npm bootstrap, and
in this repository that path already ran one real
`npm install -g @earendil-works/pi-coding-agent`, which created a `pi` symlink
that competed with the operator's managed harness.

The defect is reported as finding S3 of the corpus audit and reproduced as T9:
the lookup consulted a program instead of the `PATH` the CLI was given.

Two consequences followed. A correct fixture could not model "`pi` is present"
without also stubbing `which`, because the stub had to answer a question the CLI
asked indirectly. And the `PATH` contract the specification states — "without a
`pi` executable on PATH" — was not what the code read.

## What changes

- Resolution walks `PATH` directly: entries are visited in order, an empty entry
  is skipped, and the first entry naming a regular file with an execute bit wins.
- `statSync` follows a symlink to the file it names, so a managed shim still
  resolves; a symlink to a non-executable file does not.
- An unset `PATH` resolves nothing, which is the same outcome as a clear
  not-found instead of a crash.
- The Windows branch keeps asking `where`, because a `.cmd` shim needs its own
  preference order, and it keeps `pickWindowsWhereHit`.
- `hasCmd`, `commandPath`, and `spawnCommand` keep their existing signatures and
  return shapes. No cache across lookups, no policy object, no generator.

## Impact

- Affected specs: `lazypi/installer`
- Affected code: `bin/pi-host.mjs`; `test/executable-discovery.test.mjs` is new;
  `test/install-selection-effects.test.mjs` models an absent `pi` by staging its
  stub out of `PATH` instead of making `which` answer not-found, and
  `test/cli-isolation-guard.test.mjs` asserts the CLI starts no lookup tool.
- Runtime behaviour change: a machine without `which` installs normally instead
  of attempting a global npm install.
- Out of scope: the verification skill's feature docs in `.agents/skills/verify/`
  still describe a stub `which` that `doctor` asks; that wording now trails the
  code and is recorded as a follow-up rather than changed here.
- Unobserved platform: native Windows resolution is unchanged code and was not
  exercised on this host.
