import test from "node:test";
import assert from "node:assert/strict";

import { sourcesMatch } from "../bin/lazypi.mjs";

test("sourcesMatch treats version-pinned npm sources as the catalog source", () => {
	assert.ok(sourcesMatch("npm:@quintinshaw/pi-dynamic-workflows", "npm:@quintinshaw/pi-dynamic-workflows@3.7.0"));
	assert.ok(sourcesMatch("npm:pi-btw", "npm:pi-btw@1.2.3"));
	assert.ok(sourcesMatch("npm:@scope/pkg", "npm:@scope/pkg@0.1.0-beta.2"));
});

test("sourcesMatch treats pinned git sources as the catalog source", () => {
	assert.ok(sourcesMatch("git:github.com/a/b", "git:github.com/a/b"));
	assert.ok(sourcesMatch("git:github.com/a/b", "git:github.com/a/b@abc123"));
});

test("sourcesMatch rejects lookalike prefixes", () => {
	assert.ok(!sourcesMatch("npm:pi-btw", "npm:pi-btw-plus"));
	assert.ok(!sourcesMatch("npm:pi-btw", "npm:pi-btwx"));
	assert.ok(!sourcesMatch("npm:@scope/pkg", "npm:@scope/pkg2"));
});