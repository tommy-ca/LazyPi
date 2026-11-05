# Add pi-verdict permission gate to optional catalog

## Why

LazyPi's catalog has no permission-gate package. Pi runs every tool call with its own privileges, and pi-verdict adds a Claude Code-style auto-mode gate that classifies each call as allow, deny, or ask, failing closed on uncertainty. It is MIT-licensed, actively maintained, and compatible with pi >= 0.99.0.

## What changes

- Add `verdict` to the optional tier with source `npm:pi-verdict`.
- Add a dedicated docs page and sidebar entry.
- Update README, packages index, philosophy, and installation counts from 17 to 18.
- Update catalog contract tests for the new package.

## Impact

No changes to existing packages, install logic, or migration paths. The new package installs through the standard `pi install` flow without special handling.
