import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PACKAGES, resolveSelection } from "../bin/lazypi.mjs";

const delta = "openspec/changes/archive/2026-11-10-essentials-web-default";
const retirementDelta = "openspec/changes/2026-11-07-strict-minimal-pstack-catalog";
const section = (text, name) => text.split(`### Requirement: ${name}\n`)[1]?.split(/\n### Requirement:|\n## (?:ADDED|MODIFIED|REMOVED) Requirements/)[0].trim();

test("selection exposes six default core registrations and an empty optional category", () => {
	const ids = ["pstack", "subagents", "sandbox", "verdict", "pi-ask-user", "web-access"];
	assert.deepEqual([...resolveSelection({})], ids);
	assert.deepEqual(PACKAGES.map(p => [p.id, p.category]), ids.map(id => [id, "core"]));
	assert.deepEqual([...resolveSelection({ only: ["optional"] })], []);
	assert.deepEqual([...resolveSelection({ except: ["optional"] })], ids);
	assert.deepEqual(PACKAGES.map(p => p.source), ["git:github.com/tommy-ca/pstack", "npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access"]);
});

test("current delta carries complete modified installer requirements without rewriting historical deltas", () => {
	const active = readFileSync("openspec/specs/lazypi/installer/spec.md", "utf8");
	const text = readFileSync(`${delta}/specs/lazypi/installer/spec.md`, "utf8");
	assert.ok(text.startsWith("## MODIFIED Requirements\n"));
	for (const name of ["Catalog Model", "Self-Deriving CI", "Catalog documentation", "Reconciled catalog contract", "Registration source identities", "Registration and retirement documentation"]) {
		assert.ok(section(active, name), name);
		assert.equal(section(text, name), section(active, name), name);
	}
	const historical = readFileSync(`${retirementDelta}/specs/lazypi/installer/spec.md`, "utf8");
	for (const name of ["Commands", "Permission gate catalog entry", "Catalog retirement"]) {
		assert.equal(section(historical, name), section(active, name), name);
	}
	assert.match(historical, /first five SHALL be `core`/);
});

test("current control-plane delta changes curation without changing native-proof authority", () => {
	const active = readFileSync("openspec/specs/harness/control-plane/spec.md", "utf8");
	const modified = readFileSync(`${delta}/specs/harness/control-plane/spec.md`, "utf8");
	assert.equal(section(modified, "Control Plane Catalog"), section(active, "Control Plane Catalog"));
	const historical = readFileSync(`${retirementDelta}/specs/harness/control-plane/spec.md`, "utf8");
	for (const name of ["Layer Separation", "Ask Gate", "Context Hygiene", "Security Posture"]) assert.equal(section(historical, name), section(active, name), name);
	for (const name of ["Side Thread Isolation", "Skill Visibility", "Skill Mention", "Skill Parameters"]) {
		assert.equal(section(active, name), undefined, name);
		assert.ok(historical.split("## REMOVED Requirements")[1].includes(`### Requirement: ${name}\n`), name);
	}
});

test("help states all six core entries, empty optional selection, and registration limits", () => {
	const r = spawnSync(process.execPath, [resolve("bin/lazypi.mjs"), "--help"], { encoding: "utf8" });
	assert.equal(r.status, 0); assert.equal(r.stderr, "");
	assert.match(r.stdout, /core\s+pstack, subagents, sandbox, verdict, pi-ask-user, web-access \(6\)/);
	assert.match(r.stdout, /optional\s+empty \(selector retained for compatibility\)/);
	assert.match(r.stdout, /--only optional\s+# empty selection; no setup or changes/);
	assert.match(r.stdout, /Unpublished registration candidate/);
	assert.match(r.stdout, /retired ids no longer resolve catalog\/legacy sources/);
	assert.doesNotMatch(r.stdout, /--only subagents,fff|skill visibility, goal/);
});
