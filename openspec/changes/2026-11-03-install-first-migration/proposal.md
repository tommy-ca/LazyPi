# Install replacements before legacy cleanup

## Why

Removing a working legacy package before replacement installation can leave users without either package when installation fails. The user approved installing updated replacements first.

## What changes

Install missing catalog replacements before removing legacy sources. Keep the existing cleanup-only path when the replacement is already present. Failed cleanup remains a failure but retains the replacement.

## Impact

Preserve exact source pins, object metadata on rejected installs, scope flags, and retry convergence. Stateful isolated CLI tests cover both scopes. The existing real-Pi CI stage now starts without the replacement so it exercises actual migration rather than cleanup alone.
