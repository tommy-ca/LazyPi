# Tasks — Refresh installed catalog versions to the latest proven releases

## 1. Audit table

- [x] 1.1 npm view latest for all 17 catalog sources; diff against
  installed pins (recorded in the proposal)

## 2. Refresh operations

- [x] 2.1 `pi install npm:@zigai/pi-mention-skill@0.9.0`
- [x] 2.2 `pi install npm:@narumitw/pi-goal@0.54.4`
- [x] 2.3 `pi install npm:@narumitw/pi-btw@0.56.0`
- [x] 2.4 `pi install npm:pi-web-access@0.27.0`
- [x] 2.5 `pi install npm:@ff-labs/pi-fff@0.10.6`
- [x] 2.6 `pi install npm:@quintinshaw/pi-dynamic-workflows@3.10.0`
- [x] 2.7 `pi install npm:pi-autoresearch@1.7.0`
- [x] 2.8 Evidence: settings.json holds all 17 pins at the latest versions

## 3. Verification

- [x] 3.1 `node bin/lazypi.mjs status` — no stale pins shown
- [x] 3.2 `node bin/lazypi.mjs doctor` — all checks pass
- [x] 3.3 Spot-check dependency resolution for a refreshed package

## 4. Record

- [x] 4.1 Exploration `catalog-refresh-audit.md` written
- [x] 4.2 CHANGELOG entry
- [x] 4.3 Archived and re-validated

Landed under conventional commits (docs/chore for the environment refresh).