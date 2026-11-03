# Reject unsafe CLI paths

## Why

Non-install commands silently ignore install selectors. An empty unattended selection can install Pi, and doctor can report failed version execution as success.

## What changes

- Reject `--only` and `--except` outside install before command execution.
- Return successfully for an empty unattended selection without setting up Pi.
- Treat failed version execution as a nonfatal doctor warning.

## Impact

The catalog and ordinary command behavior stay unchanged. Regression probes use isolated settings and external-command mocks.
