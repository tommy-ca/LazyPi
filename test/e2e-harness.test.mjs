import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("e2e packed CLI is launched with node, not npm exec --call", () => {
	const src = readFileSync("scripts/e2e-install.mjs", "utf8");
	assert.equal(src.includes("--call"), false);
	assert.match(src, /process\.execPath/);
});
