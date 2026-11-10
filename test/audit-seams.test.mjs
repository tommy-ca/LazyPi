import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { PACKAGES, writeSubagentOverrides } from "../bin/lazypi.mjs";
import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const SUBAGENT_BUILTIN_MODELS = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];

function emptyOverrides() {
	const agentOverrides = {};
	for (const name of SUBAGENT_BUILTIN_MODELS) {
		agentOverrides[name] = name === "planner" ? { model: "", keep: true } : { model: "" };
	}
	return agentOverrides;
}

test("missing or empty --only/--except and both flags print help and exit 2", (t) => {
	const sandbox = createCliSandbox(t);
	const cases = [
		["--only"],
		["--except"],
		["--only="],
		["--except="],
		["--only", "core", "--except", "fff"],
	];
	for (const args of cases) {
		const result = sandbox.run(args);
		assert.equal(result.status, 2, args.join(" "));
		const output = `${result.stdout}\n${result.stderr}`;
		assert.match(output, /Usage:/, args.join(" "));
	}
});

test("valid --only core does not exit 2 from selector usage", (t) => {
	const sandbox = createCliSandbox(t);
	const result = sandbox.run(["--yes", "--only", "core"]);
	assert.notEqual(result.status, 2, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.deepEqual(
		sandbox.external().map((record) => record.argv),
		PACKAGES.filter((pkg) => pkg.category === "core").map((pkg) => ["install", pkg.installSource ?? pkg.source]),
	);
});

test("install with no pi on a non-TTY fails fast with exit 127 instead of prompting", { skip: process.platform === "win32" ? "PATH masking differs on Windows" : false }, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("pi");
	const result = sandbox.run(["--local"]);
	assert.equal(result.error, undefined);
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 127, output);
	assert.match(output, /Install Pi first/);
	assert.doesNotMatch(output, /Yes \/ No|Install Pi now with/);
	assert.match(output, /Could not find the `pi` command/);
	assert.deepEqual(sandbox.external(), [], "a missing pi must not fall back to a real installer");
});

const CORRUPT_COMMANDS = [
	["status"],
	["update"],
	["doctor"],
	["--yes"],
	["--yes", "--only", "web-access"],
	["remove", "fff"],
];

for (const args of CORRUPT_COMMANDS) {
	test(`corrupt settings.json fails closed for ${args.join(" ")}`, (t) => {
		const sandbox = createCliSandbox(t);
		mkdirSync(sandbox.agent, { recursive: true });
		writeFileSync(sandbox.settingsPath(), "{ not json\n");

		const result = sandbox.run(args);
		assert.equal(result.status, 2, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.deepEqual(sandbox.external(), []);
	});
}

test("install selectors on other commands fail before execution or settings changes", (t) => {
	const sandbox = createCliSandbox(t);
	const settings = sandbox.settingsPath();
	mkdirSync(sandbox.agent, { recursive: true });
	const before = JSON.stringify({ packages: ["npm:pi-subagents"], keep: true }) + "\n";
	writeFileSync(settings, before);
	for (const command of ["update", "remove", "status", "doctor"]) {
		for (const selectors of [["--only=fff"], ["--except=fff"], ["--only=fff", "--except=fff"]]) {
			const args = command === "remove" ? [command, "subagents", ...selectors] : [command, ...selectors];
			const result = sandbox.run(args);
			assert.equal(result.status, 2, `${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
			assert.match(result.stderr, /--only and --except are only supported by install/);
			assert.deepEqual(sandbox.external(), []);
			assert.equal(readFileSync(settings, "utf8"), before);
		}
	}
});

test("version cannot bypass non-install selector rejection", (t) => {
	const sandbox = createCliSandbox(t);
	const settings = sandbox.settingsPath();
	mkdirSync(sandbox.agent, { recursive: true });
	const before = '{"packages":[],"keep":true}\n';
	writeFileSync(settings, before);
	for (const command of ["update", "remove", "status", "doctor"]) {
		for (const selector of ["--only=fff", "--except=fff"]) {
			for (const version of ["--version", "-V"]) {
				const result = sandbox.run([command, selector, version]);
				assert.equal(result.status, 2);
				assert.equal(result.stderr, "--only and --except are only supported by install\n");
				assert.match(result.stdout, /Usage:/);
				assert.deepEqual(sandbox.external(), []);
				assert.equal(readFileSync(settings, "utf8"), before);
			}
		}
	}
});

test("empty unattended selection does not install Pi or write settings", { skip: process.platform === "win32" && "isolated Unix PATH probe" }, (t) => {
	const sandbox = createCliSandbox(t);
	const agentDir = sandbox.agent;
	const result = sandbox.run(["install", "--yes", "--except", "core,optional"]);
	assert.equal(result.error, undefined);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	assert.match(result.stdout, /Nothing selected/);
	assert.deepEqual(sandbox.external(), [], "an empty selection must spawn nothing");
	assert.equal(existsSync(sandbox.settingsPath()), false);
});

test("writeSubagentOverrides skips write when empty models exist and keeps extra keys", (t) => {
	const sandbox = createCliSandbox(t);
	const agentDir = sandbox.agent;
	mkdirSync(agentDir, { recursive: true });
	const settingsFile = sandbox.settingsPath();
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
	const sandbox = createCliSandbox(t);
	const agentDir = sandbox.agent;
	mkdirSync(agentDir, { recursive: true });
	const settingsFile = sandbox.settingsPath();
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
