# Catalog status

## Sub-features

Status reports current, legacy, and non-catalog registrations. Check both empty settings and a synthetic existing-settings fixture.

## How to get to it (user POV)

Run `lazypi status`.

## Driving it with the CLI

With the empty isolated settings from the verify skill, run `status` using the same environment as the readiness check. Capture output and exit status. Compare the displayed installed count with zero and the total with the current catalog. Confirm that the isolated settings remain unchanged.

For an existing-settings check, replace only the scratch settings with:

```json
{"packages":["npm:@narumitw/pi-btw@0.63.4","npm:pi-memory-md@0.1.38","npm:external-example"]}
```

Save a copy before running `status` again. Check that the output identifies the pinned BTW source, the legacy Memory source, and the external package. Compare the settings file with the saved copy byte for byte. Record output, stderr, exit status, and the comparison in a new evidence directory.

## Gotchas

Status reads registrations, not installed package contents. It cannot prove that Pi loads an extension. Do not point it at real settings because it prints registered sources.
