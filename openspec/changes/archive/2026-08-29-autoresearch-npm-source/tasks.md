# Tasks — Autoresearch moves to the npm source

## 1. Research

- [x] 1.1 `npm view pi-autoresearch`: exists, 1.6.2, same davebcn87
      repository — npm is the correct primary channel

## 2. Installer

- [x] 2.1 `autoresearch` source → `npm:pi-autoresearch`; git form added to
      `legacySources`
- [x] 2.2 Operator install migrated live: legacy git removed, npm source
      installed, settings hold only `npm:pi-autoresearch`

## 3. Docs

- [x] 3.1 autoresearch page updated (npm source, auto-migration note)

## 4. Spec delta

- [x] 4.1 Optional sources scenario: `autoresearch` SHALL resolve to
      `npm:pi-autoresearch`; git source SHALL remain in `legacySources`

## 5. Validation

- [x] 5.1 `npm test` green (20/20)
- [x] 5.2 `npx openspec validate --changes` green; `openspec archive --yes`
- [x] 5.3 `npm run spec:validate` green

## 6. Ship

- [x] 6.1 Fresh review of the diff
- [x] 6.2 Commit and push to the fork; CI green