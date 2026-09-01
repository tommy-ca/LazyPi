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
	for (const line of body.split("\n")) {
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

test("README states --yes is 12 and TTY Install everything is 17", () => {
	assert.match(README, /`--yes`.*12/);
	assert.match(README, /17/);
	assert.match(README, /Install (all|everything)/i);
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
