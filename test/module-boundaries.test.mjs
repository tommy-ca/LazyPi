import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { PACKAGES, isPackageInstalled } from "../bin/catalog.mjs";
import { CLI_PATH, createCliSandbox } from "./helpers/cli-spawn.mjs";

const PI_HOST_PATH = resolve("bin/pi-host.mjs");

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
	const result = sandbox.spawn(process.execPath, [script], {
		cwd: sandbox.root,
		env: {
			LAZYPI_PROBE_LOG: log,
			LAZYPI_PROBE_HOOK: join(probeRoot, "hook.mjs"),
			LAZYPI_PROBE_TARGET: target,
		},
		timeout: 60_000,
	});
	if (result.error) throw result.error;
	const specifiers = readFileSync(log, "utf8").split("\n").filter(Boolean);
	return { ...result, specifiers };
}

test("bin/pi-host.mjs imports without loading @clack/prompts", (t) => {
	const sandbox = createCliSandbox(t, { prefix: "lazypi-module-boundaries-" });
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
	const sandbox = createCliSandbox(t, { prefix: "lazypi-module-boundaries-" });
	const probe = probeModuleGraph(sandbox, CLI_PATH);
	assert.equal(probe.status, 0, probe.stderr);
	assert.ok(probe.specifiers.includes("@clack/prompts"), "probe control: the CLI imports clack");
});

test("bin/pi-host.mjs prints nothing and starts no entrypoint work", (t) => {
	const sandbox = createCliSandbox(t, { prefix: "lazypi-module-boundaries-" });
	const source = readFileSync(PI_HOST_PATH, "utf8");
	assert.doesNotMatch(source, /\bconsole\./, "bin/pi-host.mjs must not print");
	assert.doesNotMatch(source, /process\.(stdout|stderr)/, "bin/pi-host.mjs must not write to a stream");

	const direct = sandbox.spawn(process.execPath, [PI_HOST_PATH], { cwd: sandbox.root, timeout: 60_000 });
	if (direct.error) throw direct.error;
	assert.equal(direct.status, 0, direct.stderr);
	assert.equal(direct.stdout, "");
	assert.equal(direct.stderr, "");
	assert.equal(existsSync(join(sandbox.agent, "settings.json")), false);
});

test("the executable module is still the only entrypoint", (t) => {
	const sandbox = createCliSandbox(t, { prefix: "lazypi-module-boundaries-" });
	const result = sandbox.run(["--version"], { cwd: sandbox.root, timeout: 60_000 });
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
