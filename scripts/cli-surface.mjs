#!/usr/bin/env node
// Offline audit of the CLI surface against the verification feature map.
//
// The parser in bin/lazypi.mjs is the only authority for which commands and
// flags exist. A surface item without a feature-map entry is invisible to the
// verification skill, and a feature-map entry for an item the parser does not
// accept is a claim about a CLI that does not exist. Both directions fail.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const SURFACE_SOURCE = "bin/lazypi.mjs";
export const FEATURES_DIR = ".agents/skills/verify/features";
export const FEATURES_README = "README.md";
export const SKILL_DOC = ".agents/skills/verify/SKILL.md";
export const DOCS_DIR = "docs/docs";

// The prose the CLI claims live in, discovered instead of listed: a new feature
// doc or docs page is swept without editing this file, which is how three pages
// kept naming bare `pi update` for months. `root` is injectable so a test can
// point discovery at a fixture tree.
//
// openspec/ is deliberately outside the sweep. The live spec still says
// "broad pi update" at openspec/specs/lazypi/installer/spec.md:554, and the
// 2026-11-10-update-scope delta rewrites that requirement when it archives; a
// scanner pointed at it would fail every run until an archive that is not this
// change's to perform.
export function discoverProseSources({ root = process.cwd() } = {}) {
	const sources = [SKILL_DOC];
	const featuresDir = join(root, FEATURES_DIR);
	if (existsSync(featuresDir)) {
		for (const name of readdirSync(featuresDir).sort()) {
			if (name.endsWith(".md")) sources.push(`${FEATURES_DIR}/${name}`);
		}
	}
	collectHtml(join(root, DOCS_DIR), DOCS_DIR, sources);
	return sources;
}

function collectHtml(directory, relative, out) {
	if (!existsSync(directory)) return;
	for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		const path = `${relative}/${entry.name}`;
		if (entry.isDirectory()) collectHtml(join(directory, entry.name), path, out);
		else if (entry.name.endsWith(".html")) out.push(path);
	}
}

// One entry per accepted surface item. `mention` is the token the doc has to
// carry, so a doc that names the command but never its flag does not count.
export const COVERAGE = [
	{ ids: ["install"], doc: "install-orchestration.md", mention: "install" },
	{ ids: ["status"], doc: "status.md", mention: "status" },
	{ ids: ["update"], doc: "update.md", mention: "update" },
	{ ids: ["doctor"], doc: "doctor.md", mention: "doctor" },
	{ ids: ["remove"], doc: "remove.md", mention: "remove" },
	{ ids: ["-h", "--help"], doc: "help.md", mention: "--help" },
	{ ids: ["-V", "--version"], doc: "help.md", mention: "--version" },
	{ ids: ["-l", "--local"], doc: "local-scope.md", mention: "--local" },
	{ ids: ["-y", "--yes"], doc: "install-orchestration.md", mention: "--yes" },
	{ ids: ["--only"], doc: "catalog.md", mention: "--only" },
	{ ids: ["--except"], doc: "catalog.md", mention: "--except" },
];

