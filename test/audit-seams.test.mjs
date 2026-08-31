import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { PACKAGES, writeSubagentOverrides } from "../bin/lazypi.mjs";

const CLI_PATH = resolve("bin/lazypi.mjs");
const AUTH_ENV_VARS = [
	"ANTHROPIC_API_KEY",
	"OPENAI_API_KEY",
	"GOOGLE_API_KEY",
	"GEMINI_API_KEY",
	"OPENROUTER_API_KEY",
	"TOGETHER_API_KEY",
	"GROQ_API_KEY",
	"MISTRAL_API_KEY",
];
const SUBAGENT_BUILTIN_MODELS = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];

function createWorkspace(t) {
	const root = mkdtempSync(join(tmpdir(), "lazypi-audit-seams-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const home = join(root, "home");
	const workspace = join(root, "workspace");
	const bin = join(root, "bin");
	mkdirSync(home, { recursive: true });
	mkdirSync(workspace, { recursive: true });
	mkdirSync(bin, { recursive: true });
	return { root, home, workspace, bin };
}

function writeFakePi(bin) {
	if (process.platform === "win32") {
		writeFileSync(join(bin, "pi.cmd"), "@echo off\r\nif \"%1\"==\"--version\" echo pi test\r\nif defined PI_TEST_CALLS echo %*>>\"%PI_TEST_CALLS%\"\r\nexit /b 0\r\n");
		return;
	}
	const piPath = join(bin, "pi");
	writeFileSync(piPath, "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then echo 'pi test'; fi\nif [ -n \"$PI_TEST_CALLS\" ]; then printf '%s\\n' \"$*\" >> \"$PI_TEST_CALLS\"; fi\nexit 0\n");
	chmodSync(piPath, 0o755);
}

function runCli(args, { cwd, home, agentDir, bin, callsPath } = {}) {
	const env = {
		...process.env,
		HOME: home,
		USERPROFILE: home,
		PI_CODING_AGENT_DIR: agentDir,
	};
	if (bin) env.PATH = [bin, process.env.PATH].filter(Boolean).join(delimiter);
	if (callsPath) env.PI_TEST_CALLS = callsPath;
	for (const key of AUTH_ENV_VARS) delete env[key];
	const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
		cwd,
		env,
		encoding: "utf8",
		timeout: 60_000,
	});
	if (result.error) throw result.error;
	return result;
}

function readCalls(callsPath) {
	if (!existsSync(callsPath)) return [];
	return readFileSync(callsPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
}

function emptyOverrides() {
	const agentOverrides = {};
	for (const name of SUBAGENT_BUILTIN_MODELS) {
		agentOverrides[name] = name === "planner" ? { model: "", keep: true } : { model: "" };
	}
	return agentOverrides;
}

test("missing or empty --only/--except and both flags print help and exit 2", (t) => {
	const { home, workspace } = createWorkspace(t);
	const cases = [
		["--only"],
		["--except"],
		["--only="],
		["--except="],
		["--only", "core", "--except", "fff"],
	];
	for (const args of cases) {
		const result = runCli(args, { cwd: workspace, home });
		assert.equal(result.status, 2, args.join(" "));
		const output = `${result.stdout}\n${result.stderr}`;
		assert.match(output, /Usage:/, args.join(" "));
	}
});

test("valid --only core does not exit 2 from selector usage", (t) => {
	const { root, home, workspace, bin } = createWorkspace(t);
	writeFakePi(bin);
	const result = runCli(["--yes", "--only", "core"], {
		cwd: workspace,
		home,
		agentDir: join(home, ".pi", "agent"),
		bin,
		callsPath: join(root, "pi-calls.log"),
	});
	assert.notEqual(result.status, 2, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
});

const CORRUPT_COMMANDS = [
	["status"],
	["update"],
	["doctor"],
	["--yes"],
	["--yes", "--only", "fff"],
	["remove", "fff"],
];

for (const args of CORRUPT_COMMANDS) {
	test(`corrupt settings.json fails closed for ${args.join(" ")}`, (t) => {
		const { root, home, workspace, bin } = createWorkspace(t);
		const agentDir = join(home, ".pi", "agent");
		const callsPath = join(root, "pi-calls.log");
		writeFakePi(bin);
		mkdirSync(agentDir, { recursive: true });
		writeFileSync(join(agentDir, "settings.json"), "{ not json\n");

		const result = runCli(args, { cwd: workspace, home, agentDir, bin, callsPath });
		assert.equal(result.status, 2, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.deepEqual(readCalls(callsPath), []);
	});
}

test("writeSubagentOverrides skips write when empty models exist and keeps extra keys", (t) => {
	const { home } = createWorkspace(t);
	const agentDir = join(home, ".pi", "agent");
	mkdirSync(agentDir, { recursive: true });
	const settingsFile = join(agentDir, "settings.json");
	const parsed = {
		packages: PACKAGES.map((pkg) => pkg.source),
		subagents: { agentOverrides: emptyOverrides() },
	};
	writeFileSync(settingsFile, JSON.stringify(parsed, null, 2) + "\n");
	const before = readFileSync(settingsFile, "utf8");
	const mtime = statSync(settingsFile).mtimeMs;
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = agentDir;
	t.after(() => {
		if (previous == null) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous;
	});

	const result = writeSubagentOverrides(false);
	assert.equal(result.changed, false);
	assert.equal(result.backup, null);
	assert.equal(readFileSync(settingsFile, "utf8"), before);
	assert.equal(statSync(settingsFile).mtimeMs, mtime);
	assert.equal(JSON.parse(before).subagents.agentOverrides.planner.keep, true);
	assert.equal(readdirSync(dirname(settingsFile)).some((name) => name.includes(".bak")), false);
});

test("writeSubagentOverrides merges model:\"\" into existing override objects", (t) => {
	const { home } = createWorkspace(t);
	const agentDir = join(home, ".pi", "agent");
	mkdirSync(agentDir, { recursive: true });
	const settingsFile = join(agentDir, "settings.json");
	const agentOverrides = emptyOverrides();
	agentOverrides.planner = { model: "opus", keep: true };
	writeFileSync(settingsFile, JSON.stringify({ subagents: { agentOverrides } }, null, 2) + "\n");
	const previous = process.env.PI_CODING_AGENT_DIR;
	process.env.PI_CODING_AGENT_DIR = agentDir;
	t.after(() => {
		if (previous == null) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = previous;
	});

	const result = writeSubagentOverrides(false);
	assert.equal(result.changed, true);
	const written = JSON.parse(readFileSync(settingsFile, "utf8"));
	assert.deepEqual(written.subagents.agentOverrides.planner, { model: "", keep: true });
});
