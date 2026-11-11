import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { stripVTControlCharacters } from "node:util";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const ttyRunner = "/usr/bin/script";
const coreSources = ["git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8", "npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access"];

function fixture(t, { installed = false, malformed = false } = {}) {
	const sandbox = createCliSandbox(t, { prefix: "selection-" });
	const settings = sandbox.settingsPath();
	writeFileSync(settings, malformed ? "{\n" : JSON.stringify({ packages: ["npm:pi-btw@0.1.0"], subagents: { agentOverrides: { reviewer: { model: "keep-model", tools: ["read"] } } }, keep: true }) + "\n");
	writeFileSync(`${settings}.lazypi.fixture.bak`, "existing backup\n");
	// A machine without Pi is modelled by staging the `pi` stub out of PATH: the
	// CLI resolves commands from PATH, so an absent entry is an absent command. The
	// stub npm bootstrap puts it back, which is the only way Pi appears here.
	const piStub = ["", ".mjs", ".cmd"].map((suffix) => join(sandbox.bin, `pi${suffix}`)).find(existsSync);
	const stagedPi = `${piStub}.staged`;
	renameSync(piStub, stagedPi);
	sandbox.stub("npm", `import { renameSync } from 'node:fs';
renameSync(${JSON.stringify(stagedPi)}, ${JSON.stringify(piStub)});`);
	if (installed) renameSync(stagedPi, piStub);
	const snapshot = () => Object.fromEntries(readdirSync(sandbox.agent).sort().map(name => [name, readFileSync(join(sandbox.agent, name), "utf8")]));
	const before = snapshot();
	const readCalls = () => sandbox.external().map(record => [record.command, ...record.argv]);
	function record(result, command) {
		writeFileSync(join(sandbox.root, "command.json"), JSON.stringify(command));
		for (const key of ["stdout", "stderr"]) writeFileSync(join(sandbox.root, `${key}.txt`), result[key]);
		writeFileSync(join(sandbox.root, "exit.txt"), String(result.status));
		return result;
	}
	function run(args) {
		const result = sandbox.run(args);
		assert.equal(result.error, undefined);
		return record(result, ["lazypi", ...args]);
	}
	async function tty(steps) {
		assert.ok(existsSync(ttyRunner), `Required TTY runner missing: ${ttyRunner}`);
		const args = ["-q", "-e", "-c", sandbox.shellCommand(["install"], { prefix: "/usr/bin/stty cols 160 rows 50; exec " }), join(sandbox.root, "typescript")];
		const child = spawn(ttyRunner, args, { cwd: sandbox.work, env: sandbox.env, stdio: ["pipe", "pipe", "pipe"] });
		let stdout = "", stderr = "", index = 0, unexpectedBootstrap = false;
		const promptCalls = [];
		const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
		child.stdout.on("data", chunk => {
			stdout += chunk;
			const text = stripVTControlCharacters(stdout);
			if (index < steps.length && text.includes(steps[index][0])) {
				const [, keys, expectedCalls] = steps[index++];
				writeFileSync(join(sandbox.root, `prompt-${index}.json`), JSON.stringify(readCalls()));
				promptCalls.push([readCalls(), expectedCalls]);
				keys.forEach((key, i) => setTimeout(() => child.stdin.write(key), 40 * (i + 1)));
			} else if (index === 0 && !unexpectedBootstrap && text.includes("Install Pi now with")) {
				unexpectedBootstrap = true;
				setTimeout(() => child.stdin.write("\x03"), 40);
			}
		});
		child.stderr.on("data", chunk => { stderr += chunk; });
		const status = await new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
		clearTimeout(timer);
		const result = record({ status, stdout, stderr, steps: index }, [ttyRunner, ...args]);
		for (const [actual, expected] of promptCalls) if (expected) assert.deepEqual(actual, expected);
		return result;
	}
	return { root: sandbox.root, settings, before, snapshot, readCalls, run, tty };
}

for (const stage of ["choice", "picker", "empty"]) {
	test(`interactive ${stage} exits without bootstrap or settings/model/backup changes`, { skip: process.platform !== "linux" }, async (t) => {
		const f = fixture(t);
		const steps = stage === "choice"
			? [["or pick them yourself?", ["\x03"]]]
			: [["or pick them yourself?", ["\x1b[B", "\r"]], ["Pick packages to install", stage === "picker" ? ["\x03"] : [" ", "\r"]]];
		const result = await f.tty(steps);
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.equal(result.stderr, "");
		assert.match(stripVTControlCharacters(result.stdout), stage === "empty" ? /Nothing selected — nothing to install\./ : /Aborted\./);
		assert.doesNotMatch(result.stdout, /Install Pi now|Installing Pi via|Could not find/);
		assert.deepEqual(f.readCalls(), []);
		assert.deepEqual(f.snapshot(), f.before);
	});
}

