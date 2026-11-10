import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { PACKAGES } from "../bin/lazypi.mjs";
import { expectedPackageSources, packageSourcesFromSettings } from "../scripts/assert-installed-packages.mjs";
import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const ASSERT_SCRIPT = resolve("scripts/assert-installed-packages.mjs");

// The assertion script spawns nothing itself, so it runs with the same isolated
// environment every other child gets.
function runAssertion(sandbox, args) {
	return sandbox.spawn(process.execPath, [ASSERT_SCRIPT, ...args]);
}

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

test("clean-install CLI assertion requires exact fresh sources rather than a preserved profile", (t) => {
	const sandbox = createCliSandbox(t, { prefix: "fresh-source-assertion-" });
	mkdirSync(sandbox.agent, { recursive: true });
	const settings = sandbox.settingsPath();
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
		const r = runAssertion(sandbox, ["--settings", settings]);
		assert.equal(r.error, undefined);
		assert.equal(r.status, expectedExit);
		assert.equal(r.stdout, expectedExit === 0 ? `Verified 6 expected package source(s) in ${settings}.\n` : "");
		if (diagnostic) assert.ok(r.stderr.includes(diagnostic));
		else assert.equal(r.stderr, "");
		assert.equal(readFileSync(settings, "utf8"), before);
	}
});

const allFresh = [
	"git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8",
	"npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access",
];

function fullProfile(t) {
	const sandbox = createCliSandbox(t, { prefix: "tier-assertion-" });
	mkdirSync(sandbox.agent, { recursive: true });
	writeFileSync(sandbox.settingsPath(), JSON.stringify({ packages: allFresh }) + "\n");
	return sandbox;
}

test("expectedPackageSources derives its tier from each package category", () => {
	assert.deepEqual(expectedPackageSources({ tier: "all" }), expectedPackageSources());
	assert.deepEqual(expectedPackageSources({ tier: "core" }), expectedPackageSources());
	assert.equal(PACKAGES.filter(pkg => pkg.category === "core").length, PACKAGES.length);
	assert.deepEqual(expectedPackageSources({ tier: "optional" }), []);
});

test("expectedPackageSources rejects an unknown tier and a category name in except", () => {
	assert.throws(() => expectedPackageSources({ tier: "everything" }), /Unknown tier: everything\nValid tiers: core, optional, all/);
	// A category in --except would silently exclude nothing, which is how a
	// full-core profile passed an "--except core" run with six expected sources.
	assert.throws(() => expectedPackageSources({ except: ["core"] }), /--except takes package ids, not categories: core\nUse --tier core to assert one tier/);
	assert.deepEqual(expectedPackageSources({ except: ["sandbox"] }).length, PACKAGES.length - 1);
});

test("tier assertion reports a non-empty optional selection that the id filter cannot see", (t) => {
	const sandbox = fullProfile(t);
	const optional = runAssertion(sandbox, ["--tier", "optional"]);
	assert.equal(optional.status, 1);
	assert.equal(optional.stdout, "");
	assert.ok(optional.stderr.includes("Unexpected package sources in settings.json: git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8"));
	const core = runAssertion(sandbox, ["--tier", "core"]);
	assert.equal(core.status, 0, core.stderr);
	assert.equal(core.stdout, `Verified 6 expected package source(s) in ${sandbox.settingsPath()}.\n`);
	assert.equal(core.stderr, "");
});

test("a category name passed as a package id fails instead of excluding nothing", (t) => {
	const sandbox = fullProfile(t);
	const settings = sandbox.settingsPath();
	const before = readFileSync(settings, "utf8");
	const r = runAssertion(sandbox, ["--except", "core"]);
	assert.equal(r.status, 1);
	assert.equal(r.stdout, "");
	assert.ok(r.stderr.includes("--except takes package ids, not categories: core"));
	assert.equal(readFileSync(settings, "utf8"), before);
});

test("assertion reads the agent dir that PI_CODING_AGENT_DIR selects", (t) => {
	const sandbox = fullProfile(t);
	const settings = sandbox.settingsPath();
	const r = runAssertion(sandbox, []);
	assert.equal(r.status, 0, r.stderr);
	assert.equal(r.stdout, `Verified 6 expected package source(s) in ${settings}.\n`);
	assert.equal(r.stderr, "");
	const other = runAssertion(sandbox, ["--settings", join(sandbox.root, "missing.json")]);
	assert.equal(other.status, 1);
	assert.ok(other.stderr.includes(`settings.json was not created at ${join(sandbox.root, "missing.json")}`));
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