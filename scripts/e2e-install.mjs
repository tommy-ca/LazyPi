#!/usr/bin/env node
// End-to-end install test: packs the LazyPi fork and drives the packed bin
// against a real `pi` with private state and an allowlisted environment.
// Needs network + `pi` on PATH, and separately authorized OS containment.
// Private HOME is not containment. Offline tests use fake executables instead.
// --keep retains the private run root, including on setup failures.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

import { PACKAGES } from "../bin/lazypi.mjs";

const REPO = resolve(import.meta.dirname, "..");
const KEEP = process.argv.includes("--keep");

const sandbox = mkdtempSync(join(tmpdir(), "lazypi-e2e-"));
const agentDir = join(sandbox, "agent");
const env = { PATH: process.env.PATH ?? "" };
if (process.platform === "win32") {
	for (const key of ["SystemRoot", "WINDIR", "COMSPEC", "PATHEXT"]) {
		if (process.env[key]) env[key] = process.env[key];
	}
}
const privateDirs = {
	HOME: "home", USERPROFILE: "home", PI_CODING_AGENT_DIR: "agent",
	XDG_CONFIG_HOME: "config", XDG_DATA_HOME: "data", XDG_CACHE_HOME: "cache",
	XDG_STATE_HOME: "state", XDG_RUNTIME_DIR: "run",
	TMPDIR: "tmp", TMP: "tmp", TEMP: "tmp", NPM_CONFIG_CACHE: "npm-cache",
};
for (const [key, dir] of Object.entries(privateDirs)) env[key] = join(sandbox, dir);
env.NPM_CONFIG_USERCONFIG = join(sandbox, "npmrc");
env.NPM_CONFIG_GLOBALCONFIG = join(sandbox, "global-npmrc");
const context = { root: sandbox, agentDir, env };

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: "utf8", timeout: 300_000, ...options, cwd: context.root, env: context.env,
	});
	if (result.error) throw result.error;
	return result;
}

let passed = 0;
function check(label, fn) {
	fn();
	passed++;
	console.log(`  ✓ ${label}`);
}

function readSettings(agentDir) {
	return JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"));
}

const packedBin = join(sandbox, "node_modules", "@tommy-ca", "lazypi", "bin", "lazypi.mjs");
const lazypi = (args) =>
	run(process.execPath, [packedBin, ...args.split(/\s+/).filter(Boolean)]);

