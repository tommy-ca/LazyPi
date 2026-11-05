import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, posix, resolve, win32 } from "node:path";
import { spawnSync } from "node:child_process";

import { resolveAgentConfigDir } from "../bin/lazypi.mjs";

const CLI_PATH = resolve("bin/lazypi.mjs");
const EXTENSION_SETTINGS_SOURCE = "npm:@juanibiapina/pi-extension-settings";
const POWERBAR_SOURCE = "npm:@juanibiapina/pi-powerbar";
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
	const root = mkdtempSync(join(tmpdir(), "lazypi-agent-dir-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const home = join(root, "home");
	const workspace = join(root, "workspace");
	const bin = join(root, "bin");
	mkdirSync(home, { recursive: true });
	mkdirSync(workspace, { recursive: true });
	mkdirSync(bin, { recursive: true });
	return { root, home, workspace, bin };
}

function writeSettings(path, packages) {
	mkdirSync(path, { recursive: true });
	writeFileSync(join(path, "settings.json"), JSON.stringify({ packages }, null, 2) + "\n");
}

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
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

test("resolveAgentConfigDir matches Pi path semantics", () => {
	const posixHome = "/home/tester";
	const windowsHome = "C:\\Users\\tester";
	const cases = [
		["unset", undefined, posixHome, "linux", posix.join(posixHome, ".pi", "agent")],
		["empty", "", posixHome, "linux", posix.join(posixHome, ".pi", "agent")],
		["absolute", "/opt/pi-agent", posixHome, "linux", "/opt/pi-agent"],
		["relative", ".config/pi-agent", posixHome, "linux", ".config/pi-agent"],
		["home", "~", posixHome, "linux", posixHome],
		["home child", "~/.pi/lazy", posixHome, "linux", posix.join(posixHome, ".pi", "lazy")],
		["Windows home child", "~\\.pi\\lazy", windowsHome, "win32", win32.join(windowsHome, ".pi", "lazy")],
		["Windows default", undefined, windowsHome, "win32", win32.join(windowsHome, ".pi", "agent")],
	];

	for (const [name, configured, home, platformName, expected] of cases) {
		assert.equal(resolveAgentConfigDir(configured, home, platformName), expected, name);
	}
});

test("status reads settings from PI_CODING_AGENT_DIR", (t) => {
	const { home, workspace } = createWorkspace(t);
	const customAgentDir = join(home, ".pi", "lazy");
	writeSettings(join(home, ".pi", "agent"), ["npm:pi-mcp-adapter"]);
	writeSettings(customAgentDir, ["npm:pi-subagents"]);

	const result = runCli(["status"], { cwd: workspace, home, agentDir: "~/.pi/lazy" });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.ok(result.stdout.includes(`Settings file: ${join(customAgentDir, "settings.json")}`));
	assert.match(result.stdout, /✓ \[core\] subagents/);
	assert.doesNotMatch(result.stdout, /✓ \[core\] mcp/);
});

test("status preserves and classifies existing pinned, legacy, and external registrations", (t) => {
	const { home, workspace } = createWorkspace(t);
	const agentDir = join(home, ".pi", "agent");
	const settingsFile = join(agentDir, "settings.json");
	writeSettings(agentDir, ["npm:@narumitw/pi-btw@0.63.4", "npm:pi-memory-md@0.1.38", "npm:external-example"]);
	const before = readFileSync(settingsFile, "utf8");

	const result = runCli(["status"], { cwd: workspace, home, agentDir });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /✓ \[(?:core|optional)\] btw\s+npm:@narumitw\/pi-btw@0\.63\.4/);
	assert.match(result.stdout, /! \[optional\] memory\s+npm:pi-memory-md@0\.1\.38/);
	assert.match(result.stdout, /Other Pi packages outside the LazyPi catalog \(1\):/);
	assert.match(result.stdout, /npm:external-example/);
	assert.equal(readFileSync(settingsFile, "utf8"), before);
});

