import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { resolveSelection } from "../bin/lazypi.mjs";
import { createCliSandbox } from "./helpers/cli-spawn.mjs";

test("--except web-access still selects the other five ids", () => {
	assert.deepEqual([...resolveSelection({ except: ["web-access"] })], ["pstack", "subagents", "sandbox", "verdict", "pi-ask-user"]);
});

test("doctor with no settings file warns and exits 0", (t) => {
	const sandbox = createCliSandbox(t);
	const result = sandbox.run(["doctor"]);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.match(output, /pi --version: pi test/);
	assert.match(output, /does not exist yet/);
	assert.match(output, /warning\(s\) found/);
	assert.doesNotMatch(output, /problem\(s\) found/);
});

test("doctor warns when Pi version exits unsuccessfully with error output", (t) => {
	const sandbox = createCliSandbox(t);
	if (process.platform === "win32") {
		writeFileSync(join(sandbox.bin, "pi.cmd"), "@echo off\r\necho Error: missing dependency 1>&2\r\nexit /b 1\r\n");
	} else {
		sandbox.stub("pi", 'process.stderr.write("Error: missing dependency\\n");\nprocess.exit(1);');
	}
	const result = sandbox.run(["doctor"]);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	assert.match(result.stdout, /Could not read `pi --version` output/);
	assert.doesNotMatch(result.stdout, /✓ pi --version: Error/);
});

test("doctor warns on retired and outsider unpinned git", (t) => {
	const sandbox = createCliSandbox(t);
	writeFileSync(
		sandbox.settingsPath(),
		JSON.stringify({
			packages: [
				"git:github.com/VandeeFeng/pi-memory-md",
				"git:github.com/acme/unrelated-tool",
			],
		}) + "\n",
	);
	const result = sandbox.run(["doctor"]);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.match(output, /VandeeFeng\/pi-memory-md is an unpinned git head/);
	assert.match(output, /acme\/unrelated-tool is an unpinned git head/);
});

test("status prints core and optional installed counts after the catalog header", (t) => {
	const sandbox = createCliSandbox(t);
	const result = sandbox.run(["status"]);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.match(output, /Installed from LazyPi catalog \(0\/6\):/);
	assert.match(output, /core 0\/6, optional 0\/0/);
});
