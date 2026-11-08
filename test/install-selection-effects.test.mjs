import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { stripVTControlCharacters } from "node:util";

const cli = resolve("bin/lazypi.mjs");
const ttyRunner = "/usr/bin/script";
const coreSources = ["git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8", "npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user"];

function fixture({ installed = false, malformed = false } = {}) {
	const root = mkdtempSync(join(tmpdir(), "selection-"));
	const dirs = Object.fromEntries(["home", "agent", "work", "bin", "tmp", "config", "cache", "data", "state", "npm-cache"].map(name => [name, join(root, name)]));
	for (const path of Object.values(dirs)) mkdirSync(path);
	const settings = join(dirs.agent, "settings.json");
	writeFileSync(settings, malformed ? "{\n" : JSON.stringify({ packages: ["npm:pi-btw@0.1.0"], subagents: { agentOverrides: { reviewer: { model: "keep-model", tools: ["read"] } } }, keep: true }) + "\n");
	writeFileSync(join(dirs.agent, "settings.json.lazypi.fixture.bak"), "existing backup\n");
	writeFileSync(join(root, "npmrc"), "");
	const calls = join(root, "calls.jsonl");
	writeFileSync(calls, "");
	function executable(name, body) {
		const path = join(dirs.bin, name);
		writeFileSync(path, `#!${process.execPath}\n${body}`);
		chmodSync(path, 0o755);
	}
	executable("which", `import { existsSync } from 'node:fs';
const name = process.argv[2];
if (!['pi', 'npm'].includes(name)) process.exit(98);
if (name === 'pi' && !existsSync(${JSON.stringify(join(root, "ready"))})) process.exit(1);
console.log(${JSON.stringify(dirs.bin)} + '/' + name);\n`);
	executable("npm", `import { appendFileSync, writeFileSync } from 'node:fs';
appendFileSync(${JSON.stringify(calls)}, JSON.stringify(['npm', ...process.argv.slice(2)]) + '\\n');
writeFileSync(${JSON.stringify(join(root, "ready"))}, 'ready');\n`);
	executable("pi", `import { appendFileSync } from 'node:fs';
appendFileSync(${JSON.stringify(calls)}, JSON.stringify(['pi', ...process.argv.slice(2)]) + '\\n');\n`);
	if (installed) writeFileSync(join(root, "ready"), "ready");
	const env = {
		PATH: dirs.bin, HOME: dirs.home, USERPROFILE: dirs.home, PI_CODING_AGENT_DIR: dirs.agent,
		TMPDIR: dirs.tmp, XDG_CONFIG_HOME: dirs.config, XDG_CACHE_HOME: dirs.cache,
		XDG_DATA_HOME: dirs.data, XDG_STATE_HOME: dirs.state, TERM: "dumb", NO_COLOR: "1",
		npm_config_cache: dirs["npm-cache"], npm_config_userconfig: join(root, "npmrc"), npm_config_globalconfig: join(root, "npmrc"),
	};
	const snapshot = () => Object.fromEntries(readdirSync(dirs.agent).sort().map(name => [name, readFileSync(join(dirs.agent, name), "utf8")]));
	const before = snapshot();
	const readCalls = () => readFileSync(calls, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line));
	function record(result, command) {
		writeFileSync(join(root, "command.json"), JSON.stringify(command));
		for (const key of ["stdout", "stderr"]) writeFileSync(join(root, `${key}.txt`), result[key]);
		writeFileSync(join(root, "exit.txt"), String(result.status));
		return result;
	}
	function run(args) {
		const result = spawnSync(process.execPath, [cli, ...args], { cwd: dirs.work, env, encoding: "utf8", timeout: 10_000 });
		assert.equal(result.error, undefined);
		return record(result, [process.execPath, cli, ...args]);
	}
	async function tty(steps) {
		assert.ok(existsSync(ttyRunner), `Required TTY runner missing: ${ttyRunner}`);
		const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
		const args = ["-q", "-e", "-c", `/usr/bin/stty cols 160 rows 50; exec ${quote(process.execPath)} ${quote(cli)} install`, join(root, "typescript")];
		const child = spawn(ttyRunner, args, { cwd: dirs.work, env, stdio: ["pipe", "pipe", "pipe"] });
		let stdout = "", stderr = "", index = 0, unexpectedBootstrap = false;
		const promptCalls = [];
		const timer = setTimeout(() => child.kill("SIGKILL"), 3000);
		child.stdout.on("data", chunk => {
			stdout += chunk;
			const text = stripVTControlCharacters(stdout);
			if (index < steps.length && text.includes(steps[index][0])) {
				const [, keys, expectedCalls] = steps[index++];
				writeFileSync(join(root, `prompt-${index}.json`), JSON.stringify(readCalls()));
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
	return { root, settings, before, snapshot, readCalls, run, tty };
}

for (const stage of ["choice", "picker", "empty"]) {
	test(`interactive ${stage} exits without bootstrap or settings/model/backup changes`, { skip: process.platform !== "linux" }, async () => {
		const f = fixture();
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
	test(`interactive ${pick ? "picker" : "everything"} selection precedes accepted bootstrap`, { skip: process.platform !== "linux" }, async () => {
		const f = fixture();
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

test("noninteractive selectors and --yes preserve selected installs without bootstrap", { skip: process.platform === "win32" }, () => {
	for (const [args, sources] of [
		[["--yes"], coreSources],
		[["--only", "web-access"], ["npm:pi-web-access"]],
		[["--except", "optional"], coreSources],
		[["--except", "core,optional"], []],
	]) {
		const f = fixture({ installed: true });
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

test("declining Pi bootstrap after selection retains exit 127 without changes", { skip: process.platform !== "linux" }, async () => {
	const f = fixture();
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

test("unattended --yes retains accepted bootstrap before selected package actions", { skip: process.platform === "win32" }, () => {
	const f = fixture();
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

test("invalid settings and unknown selectors fail before bootstrap and leave all settings intact", { skip: process.platform === "win32" }, () => {
	for (const malformed of [false, true]) {
		const f = fixture({ malformed });
		const result = f.run(["install", "--yes", ...(malformed ? ["--except", "core,optional"] : ["--only", "not-a-package"])]);
		assert.equal(result.status, 2);
		assert.equal(result.stdout, "");
		assert.match(result.stderr, malformed ? /^Could not parse .*settings\.json — / : /^Unknown --only: not-a-package\nValid categories: core, optional\nValid package ids: /);
		assert.deepEqual(f.readCalls(), []);
		assert.deepEqual(f.snapshot(), f.before);
	}
});
