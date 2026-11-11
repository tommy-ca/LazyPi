import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

test("update delegates to pi update without installing the full catalog", (t) => {
	const sandbox = createCliSandbox(t);
	mkdirSync(sandbox.agent, { recursive: true });
	writeFileSync(sandbox.settingsPath(), JSON.stringify({ packages: ["npm:pi-subagents"] }, null, 2) + "\n");

	const result = sandbox.run(["update"]);
	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /pi update/);

	const calls = sandbox.external().map((record) => record.argv.join(" "));
	// The only assertion this change rewrites: plain `update` now requests
	// extension-package updates, so the recorded argv gains `--extensions`.
	assert.deepEqual(calls, ["update --extensions"]);
	assert.doesNotMatch(calls.join("\n"), /install|npm:pi-mcp-adapter|npm:pi-web-access/);
});
