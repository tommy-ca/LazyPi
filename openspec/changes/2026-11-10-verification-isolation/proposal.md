# Verification fixture isolation

## Why

The test suite could reach real tools. Fixtures prepended their stub bin
directory to the inherited `PATH`, forced `/usr/bin` and `/bin` onto a child
`PATH`, or added the running Node install directory, which on this host also
holds a real `npm`. A test path in this repository already ran a real
`npm install -g` once. Two authorized baseline verification attempts failed on
the same class of assumption: they guessed a filesystem path for a dependency
instead of resolving it from package metadata.

The defect is the fixture, not the product. A census over `test/` and `scripts/`
found 22 sites before the change and 13 after it, and every remaining site is
either a `scripts/` entry point outside this change or a fixture-owned fake
agent tree.

The active installer specification states the opposite contract today, in
`### Requirement: Executable CI contracts`, `#### Scenario: Portable update
fixture`: "its mock Pi SHALL use a `.cmd` launcher and retain the system PATH".
Retaining the system PATH is exactly what made a real tool reachable.

## What changes

- One shared helper, `test/helpers/cli-spawn.mjs`, builds every child environment
  for the CLI. Its `PATH` holds a single private stub directory and nothing else.
- Each stub starts through an absolute `#!${process.execPath}` shebang, so it
  needs no `PATH` lookup, and each invocation is recorded as JSON with its argv
  and exit status.
- A missing stub breaks the test with a printed message. Only an absence a test
  declares, through `removeStub` or `mayBeAbsent`, may answer a lookup with
  not-found.
- `test/cli-isolation-guard.test.mjs` fails the suite when any file under `test/`
  builds a child `PATH` from the parent environment, names a system directory, or
  spawns the CLI without the helper. The guard proves its own rules against sample
  sources instead of being trusted.
- The verification skill states the same rule, so a manual drive matches what the
  suite enforces.

## Impact

- Affected specs: `lazypi/installer`
- Affected code: `test/` fixtures only, plus `.agents/skills/verify/`
- New files: `test/helpers/cli-spawn.mjs`, `test/cli-isolation-guard.test.mjs`
- Out of scope: `scripts/e2e-install.mjs` and `scripts/native-pstack-proof.mjs`
  still compose parent-derived environments; they are live-proof entry points, not
  suite fixtures, and they are recorded as follow-ups.
- Unobserved platform: the helper's Windows `.cmd` launcher was not exercised on
  this host.
