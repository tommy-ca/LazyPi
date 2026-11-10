// Catalog and selection: the curated package data, `--only`/`--except`
// resolution, source matching, and the single installed predicate.
//
// This module holds no filesystem, settings, spawning, or prompt state. Its
// only output is a selector diagnostic, which belongs to argument validation
// rather than to a command.
import { stdout } from "node:process";

// All current entries are core. Keep the empty optional category valid for
// existing --only / --except selectors.
export const CATEGORIES = ["core", "optional"];

export const PACKAGES = [
	{
		id: "pstack", category: "core", source: "git:github.com/tommy-ca/pstack",
		installSource: "git:github.com/tommy-ca/pstack@f1571b8431034dcd195f4ea055ccf1c84fc14fc8",
		description: "Canonical PStack registration reference",
		hint: "Canonical checkout registration only; native role binding and loading remain unverified.",
	},
	{ id: "subagents", category: "core", source: "npm:pi-subagents", description: "Sub-agent execution", hint: "Run isolated sub-agents for parallel work." },
	{ id: "sandbox", category: "core", source: "npm:pi-better-sandbox", description: "Sandbox support", hint: "Disabled until explicitly configured; registration is not containment." },
	{ id: "verdict", category: "core", source: "npm:pi-verdict", description: "Permission gate", hint: "Permission gate with fail-closed classifier errors; configured exemptions and manual shell escapes are not classified." },
	{ id: "pi-ask-user", category: "core", source: "npm:pi-ask-user", description: "Ask-user prompts", hint: "Interactive user questions, single or 2-4 question batches; not hard approval." },
	{ id: "web-access", category: "core", source: "npm:pi-web-access", description: "Web search and page fetch", hint: "Built-in web search and URL fetching." },
];

// Selector diagnostics are the one message this module prints. Colour follows
// the same rule as the command layer, where stdout being a TTY decides.
const red = (text) => (stdout.isTTY ? `\x1b[31m${text}\x1b[0m` : String(text));

export function parseList(value) {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function validateSelectors(list, label) {
	const ids = new Set(PACKAGES.map((p) => p.id));
	const bad = list.filter((name) => !CATEGORIES.includes(name) && !ids.has(name));
	if (bad.length > 0) {
		console.error(red(`Unknown ${label}: ${bad.join(", ")}`));
		console.error(`Valid categories: ${CATEGORIES.join(", ")}`);
		console.error(`Valid package ids: ${[...ids].join(", ")}`);
		return false;
	}
	return true;
}

function matchesSelector(pkg, selectors) {
	return selectors.some((name) => name === pkg.category || name === pkg.id);
}

export function resolveSelection(flags) {
	if (flags.only) {
		if (!validateSelectors(flags.only, "--only")) return null;
		return new Set(PACKAGES.filter((p) => matchesSelector(p, flags.only)).map((p) => p.id));
	}
	if (flags.except) {
		if (!validateSelectors(flags.except, "--except")) return null;
		return new Set(PACKAGES.filter((p) => !matchesSelector(p, flags.except)).map((p) => p.id));
	}
	return new Set(PACKAGES.filter((p) => p.category === "core").map((p) => p.id));
}

// An installed source matches a catalog source when equal or when it is the
// same source with a version/pin suffix (npm:pkg vs npm:pkg@x.y.z,
// git:... vs git:...@sha).
export function sourcesMatch(catalogSource, installedSource) {
	return catalogSource === installedSource || installedSource.startsWith(`${catalogSource}@`);
}

// The installed predicate: an entry is installed when any installed source
// matches its identity source. Nothing else counts as present.
export function isPackageInstalled(pkg, installedSources) {
	return [...installedSources].some((source) => sourcesMatch(pkg.source, source));
}
