# Tasks — Fix local-project installs and unknown-arg exit code

## 1. Audit findings (done)

- [x] 1.1 Runner audit (npx + bunx) found `install --local` fails on un-approved projects (pi trust gate)
- [x] 1.2 Runner audit found unknown args print help but exit 0 (default 2 unreachable)

## 2. Code

- [x] 2.1 Local pi spawns (install, remove, legacy migration) append `--approve`
- [x] 2.2 Unknown argument exits 2 (help still printed)
- [x] 2.3 `npm test` green

## 3. Spec delta

- [x] 3.1 Commands: "Local install trust" scenario (`--approve` on local pi spawns)
- [x] 3.2 Commands: "Unknown argument" scenario (help + exit 2)
- [x] 3.3 `npm run spec:validate` green

## 4. Release and verify

- [x] 4.1 Archive the change (deltas applied to main specs)
- [x] 4.2 Bump to 0.6.5, publish (public scope), verify with `npm view`
- [x] 4.3 Re-run the npx + bunx audit matrix against the registry artifact
- [x] 4.4 Commit, push to origin