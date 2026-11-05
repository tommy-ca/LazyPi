import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PACKAGES } from "../bin/lazypi.mjs";

const CLI_PATH = resolve("bin/lazypi.mjs");

const CORE_IDS = [
	"subagents",
	"pi-ask-user",
	"pi-skillful",
	"goal",
	"web-access",
	"dynamic-workflows",
];

const OPTIONAL_IDS = ["mention-skill", "btw", "context-usage", "simplify", "fff", "ponytail", "lsp", "interactive-shell", "autoresearch", "todos", "memory", "verdict"];

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
	memory: "npm:@henryqw/pi-memory",
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
	const verdict = PACKAGES.find((pkg) => pkg.id === "verdict");
	assert.match(verdict.hint, /classifier errors/);
	assert.match(verdict.hint, /exemptions and manual shell escapes/);
});

test("active installer spec agrees with the catalog", () => {
	const spec = readFileSync("openspec/specs/lazypi/installer/spec.md", "utf8");
	assert.match(spec, /exactly 18 entries: 6 core and 12 optional/);
	assert.equal([...spec.matchAll(/17 ids for\s+`--except todos`/g)].length, 2);
	assert.match(spec, /`todos` SHALL resolve to `npm:@juicesharp\/rpiv-todo`/);
	assert.match(spec, /`memory` SHALL resolve to `npm:@henryqw\/pi-memory`/);
	for (const source of ["npm:pi-manage-todo-list", "git:github.com/tintinweb/pi-manage-todo-list", "npm:pi-memory-md", "git:github.com/VandeeFeng/pi-memory-md"]) {
		assert.ok(spec.includes(`\`${source}\``), source);
	}
	assert.equal([...spec.matchAll(/Install everything (?:path )?installs 18\s*packages/g)].length, 2);
	assert.match(spec, /why twelve packages are optional/);
	assert.match(spec, /why 12 packages are optional/);
});

test("lean catalog delta contains the complete modified requirements", () => {
	const active = readFileSync("openspec/specs/lazypi/installer/spec.md", "utf8");
	const delta = readFileSync("openspec/changes/2026-11-04-lean-autonomy-core/specs/lazypi/installer/spec.md", "utf8");
	const modified = delta.split("## ADDED Requirements")[0];
	for (const name of ["Catalog Model", "Catalog documentation", "Reconciled catalog contract", "Permission gate catalog entry"]) {
		const heading = `### Requirement: ${name}\n`;
		const section = (text) => text.split(heading)[1]?.split(/\n### Requirement:|\n## (?:ADDED|MODIFIED) Requirements/)[0].trim();
		assert.ok(section(active), `${name} exists in active spec`);
		assert.equal(section(modified), section(active), name);
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
	assert.match(output, /optional\s+.*\bverdict\b/);
});