for (const pick of [false, true]) {
	test(`interactive ${pick ? "picker" : "everything"} selection precedes accepted bootstrap`, { skip: process.platform !== "linux" }, async (t) => {
		const f = fixture(t);
		const steps = [["or pick them yourself?", pick ? ["\x1b[B", "\r"] : ["\r"], []]];
		if (pick) steps.push(["Pick packages to install", ["\r"], []]);
		steps.push(["Install Pi now with", ["\r"], []]);
		const result = await f.tty(steps);
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.equal(result.stderr, "");
		assert.equal(result.steps, steps.length);
		assert.match(stripVTControlCharacters(result.stdout), /Done\./);
		const calls = f.readCalls();
		assert.deepEqual(calls[0], ["npm", "install", "-g", "@earendil-works/pi-coding-agent"]);
		if (pick) assert.deepEqual(calls.slice(1), coreSources.map(source => ["pi", "install", source]));
		else {
			assert.equal(calls.filter(call => call[1] === "install" && call[0] === "pi").length, 6);
			assert.deepEqual(calls.at(-1), ["pi", "install", "npm:pi-web-access"]);
			assert.deepEqual(calls.filter(call => call[1] === "remove"), []);
		}
		const after = JSON.parse(readFileSync(f.settings, "utf8"));
		assert.deepEqual(after.subagents.agentOverrides.reviewer, { model: "", tools: ["read"] });
		assert.equal(Object.keys(f.snapshot()).filter(name => name.endsWith(".bak")).length, 2);
	});
}

test("noninteractive selectors and --yes preserve selected installs without bootstrap", { skip: process.platform === "win32" }, (t) => {
	for (const [args, sources] of [
		[["--yes"], coreSources],
		[["--only", "core"], coreSources],
		[["--only", "core,optional"], coreSources],
		[["--only", "optional"], []],
		[["--except", "core"], []],
		[["--only", "web-access"], ["npm:pi-web-access"]],
		[["--except", "web-access"], coreSources.slice(0, -1)],
		[["--except", "optional"], coreSources],
		[["--except", "core,optional"], []],
	]) {
		const f = fixture(t, { installed: true });
		const result = f.run(["install", ...args]);
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.equal(result.stderr, "");
		assert.deepEqual(f.readCalls(), sources.map(source => ["pi", "install", source]));
		if (!sources.length) {
			assert.equal(result.stdout, "Nothing selected — nothing to install.\n");
			assert.deepEqual(f.snapshot(), f.before);
		} else assert.match(result.stdout, new RegExp(`Selected:          ${sources.length}/6\\n`));
	}
});

test("declining Pi bootstrap after selection retains exit 127 without changes", { skip: process.platform !== "linux" }, async (t) => {
	const f = fixture(t);
	const result = await f.tty([
		["or pick them yourself?", ["\r"], []],
		["Install Pi now with", ["\x1b[C", "\r"], []],
	]);
	assert.equal(result.status, 127, result.stdout + result.stderr);
	assert.equal(result.stderr, "");
	assert.match(stripVTControlCharacters(result.stdout), /Install Pi first, then re-run `npx @tommy-ca\/lazypi`\./);
	assert.deepEqual(f.readCalls(), []);
	assert.deepEqual(f.snapshot(), f.before);
});

test("unattended --yes retains accepted bootstrap before selected package actions", { skip: process.platform === "win32" }, (t) => {
	const f = fixture(t);
	const result = f.run(["install", "--yes", "--only", "web-access"]);
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.equal(result.stderr, "");
	assert.match(result.stdout, /Selected:          1\/6\n/);
	assert.deepEqual(f.readCalls(), [
		["npm", "install", "-g", "@earendil-works/pi-coding-agent"],
		["pi", "install", "npm:pi-web-access"],
	]);
	assert.deepEqual(f.snapshot(), f.before);
});

test("invalid settings and unknown selectors fail before bootstrap and leave all settings intact", { skip: process.platform === "win32" }, (t) => {
	for (const malformed of [false, true]) {
		const f = fixture(t, { malformed });
		const result = f.run(["install", "--yes", ...(malformed ? ["--except", "core,optional"] : ["--only", "not-a-package"])]);
		assert.equal(result.status, 2);
		assert.equal(result.stdout, "");
		assert.match(result.stderr, malformed ? /^Could not parse .*settings\.json — / : /^Unknown --only: not-a-package\nValid categories: core, optional\nValid package ids: /);
		assert.deepEqual(f.readCalls(), []);
		assert.deepEqual(f.snapshot(), f.before);
	}
});
