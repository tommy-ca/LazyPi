import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { PACKAGES, resolveSelection } from "../bin/lazypi.mjs";

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

function createWorkspace(t) {
	const root = mkdtempSync(join(tmpdir(), "lazypi-remaining-seams-"));
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
		writeFileSync(join(bin, "pi.cmd"), "@echo off\r\nif \"%1\"==\"--version\" echo pi test\r\nexit /b 0\r\n");
		return;
	}
	const piPath = join(bin, "pi");
	writeFileSync(piPath, "#!/bin/sh\nif [ \"$1\" = \"--version\" ]; then echo 'pi test'; fi\nexit 0\n");
	chmodSync(piPath, 0o755);
}

function runCli(args, { cwd, home, agentDir, bin } = {}) {
	const env = {
		...process.env,
		HOME: home,
		USERPROFILE: home,
		PI_CODING_AGENT_DIR: agentDir,
	};
	if (bin) env.PATH = [bin, process.env.PATH].filter(Boolean).join(delimiter);
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

test("--except todos selects 16 ids from the full catalog", () => {
	const ids = resolveSelection({ except: ["todos"] });
	assert.equal(PACKAGES.length, 17);
	assert.equal(ids.size, 16);
	assert.equal(ids.has("todos"), false);
	assert.equal(ids.has("subagents"), true);
	assert.equal(ids.has("memory"), true);
});

test("doctor with no settings file warns and exits 0", (t) => {
	const { home, workspace, bin } = createWorkspace(t);
	writeFakePi(bin);
	const agentDir = join(home, ".pi", "agent");
	const result = runCli(["doctor"], { cwd: workspace, home, agentDir, bin });
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.match(output, /does not exist yet/);
	assert.match(output, /warning\(s\) found/);
	assert.doesNotMatch(output, /problem\(s\) found/);
});

test("doctor warns on outsider unpinned git and skips catalog legacy git", (t) => {
	const { home, workspace, bin } = createWorkspace(t);
	writeFakePi(bin);
	const agentDir = join(home, ".pi", "agent");
	mkdirSync(agentDir, { recursive: true });
	writeFileSync(
		join(agentDir, "settings.json"),
		JSON.stringify({
			packages: [
				"git:github.com/VandeeFeng/pi-memory-md",
				"git:github.com/acme/unrelated-tool",
			],
		}) + "\n",
	);
	const result = runCli(["doctor"], { cwd: workspace, home, agentDir, bin });
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.doesNotMatch(output, /VandeeFeng\/pi-memory-md is an unpinned git head/);
	assert.match(output, /acme\/unrelated-tool is an unpinned git head/);
});

test("status prints core and optional installed counts after the catalog header", (t) => {
	const { home, workspace, bin } = createWorkspace(t);
	writeFakePi(bin);
	const agentDir = join(home, ".pi", "agent");
	const result = runCli(["status"], { cwd: workspace, home, agentDir, bin });
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.match(output, /Installed from LazyPi catalog \(0\/17\):/);
	assert.match(output, /core 0\/12, optional 0\/5/);
});
