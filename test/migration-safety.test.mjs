import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const CLI_PATH = resolve("bin/lazypi.mjs");
const LEGACY = "npm:pi-btw@0.1.0";
const REPLACEMENT = "npm:@narumitw/pi-btw";

function migrate(t, { local, failure, alreadyInstalled = false }) {
	const root = mkdtempSync(join(tmpdir(), "lazypi-migration-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const home = join(root, "home");
	const workspace = join(root, "workspace");
	const bin = join(root, "bin");
	const agentDir = join(home, ".pi", "agent");
	const settingsDir = local ? join(workspace, ".pi") : agentDir;
	for (const dir of [home, workspace, bin, settingsDir]) mkdirSync(dir, { recursive: true });
	const settingsFile = join(settingsDir, "settings.json");
	const callsFile = join(root, "calls.jsonl");
	const packages = [{ source: LEGACY, extensions: ["index.ts"] }];
	if (alreadyInstalled) packages.push(REPLACEMENT);
	const before = JSON.stringify({ packages, keep: true }) + "\n";
	writeFileSync(settingsFile, before);
	writeFileSync(callsFile, "");
	const mock = join(root, "pi.mjs");
	writeFileSync(mock, `import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(process.env.PI_TEST_CALLS, JSON.stringify(args) + "\\n");
if (args[0] === process.env.PI_TEST_FAILURE) process.exit(1);
const path = process.env.PI_TEST_SETTINGS;
const settings = JSON.parse(readFileSync(path, "utf8"));
const source = args.at(-1);
if (args[0] === "install") settings.packages.push(source);
if (args[0] === "remove") settings.packages = settings.packages.filter(p => (typeof p === "string" ? p : p.source) !== source);
writeFileSync(path, JSON.stringify(settings) + "\\n");
`);
	if (process.platform === "win32") {
		writeFileSync(join(bin, "pi.cmd"), `@echo off\r\n"${process.execPath}" "${mock}" %*\r\nexit /b %errorlevel%\r\n`);
	} else {
		const pi = join(bin, "pi");
		writeFileSync(pi, `#!/bin/sh\nexec '${process.execPath}' '${mock}' "$@"\n`);
		chmodSync(pi, 0o755);
	}
	const result = spawnSync(process.execPath, [CLI_PATH, "install", "--yes", "--only", "btw", ...(local ? ["--local"] : [])], {
		cwd: workspace,
		env: {
			...process.env,
			HOME: home,
			USERPROFILE: home,
			PI_CODING_AGENT_DIR: agentDir,
			PATH: [bin, process.env.PATH].join(delimiter),
			PI_TEST_CALLS: callsFile,
			PI_TEST_SETTINGS: settingsFile,
			PI_TEST_FAILURE: failure ?? "",
		},
		encoding: "utf8",
		timeout: 15_000,
	});
	assert.equal(result.error, undefined);
	return {
		result,
		before,
		after: readFileSync(settingsFile, "utf8"),
		calls: readFileSync(callsFile, "utf8").trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)),
	};
}

for (const local of [false, true]) {
	const scope = local ? "local" : "global";
	const scopeArgs = local ? ["-l", "--approve"] : [];
	test(`${scope} migration installs the replacement before removing the pinned legacy source`, (t) => {
		const { result, after, calls } = migrate(t, { local });
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.deepEqual(calls, [["install", ...scopeArgs, REPLACEMENT], ["remove", ...scopeArgs, LEGACY]]);
		assert.deepEqual(JSON.parse(after), { packages: [REPLACEMENT], keep: true });
	});

	test(`${scope} failed replacement preserves legacy settings and does not remove anything`, (t) => {
		const { result, before, after, calls } = migrate(t, { local, failure: "install" });
		assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
		assert.match(result.stderr, /failed to install btw/);
		assert.deepEqual(calls, [["install", ...scopeArgs, REPLACEMENT]]);
		assert.equal(after, before);
	});

	test(`${scope} failed legacy cleanup reports failure and retains the installed replacement`, (t) => {
		const { result, after, calls } = migrate(t, { local, failure: "remove" });
		assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
		assert.match(result.stderr, /failed to migrate btw/);
		assert.deepEqual(calls, [["install", ...scopeArgs, REPLACEMENT], ["remove", ...scopeArgs, LEGACY]]);
		assert.deepEqual(JSON.parse(after).packages, [{ source: LEGACY, extensions: ["index.ts"] }, REPLACEMENT]);
	});

	test(`${scope} already-installed replacement still removes stale legacy sources`, (t) => {
		const { result, after, calls } = migrate(t, { local, alreadyInstalled: true });
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.deepEqual(calls, [["remove", ...scopeArgs, LEGACY]]);
		assert.deepEqual(JSON.parse(after), { packages: [REPLACEMENT], keep: true });
	});
}
