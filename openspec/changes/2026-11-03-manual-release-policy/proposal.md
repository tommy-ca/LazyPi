# Keep npm publishing manual and gated

## Why

The dormant dispatchable publisher could publish without running required gates. The user explicitly chose to remove it rather than enable another release path.

## What changes

Delete the release-please workflow, replace its stale README promise with the manual-only policy, and update the Release Flow contract. A regression check prevents a direct npm publisher from reappearing in CI.

## Impact

Existing Linux and Windows verification workflows remain. Manual versioning, tags, interactive 2FA publishing, and post-publish checks remain unchanged. This change publishes no package and provisions no credentials.
