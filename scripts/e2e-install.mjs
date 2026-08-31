#!/usr/bin/env node
// End-to-end install test: packs the LazyPi fork and drives the packed bin
// against a real `pi` in an isolated sandbox (PI_CODING_AGENT_DIR). Needs
// network + `pi` on PATH. CI runs this after `npm test`; locally:
//   node scripts/e2e-install.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { PACKAGES } from "../bin/lazypi.mjs";
import { expectedPackageSources } from "./assert-installed-packages.mjs";

const REPO = resolve(import.meta.dirname, "..");
const KEEP = process.argv.includes("--keep");

function run(command, args, options = {}) {
	const result = spawnSync(command, args, { encoding: "utf8", ...options });
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

const pack = run("npm", ["pack", "--silent"], { cwd: REPO });
assert.equal(pack.status, 0, `npm pack failed: ${pack.stderr}`);
const tarball = resolve(REPO, pack.stdout.trim().split(/\r?\n/).at(-1));

const sandbox = mkdtempSync(join(tmpdir(), "lazypi-e2e-"));
const agentDir = join(sandbox, "agent");
const packedDir = join(sandbox, "packed");
mkdirSync(packedDir);
const extract = run("tar", ["-xzf", tarball, "-C", packedDir]);
assert.equal(extract.status, 0, `tar extract failed: ${extract.stderr}`);
const packedBin = join(packedDir, "package", "bin", "lazypi.mjs");
assert.equal(existsSync(packedBin), true, `packed bin missing at ${packedBin}`);
const env = { ...process.env, PI_CODING_AGENT_DIR: agentDir };
const lazypi = (args) =>
	run(process.execPath, [packedBin, ...args.split(/\s+/).filter(Boolean)], {
		cwd: sandbox,
		env,
		timeout: 300_000,
	});

let failures = 0;
try {
	console.log(`sandbox: ${sandbox}\n`);

	// --- Stage 1: fresh core install ------------------------------------------
	console.log("Stage 1: fresh install --yes (core catalog)");
	const CORE_COUNT = PACKAGES.filter((p) => p.category === "core").length;
	const coreSources = PACKAGES.filter((p) => p.category === "core").map((p) => p.source);
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
	const OPTIONAL_COUNT = PACKAGES.filter((p) => p.category === "optional").length;
	assert.match(r.stdout, new RegExp(`Will install:\\s+${OPTIONAL_COUNT}`));
	check(`exit 0, ${OPTIONAL_COUNT} optional packages installed`, () => {
		assert.deepEqual(readSettings(agentDir).packages, expectedPackageSources());
	});

	// --- Stage 2: idempotent re-run ----------------------------------------
	console.log("Stage 2: re-run install --yes");
	r = lazypi("install --yes");
	assert.equal(r.status, 0);
	assert.match(r.stdout, /Nothing to do/);
	check("re-run reports nothing to do", () => {
		assert.deepEqual(readSettings(agentDir).packages, expectedPackageSources());
	});

	// --- Stage 3: subagent overrides ---------------------------------------
	console.log("Stage 3: subagent override side effect");
	check("empty-model overrides for the 6 builtin agents", () => {
		const overrides = readSettings(agentDir).subagents?.agentOverrides ?? {};
		for (const name of ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"]) {
			assert.deepEqual(overrides[name], { model: "" }, `missing override for ${name}`);
		}
	});

	// --- Stage 4: status -----------------------------------------------------
	console.log("Stage 4: status");
	r = lazypi("status");
	assert.equal(r.status, 0);
	assert.match(r.stdout, new RegExp(`Installed from LazyPi catalog \\(${PACKAGES.length}/${PACKAGES.length}\\)`));
	assert.match(r.stdout, /none — full catalog is installed/);
	check("status shows full catalog installed", () => {});

	// --- Stage 5: legacy migration ------------------------------------------
	console.log("Stage 5: legacy source migration (npm:pi-btw -> @narumitw/pi-btw)");
	assert.equal(run("npm", ["view", "pi-btw", "version"]).status, 0, "legacy npm:pi-btw no longer published — migration stage cannot run");
	r = run("pi", ["install", "npm:pi-btw"], { env, timeout: 300_000 });
	assert.equal(r.status, 0, `seeding legacy failed\n${r.stdout}\n${r.stderr}`);
	assert.ok(readSettings(agentDir).packages.includes("npm:pi-btw"), "legacy seed missing");
	r = lazypi("install --yes");
	assert.equal(r.status, 0, `migrating install failed\n${r.stdout}\n${r.stderr}`);
	assert.match(r.stdout, /pi remove npm:pi-btw/);
	check("legacy removed, fork source installed", () => {
		const packages = readSettings(agentDir).packages;
		assert.ok(!packages.includes("npm:pi-btw"), "legacy source still present");
		assert.ok(packages.includes("npm:@narumitw/pi-btw"), "replacement source missing");
	});

	// --- Stage 6: remove ------------------------------------------------------
	console.log("Stage 6: remove by id");
	r = lazypi("remove btw");
	assert.equal(r.status, 0, `remove failed\n${r.stdout}\n${r.stderr}`);
	check("btw removed from settings", () => {
		assert.ok(!readSettings(agentDir).packages.includes("npm:@narumitw/pi-btw"));
	});

	// --- Stage 7: doctor ------------------------------------------------------
	console.log("Stage 7: doctor");
	r = lazypi("doctor");
	assert.equal(r.status, 0, `doctor failed\n${r.stdout}\n${r.stderr}`);
	assert.match(r.stdout, /`pi` is on PATH/);
	assert.match(r.stdout, /settings.json.*readable/);
	check("doctor passes environment and settings checks", () => {});

	console.log(`\nE2E PASS: ${passed} checks`);
} catch (err) {
	failures = 1;
	console.error(`\nE2E FAIL: ${err.message}`);
	console.error(err.stack ?? "");
} finally {
	rmSync(tarball, { force: true });
	if (!KEEP) rmSync(sandbox, { recursive: true, force: true });
	else console.log(`kept sandbox: ${sandbox}`);
	process.exit(failures);
}