for (const [name, selection] of [["default", []], ["explicit core", ["--only", "core"]]]) {
	test(`${name} install selects the autonomy core and preserves unselected registrations`, (t) => {
		const { root, home, workspace, bin } = createWorkspace(t);
		const agentDir = join(home, ".pi", "agent");
		const settingsFile = join(agentDir, "settings.json");
		const callsPath = join(root, "pi-calls.log");
		const packages = ["npm:pi-btw@0.1.0", "npm:external-example"];
		writeJson(settingsFile, { packages, keep: { marker: true } });
		writeFakePi(bin);

		const result = runCli(["install", "--yes", ...selection], { cwd: workspace, home, agentDir, bin, callsPath });

		assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.match(result.stdout, /Selected:\s+6\/18/);
		assert.deepEqual(readFileSync(callsPath, "utf8").trim().split(/\r?\n/), [
			"install npm:pi-subagents",
			"install npm:pi-ask-user",
			"install npm:pi-skillful",
			"install npm:@narumitw/pi-goal",
			"install npm:pi-web-access",
			"install npm:@quintinshaw/pi-dynamic-workflows",
		]);
		const after = JSON.parse(readFileSync(settingsFile, "utf8"));
		assert.deepEqual(after.packages, packages);
		assert.deepEqual(after.keep, { marker: true });
	});
}

function writeStatefulPi(bin, local) {
	const script = join(bin, "fake-pi.mjs");
	writeFileSync(script, `import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(process.env.PI_TEST_CALLS, JSON.stringify(args) + "\\n");
const prefix = ${JSON.stringify(local ? ["install", "-l", "--approve"] : ["install"])};
if (args.length !== prefix.length + 1 || !prefix.every((arg, i) => args[i] === arg)
	|| !args.at(-1).startsWith("npm:")) {
	console.error("Unexpected fake Pi command: " + JSON.stringify(args));
	process.exit(97);
}
const path = process.env.PI_TEST_SETTINGS;
const settings = JSON.parse(readFileSync(path, "utf8"));
const source = args.at(-1);
if (!settings.packages.some(entry => (typeof entry === "string" ? entry : entry.source) === source)) {
	settings.packages.push(source);
}
writeFileSync(path, JSON.stringify(settings, null, 2) + "\\n");
`);
	const pi = join(bin, "pi");
	writeFileSync(pi, `#!/bin/sh\nexec '${process.execPath}' '${script}' "$@"\n`);
	chmodSync(pi, 0o755);
	// LazyPi probes with `which`; never let lookup reach host executables.
	const which = join(bin, "which");
	writeFileSync(which, `#!${process.execPath}\nconst args = process.argv.slice(2);
if (args.length !== 1 || !["pi", "npm"].includes(args[0])) process.exit(98);
console.log(${JSON.stringify(bin)} + "/" + args[0]);
`);
	chmodSync(which, 0o755);
	const npm = join(bin, "npm");
	writeFileSync(npm, `#!${process.execPath}\nimport { appendFileSync } from "node:fs";
appendFileSync(process.env.PI_TEST_CALLS, JSON.stringify(["unexpected npm", ...process.argv.slice(2)]) + "\\n");
console.error("Unexpected npm fallback");
process.exit(99);
`);
	chmodSync(npm, 0o755);
}

