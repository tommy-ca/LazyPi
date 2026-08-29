# Tasks — Release validation audit: npx/bunx 0.8.0 and cache quirks

## 1. Registry validation of 0.8.0

- [x] 1.1 `npx -y @tommy-ca/lazypi@0.8.0 --version` / `--help` from a neutral
      dir report 0.8.0 and print usage (exit 0)
- [x] 1.2 `bunx @tommy-ca/lazypi@0.8.0 --version` reports 0.8.0 (fresh
      resolve; exit 0)
- [x] 1.3 Published tarball integrity: sha256 of packed `bin/lazypi.mjs`
      matches the repo source; bin mode 755

## 2. Install validation

- [x] 2.1 `npx @tommy-ca/lazypi@0.8.0 --yes` on a full-catalog machine:
      exit 0, "Nothing to do" idempotency, credentials summary correct
- [x] 2.2 `bunx @tommy-ca/lazypi@0.8.0 --yes`: identical no-op exit 0
- [x] 2.3 `status` via packed 0.8.0: 12/12 catalog installed, 0 legacy, 0
      missing; no migrations required

## 3. Findings -> docs

- [x] 3.1 README Troubleshooting: runner-agnostic stale-cache entry (npx
      `~/.npm/_npx` + bunx)
- [x] 3.2 README Troubleshooting: repo-directory `lazypi: not found` quirk
      with remedy
- [x] 3.3 `docs/faq.html`: mirrored FAQ entries

## 4. Specs

- [x] 4.1 Docs-only change, no behavior change: `skip_specs: true` (Recipe 5)
- [x] 4.2 `npm run spec:validate` green; archive the change

## 5. Ship

- [x] 5.1 Fresh review of the diff
- [x] 5.2 Commit and push to the fork; CI green