const COMMAND_SET_RE = /const KNOWN_COMMANDS = new Set\(\[([^\]]*)\]\)/;
const PARSER_RE = /^function parseArgs\(args\) \{\r?\n([\s\S]*?)^\}/m;
const COMPARED_FLAG_RE = /arg (?:===|\.startsWith\() "(-{1,2}[A-Za-z][\w-]*)=?"/g;
const FLAG_SHAPED_LITERAL_RE = /"(-{1,2}[A-Za-z][\w-]*)=?"/g;

export function parseCliSurface(source) {
	const commandSet = source.match(COMMAND_SET_RE);
	if (!commandSet) throw new Error(`Could not find KNOWN_COMMANDS in ${SURFACE_SOURCE}`);
	const commands = [...commandSet[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

	const parser = source.match(PARSER_RE);
	if (!parser) throw new Error(`Could not find parseArgs in ${SURFACE_SOURCE}`);
	const body = parser[1];
	const flags = new Set();
	for (const match of body.matchAll(COMPARED_FLAG_RE)) flags.add(match[1]);
	// Fail closed on a flag this extractor cannot attribute to a comparison. A
	// parser that grew a differently shaped flag would otherwise pass unaudited.
	const unrecognized = [...new Set(
		[...body.matchAll(FLAG_SHAPED_LITERAL_RE)].map((match) => match[1]).filter((flag) => !flags.has(flag)),
	)];

	return { commands, flags: [...flags], unrecognized };
}

export function auditCoverage({ surface, coverage = COVERAGE, features, readme, prose = new Map() }) {
	const issues = [];
	const covered = new Set(coverage.flatMap((entry) => entry.ids));

	for (const command of surface.commands) if (!covered.has(command)) issues.push(`uncovered command: ${command}`);
	for (const flag of surface.flags) if (!covered.has(flag)) issues.push(`uncovered flag: ${flag}`);
	for (const flag of surface.unrecognized) issues.push(`unrecognized flag literal in parseArgs: ${flag}`);

	for (const entry of coverage) {
		for (const id of entry.ids) {
			if (!surface.commands.includes(id) && !surface.flags.includes(id)) {
				issues.push(`coverage entry names something the parser does not accept: ${id}`);
			}
		}
		const text = features.get(entry.doc);
		if (text === undefined) {
			issues.push(`missing feature doc: ${entry.doc}`);
			continue;
		}
		if (!readme.includes(`(${entry.doc})`)) issues.push(`feature map README does not list ${entry.doc}`);
		if (!text.includes(entry.mention)) issues.push(`${entry.doc} does not document ${entry.mention}`);
	}

	return [...issues, ...auditProse(prose)];
}

// A phrase table is only for phrasings that are wrong however the sentence is
// rewritten, and every entry carries its reason, so a reviewer can reject an
// entry without re-deriving the CLI. Claims that survive rewording are checked
// below, on the line rather than on the wording.
export const FORBIDDEN_PHRASES = [
	["including with `--local`", "only install, status, doctor, and remove accept --local"],
	["all accept it", "update refuses --local with exit 2"],
	["`update --local` spawns", "update --local is refused before any spawn"],
	["`--local` argv in `test/pstack-retirement.test.mjs`", "no test pins removal's local argv"],
	["neither needed nor asked for", "Windows resolution still asks where"],
	["must fail before it spawns anything", "--yes lets a missing pi spawn npm install -g"],
];

// A pinned surface has to be described the way the suite pins it, on the line
// that describes it. File-wide co-presence proves nothing: remove.md and
// doctor.md carry "exit 2" text about a missing target and a corrupt settings
// file, so a file-wide check would let any sentence about `update --local` pass
// off that unrelated text as its own outcome. A line that only names the surface
// is a reference or a recipe step, not a claim, and is not asked to restate it.
export const PINNED_SURFACES = [["update --local", "exit 2"]];
const EXIT_CODE = /\bexits?\s+(\d+)\b/g;

// `update` has to ask Pi for `--extensions`, because bare `pi update` upgrades
// the harness itself. Wording cannot carry that: "broad `pi update`",
// "<code>pi update</code>" and "runs pi update" are one stale claim, and the
// first two were separate phrase entries that a capital B or a reflowed
// paragraph defeated. So this is a claim check on the line: naming bare
// `pi update` fails unless the same line names `--extensions`. The one exemption
// is a sentence that denies the claim, which keeps true prose such as
// updating.html's "Bare pi update upgrades Pi itself, so LazyPi never asks for
// it." passing without excusing a stale sentence that only shares the line with
// a "not" — that is how philosophy.html and removing.html stayed stale.
const BARE_PI_UPDATE = /\bpi update\b/;
const EXTENSIONS = /--extensions/;
const SENTENCE = /(?<=[.!?])\s+/;
const PI_UPDATE_DISCLAIMER = /\b(?:never|not|no longer|neither)\b/i;

export function auditProse(prose) {
	const issues = [];
	for (const [doc, text] of prose) {
		// An exact wrong phrasing is wrong wherever it sits, including across a
		// reflowed line, so this scan stays file-wide.
		for (const [phrase, why] of FORBIDDEN_PHRASES) {
			if (text.includes(phrase)) issues.push(`${doc} repeats a stale claim: "${phrase}" — ${why}`);
		}
		for (const [index, line] of text.split(/\r?\n/).entries()) {
			const at = `${doc}:${index + 1}`;
			const unclaimed = line.split(SENTENCE)
				.filter((sentence) => BARE_PI_UPDATE.test(sentence) && !PI_UPDATE_DISCLAIMER.test(sentence));
			if (unclaimed.length > 0 && !EXTENSIONS.test(line)) {
				issues.push(`${at} names bare \`pi update\` without \`--extensions\`; update asks Pi for \`pi update --extensions\``);
			}
			for (const [surface, outcome] of PINNED_SURFACES) {
				if (!line.includes(surface)) continue;
				const stated = [...line.matchAll(EXIT_CODE)].map((match) => `exit ${match[1]}`);
				if (stated.length > 0 && !stated.includes(outcome)) {
					issues.push(`${at} names ${surface} with ${stated.join("/")} — the suite pins "${outcome}"`);
				}
			}
		}
	}
	return issues;
}

export function auditRepository({ root = process.cwd(), sources = discoverProseSources({ root }) } = {}) {
	const surface = parseCliSurface(readFileSync(resolve(root, SURFACE_SOURCE), "utf8"));
	const featuresDir = join(root, FEATURES_DIR);
	const features = new Map();
	for (const entry of COVERAGE) {
		const path = join(featuresDir, entry.doc);
		if (existsSync(path)) features.set(entry.doc, readFileSync(path, "utf8"));
	}
	const readmePath = join(featuresDir, FEATURES_README);
	// Every discovered source is prose-covered, not only the ones COVERAGE names.
	const prose = new Map(sources.map((path) => [path, readFileSync(resolve(root, path), "utf8")]));
	return auditCoverage({
		surface,
		readme: existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "",
		features,
		prose,
	});
}

function main() {
	const issues = auditRepository();
	if (issues.length === 0) {
		console.log("CLI surface coverage is complete.");
		return;
	}
	throw new Error(`CLI surface coverage is incomplete:\n- ${issues.join("\n- ")}`);
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;

if (entrypoint === import.meta.url) main();
