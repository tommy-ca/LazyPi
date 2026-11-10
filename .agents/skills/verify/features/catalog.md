# Catalog selection

The unpublished candidate has six core entries in order: pstack, subagents, sandbox, verdict, pi-ask-user, web-access. No optional catalog entries remain. Use the private fake-executable environment described in install-orchestration.md, not a real Pi profile.

```sh
node --test test/catalog-contract.test.mjs test/catalog-docs.test.mjs test/pstack-retirement.test.mjs test/install-selection-effects.test.mjs
```

Default `--yes`, `--only core`, `--only core,optional`, and `--except optional` select all six. The picker preselects all six. `--only optional` and `--except core` select nothing, exit 0 before setup, and leave settings, backups, and package-command counters unchanged. `--only web-access` still selects Web Access alone; `--except web-access` still selects the other five. Status reports core counts out of six and optional counts out of zero.

The tests check preserved pins, object metadata, order, scopes, unmanaged registrations, broad updates, and raw removal passthrough. Docs and active specs must agree with the catalog. Historical deltas remain historical. Fake tools and registration do not prove native loading, provider behavior, authorization, recovery, or readiness. The frozen native discovery probe still excludes Web Access under its separate authorization.
