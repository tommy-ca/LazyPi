# Give packed verification private process state

## Why

The packed E2E script packs into the checkout before it creates disposable state. Setup failures bypass cleanup, npm and Pi seed calls inherit host state, and a missing Pi can reach unattended global bootstrap.

## What changes

Keep the existing script and catalog-derived stages. Create one private run context before any subprocess, with an explicit cwd and an allowlisted environment. Pack the checkout into that root, install the tarball there, and invoke its bin with Node. Require a successful Pi preflight before npm runs. Extend cleanup and `--keep` to setup failures.

Replace structural source assertions with offline public-script tests using fail-closed npm, Pi, and packed-bin fixtures. Document private state without calling it OS containment or native runtime proof.

## Impact

No CLI, catalog, workflow, dependency, sandbox setting, or release change. Live E2E remains networked and requires separate authorization and effective OS containment. This delivers prerequisite T2b only, not native integration or shipping.
