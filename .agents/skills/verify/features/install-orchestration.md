# Offline default-install orchestration

The stateful fake-Pi tests exercise LazyPi's default installation in global and project scope. They run the public CLI with disposable settings and a minimal child environment. The private `PATH` contains only the fixture executables. Unexpected Pi commands and npm fallback fail closed.

Run from the repository root with existing dependencies:

```sh
node --test --test-name-pattern="default install preserves state with stateful fake Pi" test/agent-dir.test.mjs
```

Expected result: two passing tests on POSIX. Windows skips these tests because the private executable fixture uses POSIX launchers.

The tests check:

- The six core sources and their order, exact Pi arguments, and project `-l --approve` flags.
- Final registrations containing the original entries followed by the six installed sources, with no removal calls.
- Preserved pinned current and legacy source objects, their metadata, an external registration, and an existing string registration.
- Unchanged opposite-scope settings and separate configuration and data bytes.
- The six intended blank built-in subagent model overrides, preserved override metadata, and an unchanged custom agent model.
- Successful exit, exact stdout, and empty stderr.

The fake only appends package registrations. It does not install packages, resolve dependencies, access the network, or execute extensions. These tests do not prove live Pi behavior, authentication, interactive picking, update, removal, or extension functionality. The additional state checks protect existing behavior; the six-versus-twelve default selection distinguishes the catalog change from its baseline.

This command is a dedicated automated fixture, not permission to run installation through the [manual verification driver](../SKILL.md). That driver's install, update, and remove prohibition remains unchanged.
