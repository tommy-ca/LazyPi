import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PACKAGES } from "../bin/lazypi.mjs";

const README = readFileSync("README.md", "utf8");
const OVERVIEW = readFileSync("docs/docs/index.html", "utf8");
const SIDEBAR = readFileSync("docs/_includes/sidebar.html", "utf8");
const PHILOSOPHY_PATH = "docs/docs/philosophy.html";

function docsSlug(id) {
	return id === "pi-ask-user" ? "ask-user" : id;
}

function catalogTableRows(readme) {
	const section = readme.split("## Catalog")[1];
	assert.ok(section, "README has a Catalog section");
	const body = section.split(/^## /m)[0];
	const rows = [];
	for (const line of body.split(/\r?\n/)) {
		const match = line.match(/^\| `?([a-z0-9-]+)`? \| (core|optional) \| (.+) \|$/);
		if (!match) continue;
		if (match[1] === "id") continue;
		rows.push({ id: match[1], category: match[2], rationale: match[3].trim() });
	}
	return rows;
}

function sidebarPackageHrefs(sidebar) {
	const hrefs = [];
	for (const match of sidebar.matchAll(/href="(\/docs\/packages\/[^"]+\.html)"/g)) {
		const href = match[1];
		if (href.endsWith("/packages/index.html")) continue;
		hrefs.push(href);
	}
	return hrefs;
}

test("catalog table parsing accepts LF and CRLF line endings", () => {
	const readme = "## Catalog\n| `fff` | core | Search |\n| `memory` | optional | Remember decisions |\n\n## Commands\n";
	const expected = [
		{ id: "fff", category: "core", rationale: "Search" },
		{ id: "memory", category: "optional", rationale: "Remember decisions" },
	];
	assert.deepEqual(catalogTableRows(readme), expected);
	assert.deepEqual(catalogTableRows(readme.replace(/\n/g, "\r\n")), expected);
});

test("README lists PACKAGES ids in order with category and rationale", () => {
	const rows = catalogTableRows(README);
	assert.deepEqual(
		rows.map((row) => row.id),
		PACKAGES.map((pkg) => pkg.id),
	);
	for (const [i, pkg] of PACKAGES.entries()) {
		assert.equal(rows[i].category, pkg.category, pkg.id);
		assert.ok(rows[i].rationale.length > 0, pkg.id);
	}
});

test("documented install counts match the catalog", () => {
	const core = PACKAGES.filter((pkg) => pkg.category === "core").length;
	const optional = PACKAGES.filter((pkg) => pkg.category === "optional").length;
	const installation = readFileSync("docs/docs/installation.html", "utf8");
	const philosophy = readFileSync(PHILOSOPHY_PATH, "utf8");
	assert.match(README, new RegExp(`--yes.*${core}`));
	assert.equal([...README.matchAll(new RegExp(`Install everything installs all ${PACKAGES.length}\\.`, "g"))].length, 2);
	assert.match(README, new RegExp(`${optional}-package optional tier`));
	assert.match(README, new RegExp(`Install everything is ${PACKAGES.length}\\.`));
	assert.match(installation, new RegExp(`full ${PACKAGES.length}-package catalog`));
	assert.match(philosophy, new RegExp(`keeps ${optional} optional`));
	assert.match(philosophy, new RegExp(`why ${optional} stay optional`));
	const landing = readFileSync("docs/index.html", "utf8");
	const faq = readFileSync("docs/faq.html", "utf8");
	const packages = readFileSync("docs/docs/packages/index.html", "utf8");
	assert.match(landing, new RegExp(`<div class="stat-num">${PACKAGES.length}</div>`));
	assert.match(landing, new RegExp(`TTY Install everything is ${PACKAGES.length}\\.`));
	assert.match(faq, new RegExp(`full ${PACKAGES.length}-package catalog`));
	assert.match(faq, new RegExp(`${optional}-package optional tier`));
	assert.match(OVERVIEW, new RegExp(`full ${PACKAGES.length}-package catalog`));
	assert.match(OVERVIEW, new RegExp(`why ${optional} are optional`));
	assert.match(OVERVIEW, /permission gate/);
	assert.doesNotMatch(README, /per tool call; fail-closed/);
	const firstSteps = readFileSync("docs/docs/first-steps.html", "utf8");
	assert.match(firstSteps, new RegExp(`Install everything</strong> is ${PACKAGES.length} packages`));
	assert.equal([...landing.matchAll(/class="catalog-card"/g)].length, PACKAGES.length);
	assert.match(packages, new RegExp(`The ${PACKAGES.length} catalog packages: ${core} core plus ${optional} optional`));
	assert.match(packages, /Side questions without adding them to the main conversation/);
	assert.match(packages, /Reviews changed code for clarity and consistency<\/div>/);
	assert.match(landing, /github\.com\/HenryQW\/pi-harness\/tree\/main\/extensions\/pi-memory/);
	assert.match(landing, /github\.com\/juicesharp\/rpiv-mono/);
});

test("philosophy.html exists and names the membership bar", () => {
	assert.equal(existsSync(PHILOSOPHY_PATH), true);
	const page = readFileSync(PHILOSOPHY_PATH, "utf8");
	assert.match(page, /control plane/i);
	assert.match(page, /discipline/i);
	assert.match(page, /meal-prep/i);
	assert.match(page, /chrome/i);
	assert.match(page, /Dropped/i);
	assert.match(page, /pi install/);
});

test("overview has no Optional extras heading and points at philosophy", () => {
	assert.equal(/<h2>\s*Optional extras\s*<\/h2>/i.test(OVERVIEW), false);
	assert.match(OVERVIEW, /philosophy\.html/);
});

test("sidebar package hrefs match PACKAGES order with ask-user slug", () => {
	const expected = PACKAGES.map((pkg) => `/docs/packages/${docsSlug(pkg.id)}.html`);
	assert.deepEqual(sidebarPackageHrefs(SIDEBAR), expected);
});

test("installation.html and landing mock do not call Install everything recommended", () => {
	const installation = readFileSync("docs/docs/installation.html", "utf8");
	const landing = readFileSync("docs/index.html", "utf8");
	assert.equal(installation.includes("(recommended)"), false);
	assert.equal(landing.includes("(recommended)"), false);
	assert.match(installation, /Install everything/);
	assert.match(landing, /Install everything/);
});
