## Why

The remaining-seams ComSpec wrap is `cmd.exe /d /s /c <path> <args>`.
`npm.cmd` often lives under `Program Files`. cmd `/s` strips the first and
last quote when the remainder after `/c` starts with `"`. Without `call`
and per-arg quotes, that path splits. Catalog sources with `&` must stay
their own argv slot.

## What Changes

- Wrap `.cmd`/`.bat` as `/d /s /c call` plus a quoted program plus quoted
  args that need it.
- Force `shell: false` and `windowsVerbatimArguments: true` on that plan.
- Pin `windowsSpawnArgv` for a Program Files path and an `&` source.

## Capabilities

### New Capabilities

- ComSpec `call` plus cmd quoting so Program Files `.cmd` paths and
  metacharacters in sources survive `/s`.

### Modified Capabilities

- Spawn argv: `call` before the quoted program. Sources stay extra argv
  elements. No `shell: true` default.

## Impact

- `bin/lazypi.mjs` `windowsSpawnArgv` / `spawnCommand`
- `test/spawn-command.test.mjs`
- packed CLI smoke uses the same wrap