for (const local of [false, true]) {
	const scope = local ? "project" : "global";
	test(`${scope} default install preserves state with stateful fake Pi`, { skip: process.platform === "win32" }, (t) => {
		const { root, home, workspace, bin } = createWorkspace(t);
		const agentDir = join(home, ".pi", "agent");
		const globalSettings = join(agentDir, "settings.json");
		const projectSettings = join(workspace, ".pi", "settings.json");
		const settingsFile = local ? projectSettings : globalSettings;
		const oppositeFile = local ? globalSettings : projectSettings;
		const callsPath = join(root, "calls.jsonl");
		const packages = [
			{
				source: "npm:@narumitw/pi-btw@0.63.4",
				extensions: ["index.ts"],
				skills: [],
				marker: { pinned: true },
			},
			{
				source: "npm:pi-btw@0.1.0",
				extensions: [],
				prompts: ["prompts/legacy.md"],
				marker: "legacy",
			},
			"npm:pi-context-usage@1.0.0",
			{ source: "npm:external-example@2.0.0", extensions: ["custom.ts"], metadata: { owner: "fixture" } },
		];
		const original = {
			packages,
			theme: "fixture-theme",
			keep: { nested: ["untouched", 42] },
			subagents: {
				defaultModel: "fixture-default",
				agentOverrides: {
					reviewer: { model: "fixture-reviewer", tools: ["read"] },
					worker: { model: "", thinking: "high" },
					custom: { model: "fixture-custom" },
				},
			},
		};
		writeJson(settingsFile, original);
		writeJson(oppositeFile, {
			packages: ["npm:opposite-scope@3.0.0"],
			subagents: { agentOverrides: { reviewer: { model: "opposite-model" } } },
		});
		const configFile = join(agentDir, "fixture-config.json");
		const dataFile = join(workspace, ".pi", "fixture-data.md");
		writeJson(configFile, { enabled: true, untouched: [1, 2] });
		mkdirSync(dirname(dataFile), { recursive: true });
		writeFileSync(dataFile, "Persistent package data.\n\u0000sentinel\n");
		const unchangedFiles = [oppositeFile, configFile, dataFile].map(path => [path, readFileSync(path)]);
		writeFileSync(callsPath, "");
		writeStatefulPi(bin, local);

		const result = spawnSync(process.execPath, [CLI_PATH, "install", "--yes", ...(local ? ["--local"] : [])], {
			cwd: workspace,
			env: {
				HOME: home,
				USERPROFILE: home,
				PI_CODING_AGENT_DIR: agentDir,
				PATH: bin,
				PI_TEST_CALLS: callsPath,
				PI_TEST_SETTINGS: settingsFile,
			},
			encoding: "utf8",
			timeout: 15_000,
		});
		assert.equal(result.error, undefined);
		assert.match(result.stdout, /Selected:          6\/18\n/);
		assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.equal(result.signal, null);
		assert.equal(result.stderr, "");
		const sources = [
			"npm:pi-subagents",
			"npm:pi-ask-user",
			"npm:pi-skillful",
			"npm:@narumitw/pi-goal",
			"npm:pi-web-access",
			"npm:@quintinshaw/pi-dynamic-workflows",
		];
		const prefix = local ? ["install", "-l", "--approve"] : ["install"];
		const calls = readFileSync(callsPath, "utf8").trim().split("\n").map(line => JSON.parse(line));
		assert.deepEqual(calls, sources.map(source => [...prefix, source]));
		assert.deepEqual(JSON.parse(readFileSync(settingsFile, "utf8")), {
			...original,
			packages: [...packages, ...sources],
			subagents: {
				defaultModel: "fixture-default",
				agentOverrides: {
					reviewer: { model: "", tools: ["read"] },
					worker: { model: "", thinking: "high" },
					custom: { model: "fixture-custom" },
					"context-builder": { model: "" },
					planner: { model: "" },
					researcher: { model: "" },
					scout: { model: "" },
				},
			},
		});
		for (const [path, before] of unchangedFiles) assert.deepEqual(readFileSync(path), before, path);
		const target = local ? "project (.pi/settings.json)" : `global (${settingsFile})`;
		assert.equal(result.stdout, [
			`Target:            ${target}`,
			"Selected:          6/18",
			"Already installed: 0",
			"Will install:      6",
			"Pi credentials:    none detected",
			...sources.flatMap(source => ["", `→ pi install ${source}`]),
			"",
			"What you've got:",
			"  subagents            Run isolated sub-agents for parallel work.",
			"  pi-ask-user          Interactive user questions for agent workflows.",
			"  pi-skillful          Discover skills above the git root, hide unused skills, and expand /skill:name inline.",
			"  goal                 Stop on done, blocked, or external wait for long tasks.",
			"  web-access           Built-in web search and URL fetching.",
			"  dynamic-workflows    Fan work out across subagents: /workflows TUI, deep-research, resume, token accounting.",
			"",
			"Remove pi packages with `pi remove <source>`.",
			"",
			"Installed 6 package(s) — next steps:",
			"Pi credentials: none detected.",
			"",
			"Run `pi`, then type `/login` inside Pi to sign in with a",
			"subscription (Claude Pro/Max, ChatGPT Plus/Pro, Copilot, Gemini)",
			"or set a provider env var (ANTHROPIC_API_KEY, OPENAI_API_KEY, …)",
			"before launching pi.",
			"",
		].join("\n"));
	});
}

test("optional selection installs every non-core package", (t) => {
	const { root, home, workspace, bin } = createWorkspace(t);
	const agentDir = join(home, ".pi", "agent");
	const callsPath = join(root, "pi-calls.log");
	writeSettings(agentDir, []);
	writeFakePi(bin);

	const result = runCli(["install", "--yes", "--only", "optional"], { cwd: workspace, home, agentDir, bin, callsPath });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /Selected:\s+12\/18/);
	assert.deepEqual(readFileSync(callsPath, "utf8").trim().split(/\r?\n/), [
		"install npm:@zigai/pi-mention-skill",
		"install npm:@narumitw/pi-btw",
		"install npm:pi-context-usage",
		"install npm:pi-simplify",
		"install npm:@ff-labs/pi-fff",
		"install npm:@dietrichgebert/ponytail",
		"install npm:@narumitw/pi-lsp",
		"install npm:pi-interactive-shell",
		"install npm:pi-autoresearch",
		"install npm:@juicesharp/rpiv-todo",
		"install npm:@henryqw/pi-memory",
		"install npm:pi-verdict",
	]);
});

