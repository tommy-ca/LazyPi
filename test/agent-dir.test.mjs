import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, posix, win32 } from "node:path";

import { resolveAgentConfigDir } from "../bin/lazypi.mjs";
import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const EXTENSION_SETTINGS_SOURCE = "npm:@juanibiapina/pi-extension-settings";
const POWERBAR_SOURCE = "npm:@juanibiapina/powerbar";

const CORE_SOURCES = [
	"git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8",
	"npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access",
];

function writeSettings(path, packages) {
	mkdirSync(path, { recursive: true });
	writeFileSync(join(path, "settings.json"), JSON.stringify({ packages }, null, 2) + "\n");
}

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function calledArgv(sandbox) {
	return sandbox.external().map((record) => record.argv);
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
	const sandbox = createCliSandbox(t);
	const customAgentDir = join(sandbox.home, ".pi", "lazy");
	writeSettings(sandbox.agent, ["npm:pi-mcp-adapter"]);
	writeSettings(customAgentDir, ["npm:pi-subagents"]);

	const result = sandbox.run(["status"], { env: { PI_CODING_AGENT_DIR: "~/.pi/lazy" } });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.ok(result.stdout.includes(`Settings file: ${join(customAgentDir, "settings.json")}`));
	assert.match(result.stdout, /✓ \[core\] subagents/);
	assert.doesNotMatch(result.stdout, /✓ \[core\] mcp/);
});

test("status preserves and classifies pinned retired and external registrations", (t) => {
	const sandbox = createCliSandbox(t);
	const settingsFile = sandbox.settingsPath();
	writeSettings(sandbox.agent, ["npm:@narumitw/pi-btw@0.63.4", "npm:pi-memory-md@0.1.38", "npm:external-example"]);
	const before = readFileSync(settingsFile, "utf8");

	const result = sandbox.run(["status"]);

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /Other Pi packages outside the LazyPi catalog \(3\):/);
	assert.match(result.stdout, /npm:@narumitw\/pi-btw@0\.63\.4/);
	assert.match(result.stdout, /npm:pi-memory-md@0\.1\.38/);
	assert.match(result.stdout, /npm:external-example/);
	assert.equal(readFileSync(settingsFile, "utf8"), before);
});

for (const [name, selection] of [["default", []], ["explicit core", ["--only", "core"]]]) {
	test(`${name} install selects the candidate core and preserves unselected registrations`, (t) => {
		const sandbox = createCliSandbox(t);
		const settingsFile = sandbox.settingsPath();
		const packages = ["npm:pi-btw@0.1.0", "npm:external-example"];
		writeJson(settingsFile, { packages, keep: { marker: true } });

		const result = sandbox.run(["install", "--yes", ...selection]);

		assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.match(result.stdout, /Selected:\s+6\/6/);
		assert.deepEqual(calledArgv(sandbox), [
			["install", "git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8"],
			["install", "npm:pi-subagents"],
			["install", "npm:pi-better-sandbox"],
			["install", "npm:pi-verdict"],
			["install", "npm:pi-ask-user"],
			["install", "npm:pi-web-access"],
		]);
		const after = JSON.parse(readFileSync(settingsFile, "utf8"));
		assert.deepEqual(after.packages, packages);
		assert.deepEqual(after.keep, { marker: true });
	});
}

// The stub behaves like Pi: it rejects anything but its documented install
// shape and registers the source in the settings file it is pointed at.
function stubStatefulPi(sandbox, local) {
	sandbox.stub(
		"pi",
		`import { readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const prefix = ${JSON.stringify(local ? ["install", "-l", "--approve"] : ["install"])};
if (args.length !== prefix.length + 1 || !prefix.every((arg, i) => args[i] === arg)
	|| !/^(npm:|git:)/.test(args.at(-1))) {
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
`,
	);
}

