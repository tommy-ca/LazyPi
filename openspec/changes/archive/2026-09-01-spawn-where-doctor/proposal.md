## Why

The live Doctor environment AND already says unpinned git heads **outside
the catalog**. The code warns on every unpinned `git:github.com/owner/repo`,
including catalog `legacySources`. `where` returns several lines. The first
can be an extensionless shim. `ComSpec` can be PowerShell.

## What Changes

- Prefer `.cmd`/`.bat`/`.exe` from `where` output.
- Resolve ComSpec to `cmd.exe` (System32 if `ComSpec` is not cmd).
- Warn unpinned git only when the source is not a catalog or legacy match.

## Capabilities

### Modified Capabilities

- Spawn argv: Windows PATH probe prefers a batch or PE hit. ComSpec is cmd.
- Doctor environment: unpinned git warn is outside the catalog only.

## Impact

- `commandPath`, `windowsSpawnArgv` ComSpec, `cmdDoctor`
- Tests for where-line pick and doctor git filter
