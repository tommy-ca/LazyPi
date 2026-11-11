import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { FORBIDDEN_PHRASES, PINNED_SURFACES, auditCoverage, auditRepository, parseCliSurface } from "../scripts/cli-surface.mjs";

const source = readFileSync("bin/lazypi.mjs", "utf8");
const NO_SURFACE = { commands: [], flags: [], unrecognized: [] };

function auditProse(prose) {
	return auditCoverage({ surface: NO_SURFACE, coverage: [], features: new Map(), readme: "", prose: new Map(Object.entries(prose)) });
}

function fixture({ surface, coverage, features, readme = "- [Doc](doc.md)\n" }) {
	return auditCoverage({ surface, coverage, readme, features: new Map(Object.entries(features)) });
}

test("every forbidden phrase fails the audit", () => {
	assert.ok(FORBIDDEN_PHRASES.length > 0);
	for (const [phrase, why] of FORBIDDEN_PHRASES) {
		const issues = auditProse({ "doc.md": `Intro sentence. ${phrase} outro sentence.\n` });
		assert.ok(
			issues.includes(`doc.md repeats a stale claim: "${phrase}" — ${why}`),
			`${phrase} did not fail the audit: ${JSON.stringify(issues)}`,
		);
	}
});

test("correct prose about the same surfaces passes the audit", () => {
	assert.deepEqual(auditProse({
		"doc.md": "`install`, `status`, and `remove` accept `--local`; `update --local` is refused with exit 2 before any spawn.\n",
		"page.html": "Run <code>pi update --extensions</code> for installed packages.\n",
	}), []);
});

test("naming a pinned surface without its pinned outcome fails the audit", () => {
	const [[surface, outcome]] = PINNED_SURFACES;
	assert.deepEqual(auditProse({ "doc.md": `\`${surface}\` now reports the new scope.\n` }), [
		`doc.md names ${surface} without its pinned outcome "${outcome}"`,
	]);
});

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