for (const local of [false, true]) {
	const scope = local ? "project" : "global";
	test(`${scope} default install preserves state with stateful fake Pi`, { skip: process.platform === "win32" }, (t) => {
		const sandbox = createCliSandbox(t);
		const globalSettings = sandbox.settingsPath();
		const projectSettings = join(sandbox.work, ".pi", "settings.json");
		const settingsFile = local ? projectSettings : globalSettings;
		const oppositeFile = local ? globalSettings : projectSettings;
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
		const configFile = join(sandbox.agent, "fixture-config.json");
		const dataFile = join(sandbox.work, ".pi", "fixture-data.md");
		writeJson(configFile, { enabled: true, untouched: [1, 2] });
		mkdirSync(dirname(dataFile), { recursive: true });
		writeFileSync(dataFile, "Persistent package data.\n\u0000sentinel\n");
		const unchangedFiles = [oppositeFile, configFile, dataFile].map(path => [path, readFileSync(path)]);
		stubStatefulPi(sandbox, local);

		const result = sandbox.run(["install", "--yes", ...(local ? ["--local"] : [])], {
			env: { PI_TEST_SETTINGS: settingsFile },
		});
		assert.equal(result.error, undefined);
		assert.match(result.stdout, /Selected:          6\/6\n/);
		assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		assert.equal(result.signal, null);
		assert.equal(result.stderr, "");
		const prefix = local ? ["install", "-l", "--approve"] : ["install"];
		assert.deepEqual(calledArgv(sandbox), CORE_SOURCES.map(source => [...prefix, source]));
		assert.deepEqual(JSON.parse(readFileSync(settingsFile, "utf8")), {
			...original,
			packages: [...packages, ...CORE_SOURCES],
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
			"Selected:          6/6",
			"Already installed: 0",
			"Will install:      6",
			"Pi credentials:    none detected",
			...CORE_SOURCES.flatMap(source => ["", `→ pi install ${source}`]),
			"",
			"What you've got:",
			"  pstack               Canonical checkout registration only; native role binding and loading remain unverified.",
			"  subagents            Run isolated sub-agents for parallel work.",
			"  sandbox              Disabled until explicitly configured; registration is not containment.",
			"  verdict              Permission gate with fail-closed classifier errors; configured exemptions and manual shell escapes are not classified.",
			"  pi-ask-user          Interactive user questions, single or 2-4 question batches; not hard approval.",
			"  web-access           Built-in web search and URL fetching.",
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

test("optional selection is empty without package calls or settings changes", (t) => {
	const sandbox = createCliSandbox(t);
	writeSettings(sandbox.agent, []);

	const before = readFileSync(sandbox.settingsPath(), "utf8");
	const result = sandbox.run(["install", "--yes", "--only", "optional"]);

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(result.stderr, "");
	assert.equal(result.stdout, "Nothing selected — nothing to install.\n");
	assert.deepEqual(sandbox.external(), []);
	assert.equal(readFileSync(sandbox.settingsPath(), "utf8"), before);
});

test("web access remains individually installable", (t) => {
	const sandbox = createCliSandbox(t);
	writeSettings(sandbox.agent, []);

	const result = sandbox.run(["install", "--yes", "--only", "web-access"]);

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /Selected:\s+1\/6/);
	assert.deepEqual(calledArgv(sandbox), [["install", "npm:pi-web-access"]]);
});

test("status displays the installed source pin, not only the id column", (t) => {
	const sandbox = createCliSandbox(t);
	writeSettings(sandbox.agent, ["npm:pi-subagents@0.62.0"]);

	const result = sandbox.run(["status"]);

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /✓ \[core\] subagents/);
	assert.match(result.stdout, /npm:pi-subagents@0.62.0/);
});

test("install reads auth and writes settings in PI_CODING_AGENT_DIR", (t) => {
	const sandbox = createCliSandbox(t);
	const customAgentDir = join(sandbox.home, ".pi", "lazy");
	writeSettings(sandbox.agent, ["npm:pi-mcp-adapter"]);
	writeSettings(customAgentDir, ["npm:pi-subagents"]);
	writeJson(join(sandbox.agent, "auth.json"), { openai: { type: "api_key", key: "default" } });
	writeJson(join(customAgentDir, "auth.json"), { anthropic: { type: "api_key", key: "custom" } });

	const result = sandbox.run(["--yes", "--only", "subagents"], { env: { PI_CODING_AGENT_DIR: customAgentDir } });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /Pi credentials:\s+anthropic \(auth\.json\)/);
	const customSettings = JSON.parse(readFileSync(join(customAgentDir, "settings.json"), "utf8"));
	const defaultSettings = JSON.parse(readFileSync(join(sandbox.agent, "settings.json"), "utf8"));
	assert.equal(customSettings.subagents.agentOverrides.reviewer.model, "");
	assert.equal(defaultSettings.subagents, undefined);
});

test("update and remove inspect the custom global settings", (t) => {
	const sandbox = createCliSandbox(t);
	const customAgentDir = join(sandbox.home, ".pi", "lazy");
	writeSettings(sandbox.agent, ["npm:pi-subagents"]);
	writeSettings(customAgentDir, [POWERBAR_SOURCE, EXTENSION_SETTINGS_SOURCE, "npm:pi-web-access"]);

	const updateResult = sandbox.run(["update"], { env: { PI_CODING_AGENT_DIR: customAgentDir } });
	assert.equal(updateResult.status, 0, `STDOUT:\n${updateResult.stdout}\nSTDERR:\n${updateResult.stderr}`);
	const customSettings = JSON.parse(readFileSync(join(customAgentDir, "settings.json"), "utf8"));
	assert.deepEqual(customSettings.packages, [POWERBAR_SOURCE, EXTENSION_SETTINGS_SOURCE, "npm:pi-web-access"]);
	assert.deepEqual(JSON.parse(readFileSync(join(sandbox.agent, "settings.json"), "utf8")).packages, ["npm:pi-subagents"]);

	const removeResult = sandbox.run(["remove", "web-access"], { env: { PI_CODING_AGENT_DIR: customAgentDir } });
	assert.equal(removeResult.status, 0, `STDOUT:\n${removeResult.stdout}\nSTDERR:\n${removeResult.stderr}`);
	assert.deepEqual(calledArgv(sandbox), [["update", "--extensions"], ["remove", "npm:pi-web-access"]]);
});

test("--local settings remain independent of PI_CODING_AGENT_DIR", (t) => {
	const sandbox = createCliSandbox(t);
	const customAgentDir = join(sandbox.home, ".pi", "lazy");
	writeSettings(customAgentDir, ["npm:pi-subagents"]);
	writeSettings(join(sandbox.work, ".pi"), ["npm:pi-web-access"]);

	const result = sandbox.run(["status", "--local"], { env: { PI_CODING_AGENT_DIR: customAgentDir } });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.ok(result.stdout.includes(`Settings file: ${join(sandbox.work, ".pi", "settings.json")}`));
	assert.match(result.stdout, /✓ \[core\] web-access/);
	assert.doesNotMatch(result.stdout, /✓ \[core\] subagents/);
});
