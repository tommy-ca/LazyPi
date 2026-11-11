import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
	FORBIDDEN_PHRASES,
	PINNED_SURFACES,
	auditCoverage,
	auditProse,
	auditRepository,
	discoverProseSources,
	parseCliSurface,
} from "../scripts/cli-surface.mjs";

const source = readFileSync("bin/lazypi.mjs", "utf8");
const NO_SURFACE = { commands: [], flags: [], unrecognized: [] };

// A prose fixture, built through the public audit entry point rather than the
// internal maps, so a signature change cannot silently stop these tests from
// exercising the rules.
function prose(docs) {
	return auditProse(new Map(Object.entries(docs)));
}

function fixture({ surface, coverage, features, readme = "- [Doc](doc.md)\n" }) {
	return auditCoverage({ surface, coverage, readme, features: new Map(Object.entries(features)) });
}

function writeFixtureRoot(t, files) {
	const root = mkdtempSync(join(tmpdir(), "lazypi-prose-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	for (const [path, text] of Object.entries(files)) {
		const absolute = join(root, path);
		mkdirSync(dirname(absolute), { recursive: true });
		writeFileSync(absolute, text);
	}
	return root;
}

// The exact claims the audit covers. Pinned here independently of the module, so
// dropping a claim, widening one, or losing its reason fails this test instead of
// quietly narrowing the audit.
test("the audit covers exactly these stale phrasings, each with a reason", () => {
	assert.deepEqual(FORBIDDEN_PHRASES, [
		["including with `--local`", "only install, status, doctor, and remove accept --local"],
		["all accept it", "update refuses --local with exit 2"],
		["`update --local` spawns", "update --local is refused before any spawn"],
		["`--local` argv in `test/pstack-retirement.test.mjs`", "no test pins removal's local argv"],
		["neither needed nor asked for", "Windows resolution still asks where"],
		["must fail before it spawns anything", "--yes lets a missing pi spawn npm install -g"],
	]);
	assert.deepEqual(PINNED_SURFACES, [["update --local", "exit 2"]]);
});

test("every forbidden phrase fails the audit and carries its reason", () => {
	for (const [phrase, why] of FORBIDDEN_PHRASES) {
		const issues = prose({ "doc.md": `Intro sentence. ${phrase} outro sentence.\n` });
		assert.deepEqual(issues, [`doc.md repeats a stale claim: "${phrase}" — ${why}`]);
	}
});

// The rule has to survive rephrasing: a phrase table keyed on one wording passes
// a capital B, a <code> element, or any rewording that keeps the stale claim.
test("a line that names bare pi update without --extensions fails the audit", () => {
	const stale = [
		"Update remains broad `pi update`, including installed packages outside the catalog.",
		"Broad `pi update` still includes installed packages outside the catalog.",
		"<td>Run <code>pi update</code> for installed packages</td>",
		"LazyPi runs pi update for every installed package.",
		"Retired registrations stay eligible for broad <code>pi update</code>.",
		// A "not" in a neighbouring sentence must not excuse the stale claim;
		// this is the philosophy.html and removing.html sentence shape.
		"Subtraction does not disable active packages. `update` remains broad `pi update`.",
	];
	for (const line of stale) {
		assert.deepEqual(prose({ "doc.md": `${line}\n` }), [
			`doc.md:1 names bare \`pi update\` without \`--extensions\`; update asks Pi for \`pi update --extensions\``,
		], line);
	}
});

test("a claim that names --extensions passes however it is worded", () => {
	assert.deepEqual(prose({
		"doc.md": "Update remains broad `pi update --extensions`, including installed packages outside the catalog.\n"
			+ "LazyPi asks Pi for pi update --extensions and never passes --approve.\n"
			// update.md's own wording: the mention line disclaims bare pi update and
			// names --extensions in its next sentence.
			+ "Bare `pi update` upgrades the Pi harness itself. `pi update --extensions`\n"
			+ "updates registered extension packages, so LazyPi always asks for `--extensions`.\n",
		"page.html": "<p>Run <code>pi update --extensions</code> for installed packages.</p>\n",
	}), []);
});

// The near miss: true prose that names bare pi update in order to deny it. This is
// the exact sentence from docs/docs/updating.html, and it must keep passing.
test("a line that denies the bare pi update claim is not a stale claim", () => {
	assert.deepEqual(prose({
		"docs/docs/updating.html": "      Bare <code>pi update</code> upgrades Pi itself, so LazyPi never asks for it.\n"
			+ "      A bare <code>pi update</code> is not what LazyPi runs.\n"
			+ "      <li>Never run pi update by hand here; use the LazyPi command.</li>\n",
	}), []);
});

test("naming the pinned surface with the pinned outcome passes", () => {
	assert.deepEqual(prose({
		"update.md": "`update --local`: exit 2, the help text on stdout, and the refusal message on stderr.\n",
		"updating.html": "<code>npx @tommy-ca/lazypi update --local</code> is rejected with exit 2.\n",
	}), []);
});

// The defect this replaces: a file-wide co-presence check let any "exit 2" in the
// same file, such as remove.md's no-target or corrupt-settings text, stand in for
// the pinned outcome of an unrelated line.
test("an unrelated exit 2 elsewhere in the doc does not satisfy the pin", () => {
	assert.deepEqual(prose({
		"doc.md": "`update --local` now reports the new scope.\nCorrupt settings: exit 2, on stderr.\n",
	}), []);
	assert.deepEqual(prose({
		"doc.md": "Corrupt settings: exit 2, on stderr.\n\n`update --local` exits 0 after the spawn.\n",
	}), ["doc.md:3 names update --local with exit 0 — the suite pins \"exit 2\""]);
});

test("no prose line at all about a pinned surface is unswept ground, not a pass", () => {
	assert.deepEqual(prose({ "doc.md": "Nothing about update scope here.\n" }), []);
});

test("correct prose about the same surfaces passes the audit", () => {
	assert.deepEqual(prose({
		"doc.md": "`install`, `status`, and `remove` accept `--local`; `update --local` is refused with exit 2 before any spawn.\n",
		"page.html": "Run <code>pi update --extensions</code> for installed packages.\n",
	}), []);
});

// Discovery, not a hand-maintained list: a feature doc or docs page added later
// is swept without editing the audit, which is how the stale prose stayed stale.
test("prose sources are discovered from a root, so a new feature doc is swept", () => {
	const root = writeFixtureRoot(test, {
		[".agents/skills/verify/SKILL.md"]: "# Verify\n",
		[".agents/skills/verify/features/update.md"]: "# Update\n",
		[".agents/skills/verify/features/notes.txt"]: "not prose\n",
		["docs/docs/index.html"]: "<p>index</p>\n",
		["docs/docs/packages/pstack.html"]: "<p>pstack</p>\n",
	});
	assert.deepEqual(discoverProseSources({ root }), [
		".agents/skills/verify/SKILL.md",
		".agents/skills/verify/features/update.md",
		"docs/docs/index.html",
		"docs/docs/packages/pstack.html",
	]);

	writeFileSync(join(root, ".agents/skills/verify/features/newly-added.md"), "# Newly added\n");
	writeFileSync(join(root, "docs/docs/packages/newly-added.html"), "<p>newly added</p>\n");
	assert.deepEqual(discoverProseSources({ root }), [
		".agents/skills/verify/SKILL.md",
		".agents/skills/verify/features/newly-added.md",
		".agents/skills/verify/features/update.md",
		"docs/docs/index.html",
		"docs/docs/packages/newly-added.html",
		"docs/docs/packages/pstack.html",
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

test("NO_SURFACE is inert, so the prose rules are what these tests measure", () => {
	assert.deepEqual(auditCoverage({ surface: NO_SURFACE, coverage: [], features: new Map(), readme: "", prose: new Map() }), []);
});
