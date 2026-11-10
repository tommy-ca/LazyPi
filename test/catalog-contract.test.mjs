import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PACKAGES, resolveSelection } from "../bin/lazypi.mjs";
import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const liveSpec = "openspec/specs/lazypi/installer/spec.md";
const retirementDelta = "openspec/changes/archive/2026-11-07-strict-minimal-pstack-catalog";
const changesDir = "openspec/changes";
const section = (text, name) =>
	text
		.split(`### Requirement: ${name}\n`)[1]
		?.split(/\n### Requirement:|\n## (?:ADDED|MODIFIED|REMOVED) Requirements/)[0]
		.trim();

const activeChangeNames = () =>
	readdirSync(changesDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && entry.name !== "archive")
		.map((entry) => entry.name)
		.sort();

test("selection exposes six default core registrations and an empty optional category", () => {
	const ids = ["pstack", "subagents", "sandbox", "verdict", "pi-ask-user", "web-access"];
	assert.deepEqual([...resolveSelection({})], ids);
	assert.deepEqual(PACKAGES.map((p) => [p.id, p.category]), ids.map((id) => [id, "core"]));
	assert.deepEqual([...resolveSelection({ only: ["optional"] })], []);
	assert.deepEqual([...resolveSelection({ except: ["optional"] })], ids);
	assert.deepEqual(PACKAGES.map((p) => p.source), [
		"git:github.com/tommy-ca/pstack",
		"npm:pi-subagents",
		"npm:pi-better-sandbox",
		"npm:pi-verdict",
		"npm:pi-ask-user",
		"npm:pi-web-access",
	]);
});

test("the active installer spec is the catalog authority and agrees with PACKAGES", () => {
	const active = readFileSync(liveSpec, "utf8");
	const model = section(active, "Catalog Model");
	assert.ok(model, "Catalog Model requirement is present in the active spec");
	assert.match(model, new RegExp(`exactly ${PACKAGES.length} entries`));
	for (const pkg of PACKAGES) {
		assert.ok(model.includes(pkg.id), `${pkg.id} is named by the active catalog model`);
	}
	assert.doesNotMatch(
		active,
		/current test association for this category change/,
		"the active spec must not delegate its authority to a change or archived delta",
	);
});

test("no active change delta may claim a catalog that contradicts PACKAGES", () => {
	const failures = [];
	for (const name of activeChangeNames()) {
		const delta = join(changesDir, name, "specs/lazypi/installer/spec.md");
		if (!existsSync(delta)) continue;
		const text = readFileSync(delta, "utf8");
		for (const match of text.matchAll(/exactly (\d+) entries/gi)) {
			const claimed = Number(match[1]);
			if (claimed !== PACKAGES.length) {
				failures.push(`${name} claims exactly ${claimed} entries; the catalog has ${PACKAGES.length}`);
			}
		}
		for (const match of text.matchAll(/core SHALL contain ([^.\n]+)/gi)) {
			for (const raw of match[1].split(/,|\band\b/)) {
				const id = raw.trim().replace(/`/g, "");
				if (!id) continue;
				if (!PACKAGES.some((pkg) => pkg.id === id)) {
					failures.push(`${name} requires core entry "${id}" that PACKAGES does not declare`);
				}
			}
		}
	}
	assert.deepEqual(failures, [], `active deltas contradict the catalog:\n${failures.join("\n")}`);
});

test("historical retirement delta keeps its removed control-plane requirements", () => {
	const active = readFileSync("openspec/specs/harness/control-plane/spec.md", "utf8");
	const historical = readFileSync(`${retirementDelta}/specs/harness/control-plane/spec.md`, "utf8");
	for (const name of ["Layer Separation", "Ask Gate", "Context Hygiene", "Security Posture"]) {
		assert.equal(section(historical, name), section(active, name), name);
	}
	const removed = historical.split("## REMOVED Requirements")[1];
	for (const name of ["Side Thread Isolation", "Skill Visibility", "Skill Mention", "Skill Parameters"]) {
		assert.equal(section(active, name), undefined, name);
		assert.ok(removed.includes(`### Requirement: ${name}\n`), name);
	}
});

test("help states all six core entries, empty optional selection, and registration limits", (t) => {
	const r = createCliSandbox(t).run(["--help"]);
	assert.equal(r.status, 0);
	assert.equal(r.stderr, "");
	assert.match(r.stdout, /core\s+pstack, subagents, sandbox, verdict, pi-ask-user, web-access \(6\)/);
	assert.match(r.stdout, /optional\s+empty \(selector retained for compatibility\)/);
	assert.match(r.stdout, /--only optional\s+# empty selection; no setup or changes/);
	assert.match(r.stdout, /Unpublished registration candidate/);
	assert.match(r.stdout, /retired ids no longer resolve catalog\/legacy sources/);
	assert.doesNotMatch(r.stdout, /--only subagents,fff|skill visibility, goal/);
});
