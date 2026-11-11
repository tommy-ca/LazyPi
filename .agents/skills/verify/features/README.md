# LazyPi verification map

Use the setup and isolation in [the verify skill](../SKILL.md) before each drive.

- [Help and version](help.md)
- [Catalog status](status.md)
- [Catalog selection and retirement](catalog.md)
- [Offline default-install orchestration](install-orchestration.md), a dedicated automated fixture rather than a manual drive
- [Local scope](local-scope.md), `--local` on every command that accepts it
- [Update](update.md)
- [Doctor](doctor.md)
- [Remove](remove.md)
- [Native PStack proof preparation](native-pstack-proof.md), offline diagnostic fixtures and the separately authorized hosted-only boundary

## Manual drives versus the automated suite

The coverage is in two halves, and each feature doc states which half covers it.

The automated half is the Node suite under `test/`. It drives the real CLI
through `test/helpers/cli-spawn.mjs`, which builds the same isolated environment
these drives use: stub `pi`, `npm`, and `git` in one private directory,
that directory as the whole `PATH`, and one JSON record per invocation with its
argv and exit status. It asserts exit status, stdout, stderr, spawn argv, and
stored bytes, and `test/cli-isolation-guard.test.mjs` fails the suite when a test
builds a child `PATH` from the inherited one, adds a system directory, or spawns
the CLI outside the helper. It already covers selector defaults and retirement,
install argv, `-l --approve` for local install, raw removal passthrough,
exact-source removal, global `update` delegation, corrupt-settings rejection, and
`doctor`'s successful and warning paths.

The manual half is the drive in each doc below. It exists for the surfaces the
suite does not pin: `doctor`'s failure exit codes, `update --local`, `remove`
with no target or a category name, the `-l --approve` argv of local removal, and
the local override rewrite.

Neither half performs real installation, real removal, or a real update against
a Pi profile, and neither covers interactive picking, authentication, or
extension behavior. Report those surfaces as unverified unless separately
exercised safely.
