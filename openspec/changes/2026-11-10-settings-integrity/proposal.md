# Settings file integrity

## Why

An audit of the settings write path found three classes of defect that the
existing contract does not cover. Writes were not atomic: `writeSettings`
copied a backup and then truncated the live file in place, so a failed write
left unterminated JSON. Backup names were truncated to whole seconds, so two
mutations in one second overwrote the only recovery artifact. And the document
was never shape-checked: a top-level array accepted the override write, dropped
it, and exited 0 with a backup claiming a change happened; a string `subagents`
value was re-keyed into `{"0":"y","1":"e",...}` at exit 0; and a numeric
top-level value threw a raw `TypeError` at exit 1 where the corrupt-settings
scenario demands a printed error and exit 2.

Separately, a repository could commit `.pi/settings.json` as a symlink. Because
every filesystem call followed it, `install --local` copied the target's bytes
into the working tree as a `.bak` file and then overwrote the target. Pointed at
`~/.pi/agent/auth.json`, OAuth access and refresh tokens landed somewhere
`git add -A` picks up, and the user was silently logged out.

The existing "Corrupt settings" scenario covers only invalid JSON. It does not
cover a valid-JSON document of the wrong shape, a non-regular settings path, or
what a backup is named.

## What changes

- A settings document is validated before any use, and a wrong shape fails
  closed with the same printed error and exit 2 contract as invalid JSON.
- Writes are atomic and refuse a non-regular target.
- Backup names are collision-free.
- Strings read from settings or auth are control-escaped before printing.
- A non-object `auth.json` yields no providers.
- `--version` no longer swallows an invalid argument.

## Impact

- Affected specs: `lazypi/installer`
- Affected code: `bin/lazypi.mjs` settings read/write path, `detectAuth`,
  `formatAuthSummary`, `main`
- New tests: `test/settings-integrity.test.mjs`
