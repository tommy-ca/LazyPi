import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PACKAGES } from "../bin/lazypi.mjs";
const read = path => readFileSync(path,"utf8");
const slug = id => id === "pi-ask-user" ? "ask-user" : id;
const retired = ["pi-skillful", "mention-skill", "goal", "btw", "context-usage", "simplify", "fff", "dynamic-workflows", "ponytail", "lsp", "interactive-shell", "autoresearch", "todos", "memory"];

test("README, sidebar, landing, and package index agree with catalog order and tiers", () => {
	const rows=[...read("README.md").split("## Catalog")[1].split(/^## /m)[0].matchAll(/^\| ([a-z-]+) \| (core|optional) \| (.+) \|$/gm)];
	assert.deepEqual(rows.map(r=>[r[1],r[2]]),PACKAGES.map(p=>[p.id,p.category]));
	for(const row of rows) assert.ok(row[3].length>0);
	const expected=PACKAGES.map(p=>`/docs/packages/${slug(p.id)}.html`);
	const sidebar=[...read("docs/_includes/sidebar.html").matchAll(/href="(\/docs\/packages\/[^\"]+\.html)"/g)].map(m=>m[1]);
	assert.deepEqual(sidebar,expected);
	for(const [file,klass,tag] of [["docs/index.html","catalog-card","catalog-tag"],["docs/docs/packages/index.html","pkg-card","pkg-tag"]]) {
		const cards=[...read(file).matchAll(new RegExp(`<a class="${klass}" href="([^"]+)"><span class="${tag} (core|optional)">`,"g"))];
		assert.deepEqual(cards.map(c=>[c[1],c[2]]),PACKAGES.map((p,i)=>[expected[i],p.category]));
	}
});

test("active selection docs describe default Web Access and empty optional compatibility", () => {
	for (const file of ["README.md", "docs/index.html", "docs/faq.html", "docs/docs/index.html", "docs/docs/installation.html", "docs/docs/first-steps.html", "docs/docs/philosophy.html", "docs/docs/packages/web-access.html"]) {
		const text = read(file);
		assert.match(text, /Web Access/, file);
		assert.match(text, /optional[^.]*empty|empty optional|no optional packages remain/i, file);
		assert.doesNotMatch(text, /five required registrations|5 required|5 core|sole optional|Web Access[^.]*optional/i, file);
	}
});

test("retired pages are historical and no active page links to them as curated navigation", () => {
	const active=["docs/index.html","docs/faq.html","docs/docs/index.html","docs/docs/first-steps.html","docs/docs/installation.html","docs/_includes/sidebar.html","docs/docs/packages/index.html",...PACKAGES.map(p=>`docs/docs/packages/${slug(p.id)}.html`)];
	for(const id of retired) {
		const page=read(`docs/docs/packages/${id}.html`);
		assert.match(page,/Historical, unmanaged/);
		assert.doesNotMatch(page,/--only |migrate automatically|stays fully managed/);
		for(const file of active) assert.ok(!read(file).includes(`href="/docs/packages/${id}.html"`),`${file}: ${id}`);
	}
});

test("active documentation disclaims readiness and preserves retirement and security limits", () => {
	for(const file of ["README.md","docs/index.html","docs/docs/index.html","docs/docs/philosophy.html","docs/docs/installation.html","docs/docs/first-steps.html","docs/docs/packages/pstack.html","docs/docs/packages/sandbox.html"]) {
		const text=read(file);
		assert.match(text,/unpublished/i,file); assert.match(text,/registration/i,file);
		assert.match(text,/unverified|does not prove|not certify/i,file);
		assert.match(text,/container or VM/,file);
		assert.doesNotMatch(text,/full 18-package|12-package optional|everything configured|skills ready/i,file);
	}
	const policy=read("docs/docs/philosophy.html");
	for(const id of retired) assert.ok(policy.includes(id),id);
	assert.match(policy,/declares a source conflict|Declared upstream source conflict/);
	assert.match(policy,/not evidence of a loaded tool collision/);
	assert.match(policy,/real operator sessions/);
	assert.match(read("docs/docs/removing.html"),/Unknown targets still pass unchanged to Pi/);
	assert.match(read("docs/docs/updating.html"),/including installed packages outside the catalog/);
});
