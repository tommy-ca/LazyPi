import test from "node:test";
import assert from "node:assert/strict";

import { PACKAGES } from "../bin/lazypi.mjs";
import { expectedPackageSources, packageSourcesFromSettings } from "../scripts/assert-installed-packages.mjs";

test("expectedPackageSources matches the full catalog", () => {
	const expected = expectedPackageSources();

	assert.equal(expected.length, PACKAGES.length);
});

test("expectedPackageSources supports excluded package ids", () => {
	const expected = expectedPackageSources({ except: ["goal", "pi-ask-user"] });

	assert.equal(expected.includes("npm:@narumitw/pi-goal"), false);
	assert.equal(expected.includes("npm:pi-ask-user"), false);
	assert.equal(expected.length, PACKAGES.length - 2);
});

test("packageSourcesFromSettings reads string and object package entries", () => {
	const sources = packageSourcesFromSettings({
		packages: [
			"npm:pi-subagents",
			{ source: "npm:pi-ask-user" },
			{ source: "npm:pi-mcp-adapter", extra: true },
			{ nope: true },
		],
	});

	assert.deepEqual([...sources].sort(), ["npm:pi-ask-user", "npm:pi-mcp-adapter", "npm:pi-subagents"]);
});