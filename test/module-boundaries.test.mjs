import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { PACKAGES, isPackageInstalled } from "../bin/catalog.mjs";

const CLI_PATH = resolve("bin/lazypi.mjs");
const PI_HOST_PATH = resolve("bin/pi-host.mjs");

// Every child below gets its own HOME, agent dir, XDG roots, TMPDIR, and npm
// cache, plus stub `pi` and `npm` first on PATH, so a probe can never reach the
// host's real Pi, npm, or settings file.
function createSandbox(t) {
	const root = mkdtempSync(join(tmpdir(), "lazypi-module-boundaries-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const dirs = { root, bin: join(root, "bin"), home: join(root, "home"), agent: join(root, "agent") };
	for (const name of ["bin", "home", "agent", "tmp", "config", "cache", "data", "state", "npm-cache"]) {
		mkdirSync(join(root, name), { recursive: true });
	}
	for (const name of ["pi", "npm"]) {
		const path = join(dirs.bin, name);
		writeFileSync(path, "#!/bin/sh\nexit 99\n");
		chmodSync(path, 0o755);
	}
	dirs.env = {
		PATH: [dirs.bin, dirname(process.execPath), "/usr/bin", "/bin"].join(delimiter),
		HOME: dirs.home,
		USERPROFILE: dirs.home,
		PI_CODING_AGENT_DIR: dirs.agent,
		XDG_CONFIG_HOME: join(root, "config"),
		XDG_CACHE_HOME: join(root, "cache"),
		XDG_DATA_HOME: join(root, "data"),
		XDG_STATE_HOME: join(root, "state"),
		TMPDIR: join(root, "tmp"),
		npm_config_cache: join(root, "npm-cache"),
	};
	return dirs;
}

// A module-graph probe: the child registers a resolve hook that records every
// specifier the target actually imports, then imports the target. A bare
// specifier can only be recorded when the module graph contains it.
function probeModuleGraph(sandbox, target) {
	const probeRoot = mkdtempSync(join(sandbox.root, "graph-"));
	const log = join(probeRoot, "specifiers.log");
	writeFileSync(log, "");
	writeFileSync(
		join(probeRoot, "hook.mjs"),
		[
			'import { appendFileSync } from "node:fs";',
			"export async function resolve(specifier, context, next) {",
			"	appendFileSync(process.env.LAZYPI_PROBE_LOG, `${specifier}\\n`);",
			"	return next(specifier, context);",
			"}",
			"",
		].join("\n"),
	);
	const script = join(probeRoot, "probe.mjs");
	writeFileSync(
		script,
		[
			'import { appendFileSync } from "node:fs";',
			'import * as nodeModule from "node:module";',
			'import { pathToFileURL } from "node:url";',
			'import { resolve } from "node:path";',
			"const record = (specifier) => appendFileSync(process.env.LAZYPI_PROBE_LOG, `${specifier}\\n`);",
			'if (typeof nodeModule.registerHooks === "function") {',
			'	nodeModule.registerHooks({ resolve(specifier, context, next) { record(specifier); return next(specifier, context); } });',
			"} else {",
			'	nodeModule.register(pathToFileURL(resolve(process.env.LAZYPI_PROBE_HOOK)).href, import.meta.url);',
			"}",
			"await import(pathToFileURL(resolve(process.env.LAZYPI_PROBE_TARGET)).href);",
			"",
		].join("\n"),
	);
	const result = spawnSync(process.execPath, [script], {
		cwd: sandbox.root,
		env: {
			...sandbox.env,
			LAZYPI_PROBE_LOG: log,
			LAZYPI_PROBE_HOOK: join(probeRoot, "hook.mjs"),
			LAZYPI_PROBE_TARGET: target,
		},
		encoding: "utf8",
		timeout: 60_000,
	});
	if (result.error) throw result.error;
	const specifiers = readFileSync(log, "utf8").split("\n").filter(Boolean);
	return { ...result, specifiers };
}

test("bin/pi-host.mjs imports without loading @clack/prompts", (t) => {
	const sandbox = createSandbox(t);
	const probe = probeModuleGraph(sandbox, PI_HOST_PATH);
	assert.equal(probe.status, 0, probe.stderr);
	assert.equal(probe.stderr, "");
	assert.equal(probe.stdout, "");
	assert.ok(probe.specifiers.includes("node:fs"), `probe recorded the module graph: ${probe.specifiers.join(", ")}`);
	assert.equal(
		probe.specifiers.includes("@clack/prompts"),
		false,
		`bin/pi-host.mjs must stay prompt-free: ${probe.specifiers.join(", ")}`,
	);
	assert.equal(probe.specifiers.includes("@clack/core"), false, probe.specifiers.join(", "));
});

test("the module-graph probe detects @clack/prompts in the executable module", (t) => {
	const sandbox = createSandbox(t);
	const probe = probeModuleGraph(sandbox, CLI_PATH);
	assert.equal(probe.status, 0, probe.stderr);
	assert.ok(probe.specifiers.includes("@clack/prompts"), "probe control: the CLI imports clack");
});

test("bin/pi-host.mjs prints nothing and starts no entrypoint work", (t) => {
	const sandbox = createSandbox(t);
	const source = readFileSync(PI_HOST_PATH, "utf8");
	assert.doesNotMatch(source, /\bconsole\./, "bin/pi-host.mjs must not print");
	assert.doesNotMatch(source, /process\.(stdout|stderr)/, "bin/pi-host.mjs must not write to a stream");

	const direct = spawnSync(process.execPath, [PI_HOST_PATH], {
		cwd: sandbox.root,
		env: sandbox.env,
		encoding: "utf8",
		timeout: 60_000,
	});
	if (direct.error) throw direct.error;
	assert.equal(direct.status, 0, direct.stderr);
	assert.equal(direct.stdout, "");
	assert.equal(direct.stderr, "");
	assert.equal(existsSync(join(sandbox.agent, "settings.json")), false);
});

test("the executable module is still the only entrypoint", (t) => {
	const sandbox = createSandbox(t);
	const result = spawnSync(process.execPath, [CLI_PATH, "--version"], {
		cwd: sandbox.root,
		env: sandbox.env,
		encoding: "utf8",
		timeout: 60_000,
	});
	if (result.error) throw result.error;
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /^@tommy-ca\/lazypi \d+\.\d+\.\d+\n$/);
});

test("the installed predicate matches a pinned source for a catalog identity", () => {
	const pstack = PACKAGES.find((pkg) => pkg.id === "pstack");
	assert.equal(isPackageInstalled(pstack, new Set(["git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8"])), true);
	assert.equal(isPackageInstalled(pstack, ["git:github.com/tommy-ca/pstack@older-audit"]), true);
});

test("the installed predicate matches an unpinned catalog source", () => {
	const subagents = PACKAGES.find((pkg) => pkg.id === "subagents");
	assert.equal(isPackageInstalled(subagents, new Set(["npm:pi-subagents"])), true);
	assert.equal(isPackageInstalled(subagents, new Set(["npm:pi-subagents@0.86.0"])), true);
});

test("the installed predicate rejects a source that is not the catalog identity", () => {
	const pstack = PACKAGES.find((pkg) => pkg.id === "pstack");
	const subagents = PACKAGES.find((pkg) => pkg.id === "subagents");
	assert.equal(isPackageInstalled(pstack, new Set(["npm:@zenspc/pi-pstack@1"])), false);
	assert.equal(isPackageInstalled(pstack, new Set(["git:github.com/tommy-ca/pstack-extra"])), false);
	assert.equal(isPackageInstalled(subagents, new Set(["npm:pi-subagents-extra@1"])), false);
	assert.equal(isPackageInstalled(subagents, new Set()), false);
});
