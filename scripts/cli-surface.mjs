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
// Prose outside the feature map that repeats the same claims: the skill itself
// and the operator pages that named LazyPi's update for months.
export const PROSE_SOURCES = [".agents/skills/verify/SKILL.md", "docs/docs/index.html", "docs/docs/philosophy.html", "docs/docs/removing.html"];

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

// A mention token only proves a word appears, which is how a doc kept saying
// `update --local` spawns a Pi command while `parseArgs` exited 2 on the flag.
// Every entry is a phrase, so prose that merely shares a word still passes.
export const FORBIDDEN_PHRASES = [
	["including with `--local`", "only install, status, doctor, and remove accept --local"],
	["all accept it", "update refuses --local with exit 2"],
	["`update --local` spawns", "update --local is refused before any spawn"],
	["`--local` argv in `test/pstack-retirement.test.mjs`", "no test pins removal's local argv"],
	["neither needed nor asked for", "Windows resolution still asks where"],
	["must fail before it spawns anything", "--yes lets a missing pi spawn npm install -g"],
	["broad `pi update`", "update asks Pi for pi update --extensions"],
	["<code>pi update</code>", "update asks Pi for pi update --extensions"],
];

// The manual-versus-pinned split goes stale in both directions: a surface the
// suite pins has to be described the way its pin describes it.
export const PINNED_SURFACES = [["update --local", "exit 2"]];

export function auditProse(prose) {
	const issues = [];
	for (const [doc, text] of prose) {
		for (const [phrase, why] of FORBIDDEN_PHRASES) if (text.includes(phrase)) issues.push(`${doc} repeats a stale claim: "${phrase}" — ${why}`);
		for (const [surface, outcome] of PINNED_SURFACES) {
			if (text.includes(surface) && !text.includes(outcome)) issues.push(`${doc} names ${surface} without its pinned outcome "${outcome}"`);
		}
	}
	return issues;
}

export function auditRepository({ root = process.cwd() } = {}) {
	const surface = parseCliSurface(readFileSync(resolve(root, SURFACE_SOURCE), "utf8"));
	const featuresDir = join(root, FEATURES_DIR);
	const features = new Map();
	for (const entry of COVERAGE) {
		const path = join(featuresDir, entry.doc);
		if (existsSync(path)) features.set(entry.doc, readFileSync(path, "utf8"));
	}
	const readmePath = join(featuresDir, FEATURES_README);
	// Every feature doc is prose-covered, not only the ones COVERAGE names.
	const prose = new Map(PROSE_SOURCES.map((path) => [path, readFileSync(resolve(root, path), "utf8")]));
	for (const name of existsSync(featuresDir) ? readdirSync(featuresDir) : []) {
		if (name.endsWith(".md")) prose.set(`${FEATURES_DIR}/${name}`, readFileSync(join(featuresDir, name), "utf8"));
	}
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
