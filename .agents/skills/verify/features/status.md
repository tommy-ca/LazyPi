# Catalog status

Status reads registrations, not loaded packages. Run `status` with the private environment and evidence capture in the verify skill. An empty profile reports 0/6, core 0/6 and optional 0/0.

For an existing-settings check, write only disposable fixture settings:

```json
{"packages":["git:github.com/tommy-ca/pstack@older-audit","npm:pi-btw@0.1.0",{"source":"npm:@zenspc/pi-pstack@1","metadata":{"fixture":true}}]}
```

Save the bytes before invoking status. Expect the canonical pin as installed and the other two registrations as Other, not aliases or legacy migrations. Require exit 0, empty stderr, and unchanged settings/backup bytes. Capture command, stdout, stderr, exit, and comparison separately.

Retirement does not uninstall, disable, freeze updates, or delete data. Raw removal passthrough remains unchanged, but retired IDs no longer resolve catalog or legacy sources. Use exact installed sources. Do not run removal or update through the manual driver.

These checks do not prove loading, dispatch, security, recovery, or native readiness.
