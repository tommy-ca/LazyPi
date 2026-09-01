## 1. Spec

- [x] 1.1 MODIFIED Commands Spawn argv: `call` plus quoted program

## 2. Code

- [x] 2.1 `windowsSpawnArgv` emits `/d /s /c call` and quotes
- [x] 2.2 ComSpec spawn sets `shell: false` and `windowsVerbatimArguments: true`

## 3. Tests

- [x] 3.1 Program Files `.cmd` path is quoted after `call`
- [x] 3.2 `&` in a source is its own quoted slot
- [x] 3.3 Unix and `.exe` paths stay unwrapped
