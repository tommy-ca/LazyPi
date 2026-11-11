# Update scope follows Pi's update contract

## Why

`cmdUpdate` asked for different Pi work depending on the scope flag: the global
path ran `pi update` and the local path ran `pi update --extensions`.

Pi v1.5.0 primary sources — `packages/coding-agent/docs/cli.md`,
`src/package-manager-cli.ts` and `src/core/package-manager.ts` — establish four
facts that the old delegation contradicted:

- bare `pi update` self-updates the Pi harness;
- `pi update --extensions` updates registered extension packages across the
  global scope and projects Pi already trusts;
- `update` rejects `-l`/`--local`;
- `--approve` changes trust, not update scope.

So the plain path silently asked Pi to upgrade itself instead of updating the
extensions a LazyPi operator installed, the local path did something the global
path did not, and neither matched the request "update my extensions". A
project-only extension update has no Pi command behind it at all.

The human decided the behaviour on 2026-11-10: reject `--local` explicitly, and
make plain `update` request extension-package updates.

## What changes

- `update --local` and `update -l` are refused in argument parsing, so the
  command fails before LazyPi reads settings, spawns a child, or writes a file.
  It exits 2 — the documented usage-error code — with one message naming the
  reason, and the help text on stdout like the other usage rejections.
- Plain `update` spawns exactly one `pi update --extensions`. It never requests
  a harness self-update, never passes `--approve`, never passes `-l`, and never
  installs catalog sources one at a time.
- The printed header and the spawned argv now come from one constant, so the
  header cannot describe a command that is not the one that runs.
- The help text and README state that `update` runs `pi update --extensions`,
  that it never self-updates the Pi harness, and that project-only update is
  unsupported because Pi cannot perform it.

## Impact

- Affected specs: `lazypi/installer`
- Affected code: `bin/lazypi.mjs`; `test/update-scope.test.mjs` is new;
  `test/update-selection.test.mjs` had one assertion rewritten, because plain
  `update` now requests extension-package updates. Three fixtures that pinned the
  replaced argv and help text — `test/pstack-retirement.test.mjs`,
  `test/agent-dir.test.mjs`, and the `help` oracle in
  `test/fixtures/strict-minimal-head-oracles.json` — were corrected in an
  authorized follow-up pass, assertion text only.
- Behaviour change: `update --local` changes from exit 0 with
  `pi update --extensions` to exit 2 with a rejection. That is the requested
  correction, not a side effect.
- Behaviour change: the global header line changes from `pi update` to
  `pi update --extensions`, because the printed text is now the spawned command.
- Documentation changed: `README.md`, `lazypi --help`,
  `docs/docs/updating.html`, the two stale sentences in `docs/faq.html`, and
  `.agents/skills/verify/features/update.md`, which now describes the single
  `pi update --extensions` delegation and the `--local` rejection.
- Follow-up landed in the `chore/verification-surface` unit: the three prose
  sites (`docs/docs/index.html`, `docs/docs/philosophy.html`,
  `docs/docs/removing.html`) now name `pi update --extensions`, and this change
  carries MODIFIED Requirements for Troubleshooting and Catalog retirement, so
  archiving it no longer leaves the live spec asserting both that LazyPi never
  asks Pi for a harness self-update and that the docs should tell operators to
  run one.
- Not observed: what `pi update --extensions` does to real registrations,
  trusted-project detection, or archives. Every assertion here is a stub
  obligation, not Pi behaviour.
