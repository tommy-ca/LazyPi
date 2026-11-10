import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { auditCoverage, auditRepository, parseCliSurface } from "../scripts/cli-surface.mjs";

const source = readFileSync("bin/lazypi.mjs", "utf8");

function fixture({ surface, coverage, features, readme = "- [Doc](doc.md)\n" }) {
	return auditCoverage({ surface, coverage, readme, features: new Map(Object.entries(features)) });
}

test("the CLI surface and the verification feature map agree", () => {
	assert.deepEqual(auditRepository(), []);
});

test("surface extraction reads the commands and flags the parser accepts", () => {
	const surface = parseCliSurface(source);
	assert.deepEqual(surface.commands, ["install", "status", "update", "doctor", "remove"]);
	assert.deepEqual([...surface.flags].sort(), ["--except", "--help", "--local", "--only", "--version", "--yes", "-V", "-h", "-l", "-y"].sort());
	assert.deepEqual(surface.unrecognized, []);
});

test("an undocumented command or flag fails the audit", () => {
	const coverage = [{ ids: ["install", "-y", "--yes"], doc: "doc.md", mention: "install" }];
	const issues = fixture({
		surface: { commands: ["install", "tier"], flags: ["--yes", "-y", "--json"], unrecognized: [] },
		coverage,
		features: { "doc.md": "install --yes\n" },
	});
	assert.deepEqual(issues, ["uncovered command: tier", "uncovered flag: --json"]);
});

test("a coverage entry for something the parser does not accept fails the audit", () => {
	const issues = fixture({
		surface: { commands: ["install"], flags: ["--yes"], unrecognized: [] },
		coverage: [{ ids: ["install", "--yes", "--tier"], doc: "doc.md", mention: "install" }],
		features: { "doc.md": "install --yes\n" },
	});
	assert.deepEqual(issues, ["coverage entry names something the parser does not accept: --tier"]);
});

test("a feature doc that is missing, unlisted, or silent about its surface item fails the audit", () => {
	const surface = { commands: ["install"], flags: ["--yes"], unrecognized: [] };
	const coverage = [{ ids: ["install", "--yes"], doc: "doc.md", mention: "--yes" }];
	assert.deepEqual(fixture({ surface, coverage, features: {} }), ["missing feature doc: doc.md"]);
	assert.deepEqual(fixture({ surface, coverage, features: { "doc.md": "install\n" }, readme: "# map\n" }), [
		"feature map README does not list doc.md",
		"doc.md does not document --yes",
	]);
	assert.deepEqual(fixture({ surface: { ...surface, unrecognized: ["--tier"] }, coverage, features: { "doc.md": "install --yes\n" } }), [
		"unrecognized flag literal in parseArgs: --tier",
	]);
});
