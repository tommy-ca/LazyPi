## Context

Node rejects `.cmd` with `shell` unset (`EINVAL`). remaining-seams wraps
ComSpec argv. cmd `/s` eats quotes when the `/c` remainder starts with `"`.
`call` makes the first character `c`.

## Goals / Non-Goals

**Goals:**
- Program Files `.cmd` paths stay one token
- `&` in a source stays one argv slot
- No joined shell string, no `shell: true` default

**Non-Goals:**
- Peel `.cmd` to `node.exe`
- Enable `windows-smoke` on pull_request
- Parse npm shim text

## Decisions

- argv is `/d /s /c call "program" ...args`
- Quote the program always. Quote remaining args when empty or when they
  match spaces or cmd metacharacters. `%` becomes `%%` inside quotes.
- `windowsVerbatimArguments: true` only on the ComSpec plan
- Do not restore `cross-spawn` or a denylist plus `shell: true`

## Risks / Tradeoffs

- We own cmd quoting. A missed quote is our bug.
- `ComSpec` pointing at PowerShell is out of scope. Default is `cmd.exe`.