test("a demoted package remains individually installable", (t) => {
	const { root, home, workspace, bin } = createWorkspace(t);
	const agentDir = join(home, ".pi", "agent");
	const callsPath = join(root, "pi-calls.log");
	writeSettings(agentDir, []);
	writeFakePi(bin);

	const result = runCli(["install", "--yes", "--only", "fff"], { cwd: workspace, home, agentDir, bin, callsPath });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /Selected:\s+1\/18/);
	assert.equal(readFileSync(callsPath, "utf8").trim(), "install npm:@ff-labs/pi-fff");
});

test("status displays the installed source pin, not only the id column", (t) => {
	const { home, workspace } = createWorkspace(t);
	writeSettings(join(home, ".pi", "agent"), ["npm:pi-subagents@0.62.0"]);

	const result = runCli(["status"], { cwd: workspace, home });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /✓ \[core\] subagents/);
	assert.match(result.stdout, /npm:pi-subagents@0.62.0/);
});

test("install reads auth and writes settings in PI_CODING_AGENT_DIR", (t) => {
	const { home, workspace, bin } = createWorkspace(t);
	const defaultAgentDir = join(home, ".pi", "agent");
	const customAgentDir = join(home, ".pi", "lazy");
	writeFakePi(bin);
	writeSettings(defaultAgentDir, ["npm:pi-mcp-adapter"]);
	writeSettings(customAgentDir, ["npm:pi-subagents"]);
	writeJson(join(defaultAgentDir, "auth.json"), { openai: { type: "api_key", key: "default" } });
	writeJson(join(customAgentDir, "auth.json"), { anthropic: { type: "api_key", key: "custom" } });

	const result = runCli(["--yes", "--only", "subagents"], { cwd: workspace, home, agentDir: customAgentDir, bin });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /Pi credentials:\s+anthropic \(auth\.json\)/);
	const customSettings = JSON.parse(readFileSync(join(customAgentDir, "settings.json"), "utf8"));
	const defaultSettings = JSON.parse(readFileSync(join(defaultAgentDir, "settings.json"), "utf8"));
	assert.equal(customSettings.subagents.agentOverrides.reviewer.model, "");
	assert.equal(defaultSettings.subagents, undefined);
});

test("update and remove inspect the custom global settings", (t) => {
	const { root, home, workspace, bin } = createWorkspace(t);
	const callsPath = join(root, "pi-calls.log");
	const defaultAgentDir = join(home, ".pi", "agent");
	const customAgentDir = join(home, ".pi", "lazy");
	writeFakePi(bin);
	writeSettings(defaultAgentDir, ["npm:pi-subagents"]);
	writeSettings(customAgentDir, [POWERBAR_SOURCE, EXTENSION_SETTINGS_SOURCE, "npm:pi-web-access"]);

	const updateResult = runCli(["update"], { cwd: workspace, home, agentDir: customAgentDir, bin, callsPath });
	assert.equal(updateResult.status, 0, `STDOUT:\n${updateResult.stdout}\nSTDERR:\n${updateResult.stderr}`);
	const customSettings = JSON.parse(readFileSync(join(customAgentDir, "settings.json"), "utf8"));
	assert.deepEqual(customSettings.packages, [POWERBAR_SOURCE, EXTENSION_SETTINGS_SOURCE, "npm:pi-web-access"]);
	assert.deepEqual(JSON.parse(readFileSync(join(defaultAgentDir, "settings.json"), "utf8")).packages, ["npm:pi-subagents"]);

	const removeResult = runCli(["remove", "web-access"], { cwd: workspace, home, agentDir: customAgentDir, bin, callsPath });
	assert.equal(removeResult.status, 0, `STDOUT:\n${removeResult.stdout}\nSTDERR:\n${removeResult.stderr}`);
	const calls = readFileSync(callsPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
	assert.deepEqual(calls, ["update", "remove npm:pi-web-access"]);
});

test("--local settings remain independent of PI_CODING_AGENT_DIR", (t) => {
	const { home, workspace } = createWorkspace(t);
	const customAgentDir = join(home, ".pi", "lazy");
	writeSettings(customAgentDir, ["npm:pi-subagents"]);
	writeSettings(join(workspace, ".pi"), ["npm:@ff-labs/pi-fff"]);

	const result = runCli(["status", "--local"], { cwd: workspace, home, agentDir: customAgentDir });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.ok(result.stdout.includes(`Settings file: ${join(workspace, ".pi", "settings.json")}`));
	assert.match(result.stdout, /✓ \[optional\] fff/);
	assert.doesNotMatch(result.stdout, /✓ \[core\] subagents/);
});
