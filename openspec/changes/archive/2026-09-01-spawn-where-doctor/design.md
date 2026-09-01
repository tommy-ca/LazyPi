## Context

73425e7 shipped ComSpec `call` quoting. Leftover architect notes: first
`where` line, PowerShell ComSpec, doctor git filter vs spec.

## Goals / Non-Goals

**Goals:**
- Match doctor spec "outside the catalog"
- Prefer a spawnable Windows hit from `where`
- ComSpec is cmd.exe

**Non-Goals:**
- Peel `.cmd` to node.exe
- Drop Skill arguments source WHEN
- Enable windows-smoke on pull_request

## Decisions

- `pickWindowsWhereHit` scores `.cmd`/`.bat`/`.exe`/`.com` over extensionless
- `windowsComSpec` uses ComSpec only when it ends with `cmd.exe`
- Catalog-managed = `sourcesMatch` current source or legacySources
- Keep Skill-args WHEN

## Risks / Tradeoffs

- Preferring `.cmd` over a later `.exe` is the npm-global default
- A real Windows `where` order is still unproven in CI
