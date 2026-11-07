# Complete selection before Pi setup

## Why

Interactive installation currently offers Pi bootstrap before users finish selecting packages. Cancelling selection or choosing no packages must not install Pi or change settings.

## What changes

- Complete the existing interactive selection before checking for or installing Pi.
- Return successfully for cancelled or empty selections without npm, Pi, settings, backup, or model changes.
- Retain settings validation, selector behavior, catalog order, model overrides, and migration behavior.

## Impact

Only install control flow changes. Offline public CLI tests use fake npm and Pi executables, with a Linux pseudo-terminal for real selection prompts. They do not prove native extension behavior or authorize catalog promotion.
