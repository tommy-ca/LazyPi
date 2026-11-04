# Catalog status

## Sub-features

Status reports catalog registrations. This recipe checks only the empty-settings case.

## How to get to it (user POV)

Run `lazypi status`.

## Driving it with the CLI

With the empty isolated settings from the verify skill, run `status` using the same environment as the readiness check. Capture output and exit status. Compare the displayed installed count with zero and the total with the current catalog. Confirm that the isolated settings remain unchanged.

## Gotchas

Status reads registrations, not installed package contents. It cannot prove that Pi loads an extension. Do not point it at real settings because it prints registered sources.
