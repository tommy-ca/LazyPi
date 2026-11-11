// Pi's own contract decides what `lazypi update` may ask for.
//
// Bare `pi update` self-updates the Pi harness, `pi update --extensions`
// updates registered extension packages across the global scope and projects Pi
// already trusts, Pi rejects `-l` for update, and `--approve` changes trust
// rather than scope. A project-only extension update therefore has no Pi
// command behind it, so LazyPi rejects it instead of pretending.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const LOCAL_REJECTION = "update does not support --local: pi cannot update project extensions on their own\n";

function seed(sandbox) {
	mkdirSync(sandbox.agent, { recursive: true });
	mkdirSync(join(sandbox.work, ".pi"), { recursive: true });
	writeFileSync(
		sandbox.settingsPath(),
		JSON.stringify({ packages: ["npm:pi-subagents"], trustedProjects: { "/elsewhere": true } }, null, 2) + "\n",
	);
	writeFileSync(sandbox.settingsPath(true), JSON.stringify({ packages: ["npm:pi-web-access"] }, null, 2) + "\n");
	writeFileSync(sandbox.settingsPath() + ".fixture.bak", "global backup\n");
	writeFileSync(sandbox.settingsPath(true) + ".fixture.bak", "local backup\n");
}

function state(sandbox) {
	const read = (path) => {
		try {
			return readFileSync(path, "utf8");
		} catch {
			return null;
		}
	};
	return {
		globalBytes: read(sandbox.settingsPath()),
		localBytes: read(sandbox.settingsPath(true)),
		globalBackups: sandbox.backups(sandbox.agent),
		localBackups: sandbox.backups(join(sandbox.work, ".pi")),
	};
}

// R1
test("update --local is rejected before any child runs and before any file is written", (t) => {
	const sandbox = createCliSandbox(t);
	seed(sandbox);
	const before = state(sandbox);
	const help = sandbox.run(["--help"]);

	for (const args of [["update", "--local"], ["update", "-l"]]) {
		const result = sandbox.run(args);
		assert.equal(result.status, 2, `${args.join(" ")}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.equal(result.stdout, help.stdout, `${args.join(" ")} must print the same help as --help`);
		assert.equal(result.stderr, LOCAL_REJECTION);
	}

	assert.deepEqual(sandbox.external(), [], "a rejected scope must start no child process");
	assert.deepEqual(state(sandbox), before);
});

// R2
test("plain update requests extension-package updates and never self-updates the harness", (t) => {
	const sandbox = createCliSandbox(t);
	seed(sandbox);
	const before = state(sandbox);

	const result = sandbox.run(["update"]);

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(result.stderr, "");
	assert.equal(result.stdout, "pi update --extensions\n");
	assert.deepEqual(sandbox.external().map((record) => record.argv), [["update", "--extensions"]]);
	assert.deepEqual(state(sandbox), before);
});

// R3
test("update neither overrides project trust nor installs packages one source at a time", (t) => {
	const sandbox = createCliSandbox(t);
	seed(sandbox);
	const before = state(sandbox);

	const result = sandbox.run(["update"]);
	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);

	const calls = sandbox.external();
	assert.deepEqual(calls.map((record) => record.command), ["pi"], "update must ask pi and nothing else");
	const argv = calls[0].argv;
	assert.deepEqual(argv, ["update", "--extensions"]);
	for (const forbidden of ["--approve", "-l", "--local", "install"]) {
		assert.ok(!argv.includes(forbidden), `update must not pass ${forbidden}`);
	}
	assert.deepEqual(state(sandbox), before, "update must not rewrite saved project trust");
});

// R4
test("help and README describe extension updates and the unsupported project-only scope", (t) => {
	const sandbox = createCliSandbox(t);
	const help = sandbox.run(["--help"]);
	assert.equal(help.status, 0);

	assert.match(help.stdout, /pi update --extensions/);
	assert.match(help.stdout, /update rejects --local and exits 2/);
	assert.doesNotMatch(help.stdout, /Run `pi update` for installed Pi packages/);

	// README prose wraps; compare the sentence, not the line breaks.
	const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8").replace(/\s+/g, " ");
	assert.match(readme, /pi update --extensions/);
	assert.match(readme, /Project-only update is unsupported because Pi cannot perform it/);
});

// PRESERVE: the settings preflight that update shared before this change.
test("update still fails closed on a corrupt settings file without spawning", (t) => {
	const sandbox = createCliSandbox(t);
	mkdirSync(sandbox.agent, { recursive: true });
	writeFileSync(sandbox.settingsPath(), "{ not json\n");

	const result = sandbox.run(["update"]);

	assert.equal(result.status, 2, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stderr, /^Could not parse /);
	assert.deepEqual(sandbox.external(), []);
	assert.equal(readFileSync(sandbox.settingsPath(), "utf8"), "{ not json\n");
});

// PRESERVE: update returned Pi's exit status before this change and still does.
test("update still returns pi's exit status", (t) => {
	const sandbox = createCliSandbox(t, { stubs: { pi: "process.exit(7);\n" } });
	seed(sandbox);

	const result = sandbox.run(["update"]);

	assert.equal(result.status, 7, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.deepEqual(sandbox.external().map((record) => record.argv), [["update", "--extensions"]]);
});
