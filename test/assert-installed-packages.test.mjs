import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { PACKAGES } from "../bin/lazypi.mjs";
import { expectedPackageSources, packageSourcesFromSettings } from "../scripts/assert-installed-packages.mjs";

test("expectedPackageSources matches the full catalog", () => {
	const expected = expectedPackageSources();

	assert.deepEqual(expected, [
		"git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8",
		"npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access",
	]);
});

test("expectedPackageSources supports excluded package ids", () => {
	const expected = expectedPackageSources({ except: ["sandbox", "pi-ask-user"] });

	assert.equal(expected.includes("npm:pi-better-sandbox"), false);
	assert.equal(expected.includes("npm:pi-ask-user"), false);
	assert.equal(expected.length, PACKAGES.length - 2);
});

test("clean-install CLI assertion requires exact fresh sources rather than a preserved profile", () => {
	const root = mkdtempSync(join(tmpdir(), "fresh-source-assertion-"));
	for (const name of ["home", "agent", "work", "bin"]) mkdirSync(join(root, name));
	const settings = join(root, "agent", "settings.json");
	const fresh = [
		"git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8",
		"npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access",
	];
	for (const [packages, expectedExit, diagnostic] of [
		[fresh, 0, null],
		[["git:github.com/tommy-ca/pstack@older-audit", ...fresh.slice(1)], 1, "Missing package sources in settings.json: git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8"],
		[[...fresh, "npm:pi-btw@0.1.0"], 1, "Unexpected package sources in settings.json: npm:pi-btw@0.1.0"],
	]) {
		const before = JSON.stringify({ packages }) + "\n";
		writeFileSync(settings, before);
		const r = spawnSync(process.execPath, [resolve("scripts/assert-installed-packages.mjs"), "--settings", settings], {
			cwd: join(root, "work"), encoding: "utf8",
			env: { PATH: join(root, "bin"), HOME: join(root, "home"), USERPROFILE: join(root, "home"), PI_CODING_AGENT_DIR: join(root, "agent"), TMPDIR: root },
		});
		assert.equal(r.error, undefined);
		assert.equal(r.status, expectedExit);
		assert.equal(r.stdout, expectedExit === 0 ? `Verified 6 expected package source(s) in ${settings}.\n` : "");
		if (diagnostic) assert.ok(r.stderr.includes(diagnostic));
		else assert.equal(r.stderr, "");
		assert.equal(readFileSync(settings, "utf8"), before);
	}
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