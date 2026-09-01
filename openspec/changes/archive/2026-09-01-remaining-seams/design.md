# Design: remaining installer seams

## Context

Stay in `bin/lazypi.mjs`. Spawn already resolves `pi`/`npm` then calls
`spawnSync` with `buildSpawnOptions` (no win32 `shell: true` default).
That is not enough for `.cmd`/`.bat`. `doctor` `warn()` defaults
`{ fatal: true }`. `status` already prints `n/PACKAGES.length`.
`resolveSelection` already subtracts `--except` from `PACKAGES`.

## Goals / Non-Goals

**Goals:**

- Invoke Windows `.cmd`/`.bat` as ComSpec argv without joining sources
- Make `doctor` warnings non-fatal by default
- Show core and optional counts on `status`
- Pin `--except todos` at 16 ids
- Drop Search Tools from the installer spec

**Non-Goals:**

- Splitting `bin/lazypi.mjs`
- Restoring a fat catalog
- Changing `--yes` 12 versus TTY 17
- Changing `--except` to subtract from core only
- Restoring `spawnSync` `shell: true` or joined command strings
- Changing Catalog Model Skill arguments source WHEN
- Live Windows CI in this change

## Decisions

`windowsSpawnArgv(resolved, args, platformName)` returns `{ command, args }`.
On win32, a path matching `/\.(cmd|bat)$/i` becomes
`{ command: process.env.ComSpec || "cmd.exe", args: ["/d", "/s", "/c", resolved, ...args] }`.
Otherwise `{ command: resolved, args }`. `spawnCommand` uses that helper and
sets `shell: false` for the `.cmd`/`.bat` path. Sources stay extra argv
elements.

`commandPath` probes with `where`/`which` through `spawnCommand`. `where.exe`
is not a `.cmd`, so the wrapper does not fire.

Rejected: joining `"${resolved}"` plus args into one `/c` string. That is
the interpolation the spawn contract forbids.

Rejected: peeling `.cmd` to `node.exe`. Distinct from this wrapper.

`warn(msg, { fatal = false } = {})`. `fail` still increments `problems`.
Git missing, settings missing, and empty `pi --version` call `warn()` with
no override.

`status` keeps the `Installed from LazyPi catalog (n/PACKAGES.length)`
header. The next line is `core a/A, optional b/B` from PACKAGES
categories. Export `resolveSelection` for the `--except todos` pin.

## Risks / Trade-offs

ComSpec argv is unit-tested, not proven on a live win32 box in this
change. `windows-smoke` stays `workflow_dispatch`. packed-cli-smoke uses
the same helper so a later Windows run exercises the wrap.
