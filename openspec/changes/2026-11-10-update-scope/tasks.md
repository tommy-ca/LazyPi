## Implementation

- [x] Reject `update --local` and `update -l` in argument parsing, before
      settings are read, before any child process starts, and before any file is
      written.
- [x] Exit 2 with
      `update does not support --local: pi cannot update project extensions on their own`
      on stderr and the help text on stdout, matching the other usage rejections.
- [x] Spawn exactly one `pi update --extensions` for plain `update`, from one
      constant that also produces the printed header.
- [x] Pass no `--approve`, no `-l`, and install no catalog source per invocation.
- [x] State the new behaviour in `printHelp` and the README, including that
      project-only update is unsupported because Pi cannot perform it.
- [x] Update the stale descriptions this change replaces, in the one pass the
      review authorized: `test/pstack-retirement.test.mjs` and
      `test/agent-dir.test.mjs` argv/stdout assertions,
      `test/fixtures/strict-minimal-head-oracles.json` `help` oracle (regenerated
      from the live help text; no other oracle entry touched),
      `.agents/skills/verify/features/update.md`, `docs/docs/updating.html`, and
      the two stale `pi update` sentences in `docs/faq.html`.

## Verification

- [x] `node --test test/update-scope.test.mjs` observed RED first: the three
      delegation tests failed on the recorded argv `["update"]` and the header
      `pi update`, and the local-scope test failed with exit 0 and
      `pi update --extensions` in the invocation log instead of a rejection.
- [x] `node --test test/update-scope.test.mjs test/update-selection.test.mjs`
      passes, 7 of 7.
- [x] `npm run spec:validate` passes: 18 active changes and 41 archived items,
      0 failed.
- [x] Differential run against base `c08ace4` from `git archive` in a private
      scratch tree: `status`, `doctor`, `install --yes --only web-access`,
      `remove web-access` and `install --yes --only subagents` produced identical
      stdout, stderr, exit status, stub invocation log, settings bytes, and
      backup bytes. `update` and `update --local` differ, which is this change.
- [x] `node --test` passes, 232 of 232, none skipped. Three of them were
      assertion-only corrections in files outside the original edit surface,
      authorized afterwards by the review: they pinned the argv and help text
      this change replaces, not anything else.
- [x] The regenerated `help` oracle matches the live `lazypi --help` output
      byte for byte, and `git diff` on that fixture is a single line.
- [ ] Not observed: what `pi update --extensions` does to real registrations,
      trusted-project detection, archives, or network state. The stub proves
      LazyPi's argv, header, state preservation, and exit-code passthrough only.
- [x] Formerly stale prose, delivered by the `chore/verification-surface`
      follow-up: `docs/docs/index.html` ("Run `pi update` for installed
      packages"), `docs/docs/philosophy.html` ("`update` remains broad
      `pi update`"), `docs/docs/removing.html` ("stay eligible for broad
      `pi update`"), plus the two requirement sentences of the accumulated
      installer spec under Troubleshooting and Catalog retirement. The spec
      sentences are corrected by the MODIFIED Requirements in this delta; the
      accumulated spec itself is not hand-edited.
- [x] `openspec validate` does not compare a MODIFIED requirement name or its
      scenario text with the live spec, so this delta was checked by reading it
      against `openspec/specs/lazypi/installer/spec.md` line by line. A renamed
      MODIFIED requirement still validates clean, which is a validator gap, not
      a property this change can rely on.
