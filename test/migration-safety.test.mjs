import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

for (const local of [false, true]) {
	test(`${local ? "local" : "global"} failed retained install preserves retired legacy registration`, { skip: process.platform === "win32" }, (t) => {
		const sandbox = createCliSandbox(t, { prefix: "retired-migration-" });
		const settings = local ? sandbox.settingsPath(true) : sandbox.settingsPath();
		const before = '{"packages":[{"source":"npm:pi-btw@0.1.0","metadata":true}],"keep":true}\n';
		writeFileSync(settings, before);
		// A stub `pi` that fails after recording: the assertion below pins the exact
		// argv the CLI produced without any real Pi on the path.
		sandbox.stub("pi", "process.exit(1);");

		const r = sandbox.run(["install", "--yes", "--only", "verdict", ...(local ? ["--local"] : [])]);
		assert.equal(r.error, undefined);
		assert.equal(r.status, 1);
		assert.match(r.stdout, /Will install:      1\n/);
		assert.equal(r.stderr, "  ✗ failed to install verdict\n\nLazyPi finished with 1 failure(s):\n- verdict (npm:pi-verdict)\n");
		assert.deepEqual(
			sandbox.external().map((record) => record.argv),
			[["install", ...(local ? ["-l", "--approve"] : []), "npm:pi-verdict"]],
		);
		assert.equal(readFileSync(settings, "utf8"), before);
	});
}
