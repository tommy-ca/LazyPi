import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { PACKAGES } from "../bin/lazypi.mjs";

const CLI_PATH = resolve("bin/lazypi.mjs");

const CORE_IDS = [
	"subagents",
	"pi-ask-user",
	"pi-skillful",
	"mention-skill",
	"goal",
	"btw",
	"context-usage",
	"simplify",
	"web-access",
	"fff",
	"dynamic-workflows",
	"ponytail",
];

const OPTIONAL_IDS = ["lsp", "interactive-shell", "autoresearch", "todos", "memory", "verdict"];

const CURRENT_SOURCES = {
	subagents: "npm:pi-subagents",
	"pi-ask-user": "npm:pi-ask-user",
	"pi-skillful": "npm:pi-skillful",
	"mention-skill": "npm:@zigai/pi-mention-skill",
	goal: "npm:@narumitw/pi-goal",
	btw: "npm:@narumitw/pi-btw",
	"context-usage": "npm:pi-context-usage",
	simplify: "npm:pi-simplify",
	"web-access": "npm:pi-web-access",
	fff: "npm:@ff-labs/pi-fff",
	"dynamic-workflows": "npm:@quintinshaw/pi-dynamic-workflows",
	ponytail: "npm:@dietrichgebert/ponytail",
	lsp: "npm:@narumitw/pi-lsp",
	"interactive-shell": "npm:pi-interactive-shell",
	autoresearch: "npm:pi-autoresearch",
	todos: "npm:@juicesharp/rpiv-todo",
	memory: "npm:pi-memory-md",
	verdict: "npm:pi-verdict",
};

const DROPPED_IDS = [
	"compound",
	"powerbar",
	"extension-settings",
	"plannotator",
	"slopchop",
	"usage",
	"raw-paste",
	"plan",
	"add-dir",
	"claude-cli",
	"prompt-templates",
	"hackerman",
	"terminal-theme",
	"skill-args",
	"mcp",
	"ralph-wiggum",
	"curated-themes",
];

test("PACKAGES matches the lean catalog shape", () => {
	const core = PACKAGES.filter((p) => p.category === "core").map((p) => p.id);
	const optional = PACKAGES.filter((p) => p.category === "optional").map((p) => p.id);
	assert.deepEqual(core, CORE_IDS);
	assert.deepEqual(optional, OPTIONAL_IDS);
	assert.equal(PACKAGES.length, 18);
	for (const pkg of PACKAGES) {
		assert.equal(pkg.source, CURRENT_SOURCES[pkg.id], pkg.id);
	}
});

test("dropped package ids are absent from PACKAGES", () => {
	const ids = new Set(PACKAGES.map((p) => p.id));
	for (const id of DROPPED_IDS) {
		assert.equal(ids.has(id), false, id);
	}
});

test("--help does not advertise dropped extras as installable npm sources", () => {
	const result = spawnSync(process.execPath, [CLI_PATH, "--help"], {
		encoding: "utf8",
		timeout: 15_000,
	});
	if (result.error) throw result.error;
	const output = `${result.stdout}\n${result.stderr}`;
	assert.equal(result.status, 0, output);
	assert.doesNotMatch(output, /Non-catalog extras|npm:skill-args|npm:curated-themes/);
});
