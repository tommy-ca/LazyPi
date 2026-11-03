import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

test("CI has no npm publisher under the manual release policy", () => {
	const directory = ".github/workflows";
	const workflows = readdirSync(directory).filter(name => /\.ya?ml$/.test(name));
	assert.ok(workflows.length > 0, "Expected CI workflows to inspect");
	for (const name of workflows) {
		assert.doesNotMatch(readFileSync(join(directory, name), "utf8"), /\bnpm\s+publish\b/, name);
	}
	assert.equal(existsSync(join(directory, "release-please.yml")), false);
});