let failures = 0;
try {
	console.log(`sandbox: ${sandbox}\n`);
	for (const dir of new Set(Object.values(privateDirs))) {
		mkdirSync(join(sandbox, dir), { recursive: true, mode: 0o700 });
	}
	writeFileSync(env.NPM_CONFIG_USERCONFIG, "");
	writeFileSync(env.NPM_CONFIG_GLOBALCONFIG, "");

	let pi;
	try {
		pi = run("pi", ["--version"]);
	} catch (err) {
		throw new Error("Pi executable required on PATH before packed verification", { cause: err });
	}
	assert.equal(pi.status, 0, `Pi executable required on PATH before packed verification: ${pi.stderr}`);
	const pack = run("npm", ["pack", REPO, "--silent", "--pack-destination", sandbox]);
	assert.equal(pack.status, 0, `npm pack failed: ${pack.stderr}`);
	const filename = pack.stdout.trim().split(/\r?\n/).at(-1);
	assert.ok(filename && basename(filename) === filename && filename.endsWith(".tgz"), "npm pack returned an invalid tarball filename");
	const tarball = join(sandbox, filename);
	const installed = run("npm", ["install", "--omit=dev", tarball], { timeout: 120_000 });
	assert.equal(installed.status, 0, `npm install packed tarball failed: ${installed.stderr}`);
	assert.equal(existsSync(packedBin), true, `packed bin missing at ${packedBin}`);

	// --- Stage 1: fresh core install ------------------------------------------
	console.log("Stage 1: fresh install --yes (core catalog)");
	const CORE_COUNT = PACKAGES.filter((p) => p.category === "core").length;
	const coreSources = PACKAGES.filter((p) => p.category === "core").map((p) => p.installSource ?? p.source);
	let r = lazypi("install --yes");
	assert.equal(r.status, 0, `install failed\n${r.stdout}\n${r.stderr}`);
	assert.match(r.stdout, new RegExp(`Will install:\\s+${CORE_COUNT}`));
	assert.match(r.stdout, new RegExp(`Installed ${CORE_COUNT} package\\(s\\)`));
	check(`exit 0, ${CORE_COUNT} core packages installed`, () => {
		const settings = readSettings(agentDir);
		assert.deepEqual(settings.packages, coreSources);
	});

	// --- Stage 1.5: optional tier -------------------------------------------
	console.log("Stage 1.5: install --yes --only optional");
	r = lazypi("install --yes --only optional");
	assert.equal(r.status, 0, `optional install failed\n${r.stdout}\n${r.stderr}`);
	const optionalSources = PACKAGES.filter((p) => p.category === "optional").map((p) => p.installSource ?? p.source);
	const OPTIONAL_COUNT = optionalSources.length;
	const fullSources = [...coreSources, ...optionalSources];
	// Stages 5 and 6 address pstack inside the settings array, so its position is
	// derived from the catalog instead of assuming the catalog keeps it first.
	const pstack = PACKAGES.find((pkg) => pkg.id === "pstack");
	assert.ok(pstack, "the catalog must keep a pstack entry: stages 5 and 6 address it by id");
	const pstackIndex = fullSources.indexOf(pstack.installSource ?? pstack.source);
	assert.notEqual(pstackIndex, -1, "pstack is missing from the installed source list");
	if (OPTIONAL_COUNT === 0) assert.equal(r.stdout, "Nothing selected — nothing to install.\n");
	else assert.match(r.stdout, new RegExp(`Will install:\\s+${OPTIONAL_COUNT}`));
	check(`exit 0, ${OPTIONAL_COUNT} optional packages installed`, () => {
		assert.deepEqual(readSettings(agentDir).packages, fullSources);
	});

	// --- Stage 2: idempotent re-run ----------------------------------------
	console.log("Stage 2: re-run install --yes");
	r = lazypi("install --yes");
	assert.equal(r.status, 0);
	assert.match(r.stdout, /Nothing to do/);
	check("re-run reports nothing to do", () => {
		assert.deepEqual(readSettings(agentDir).packages, fullSources);
	});

	// --- Stage 3: subagent overrides ---------------------------------------
	console.log("Stage 3: subagent override side effect");
	const BUILTIN_AGENTS = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];
	check("empty-model overrides for the 6 builtin agents", () => {
		const overrides = readSettings(agentDir).subagents?.agentOverrides ?? {};
		// The exact object, not six presence lookups: an extra override or a
		// non-empty model is a different settings side effect than this label says.
		assert.deepEqual(overrides, Object.fromEntries(BUILTIN_AGENTS.map((name) => [name, { model: "" }])));
	});

	// --- Stage 4: status -----------------------------------------------------
	console.log("Stage 4: status");
	const settingsFile = join(agentDir, "settings.json");
	const beforeStatus = readFileSync(settingsFile, "utf8");
	r = lazypi("status");
	assert.equal(r.status, 0);
	check("status reports the catalog without rewriting state", () => {
		// A fixture that prints a different count is what proves these two banner
		// matches can fail; without it the fixture only echoes the constants.
		assert.match(r.stdout, new RegExp(`Installed from LazyPi catalog \\(${PACKAGES.length}/${PACKAGES.length}\\)`));
		assert.match(r.stdout, /none — full catalog is installed/);
		// Reading back `packages` alone let a status run delete the six overrides
		// the install wrote and still count as a pass, so every part of the state
		// this stage can reach is asserted, then the bytes.
		const settings = readSettings(agentDir);
		assert.deepEqual(settings.packages, fullSources);
		assert.deepEqual(settings.subagents?.agentOverrides, Object.fromEntries(BUILTIN_AGENTS.map((name) => [name, { model: "" }])));
		// status reports the catalog; reporting must not rewrite the file.
		assert.equal(readFileSync(settingsFile, "utf8"), beforeStatus);
	});

	// --- Stage 5: registration preservation, not native loading --------------
	console.log("Stage 5: preserve an older canonical pin and unmanaged registrations");
	const oldSource = "git:github.com/tommy-ca/pstack@bdbb67f0f08212ce3136d2c22fb3b17e30bb717c";
	const seeded = readSettings(agentDir);
	seeded.packages[pstackIndex] = { source: oldSource, skills: [], metadata: { fixture: true } };
	seeded.packages.push({ source: "npm:pi-btw@0.1.0", extensions: [], metadata: { fixture: true } });
	writeFileSync(settingsFile, JSON.stringify(seeded, null, 2) + "\n");
	const before = readFileSync(settingsFile, "utf8");
	r = lazypi("install --yes --only pstack");
	assert.equal(r.status, 0, `preservation install failed\n${r.stdout}\n${r.stderr}`);
	assert.match(r.stdout, /Nothing to do/);
	check("older pin and unmanaged object bytes preserved", () => {
		assert.equal(readFileSync(settingsFile, "utf8"), before);
	});

	// --- Stage 6: retained id and raw-source removal -------------------------
	console.log("Stage 6: remove canonical id and exact unmanaged source");
	r = lazypi("remove pstack npm:pi-btw@0.1.0");
	assert.equal(r.status, 0, `remove failed\n${r.stdout}\n${r.stderr}`);
	check("only requested registrations removed", () => {
		const remaining = [...fullSources.slice(0, pstackIndex), ...fullSources.slice(pstackIndex + 1)];
		assert.deepEqual(readSettings(agentDir), { ...seeded, packages: remaining });
	});

	// --- Stage 7: doctor ------------------------------------------------------
	console.log("Stage 7: doctor");
	r = lazypi("doctor");
	assert.equal(r.status, 0, `doctor failed\n${r.stdout}\n${r.stderr}`);
	check("doctor passes environment and settings checks", () => {
		assert.match(r.stdout, /  ✓ Node /);
		assert.match(r.stdout, /  ✓ npm is on PATH/);
		assert.match(r.stdout, /  ✓ `pi` is on PATH/);
		assert.match(r.stdout, /settings\.json is readable/);
		// A doctor run that reports a problem exits 1, so a passing run of this
		// check cannot also carry a problem marker or a problem summary.
		assert.doesNotMatch(r.stdout, /✗|problem\(s\) found/);
	});

	console.log(`\nE2E PASS: ${passed} checks`);
} catch (err) {
	failures = 1;
	console.error(`\nE2E FAIL: ${err.message}`);
	console.error(err.stack ?? "");
} finally {
	if (!KEEP) rmSync(sandbox, { recursive: true, force: true });
	else console.log(`kept sandbox: ${sandbox}`);
	process.exit(failures);
}
