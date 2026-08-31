import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("e2e installs the packed tarball then runs its bin with node", () => {
	const src = readFileSync("scripts/e2e-install.mjs", "utf8");
	assert.equal(src.includes("--call"), false);
	assert.match(src, /\["install", "--omit=dev", tarball\]/);
	assert.match(src, /"node_modules", "@tommy-ca", "lazypi", "bin", "lazypi\.mjs"/);
	assert.match(src, /process\.execPath/);
});
