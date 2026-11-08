import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PACKAGES, resolveSelection } from "../bin/lazypi.mjs";

const delta = "openspec/changes/2026-11-07-strict-minimal-pstack-catalog";
const section = (text, name) => text.split(`### Requirement: ${name}\n`)[1]?.split(/\n### Requirement:|\n## (?:ADDED|MODIFIED|REMOVED) Requirements/)[0].trim();

test("selection exposes five required registrations and one optional research package", () => {
	assert.deepEqual([...resolveSelection({})], ["pstack", "subagents", "sandbox", "verdict", "pi-ask-user"]);
	assert.deepEqual([...resolveSelection({ only: ["optional"] })], ["web-access"]);
	assert.deepEqual(PACKAGES.map(p => p.source), ["git:github.com/tommy-ca/pstack", "npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access"]);
});

test("new coherent delta carries complete modified and added installer requirements", () => {
	const active = readFileSync("openspec/specs/lazypi/installer/spec.md", "utf8");
	const text = readFileSync(`${delta}/specs/lazypi/installer/spec.md`, "utf8");
	const [modified, added] = text.split("## ADDED Requirements");
	for (const name of ["Catalog Model", "Commands", "Self-Deriving CI", "Catalog documentation", "Reconciled catalog contract", "Permission gate catalog entry"]) {
		assert.ok(section(active, name), name);
		assert.equal(section(modified, name), section(active, name), name);
		assert.equal(section(added, name), undefined, `${name} remains MODIFIED`);
	}
	for (const [name, scenarios] of [
		["Registration source identities", ["Canonical identity and fresh argument", "Required and optional support sources", "Existing canonical registration"]],
		["Catalog retirement", ["Retired curation and selector rejection", "Unmanaged state and removal passthrough"]],
		["Registration and retirement documentation", ["Catalog projections", "Honest limits and retirement"]],
	]) {
		const requirement = section(active, name);
		assert.ok(requirement, name);
		assert.equal(section(added, name), requirement, name);
		assert.equal(section(modified, name), undefined, `${name} is ADDED`);
		assert.deepEqual([...requirement.matchAll(/^#### Scenario: (.+)$/gm)].map(match => match[1]), scenarios, name);
	}
});

test("new delta reconciles control-plane promises without rewriting historical deltas", () => {
	const active = readFileSync("openspec/specs/harness/control-plane/spec.md", "utf8");
	const modified = readFileSync(`${delta}/specs/harness/control-plane/spec.md`, "utf8");
	for(const name of ["Layer Separation", "Ask Gate", "Control Plane Catalog", "Context Hygiene", "Security Posture"]) assert.equal(section(modified,name),section(active,name),name);
	for(const name of ["Side Thread Isolation", "Skill Visibility", "Skill Mention", "Skill Parameters"]) {
		assert.equal(section(active,name),undefined,name);
		assert.ok(modified.split("## REMOVED Requirements")[1].includes(`### Requirement: ${name}\n`),name);
	}
});

test("help states registration limits and current optional selection", () => {
	const r=spawnSync(process.execPath,[resolve("bin/lazypi.mjs"),"--help"],{encoding:"utf8"});
	assert.equal(r.status,0); assert.equal(r.stderr,"");
	assert.match(r.stdout,/optional\s+web-access only/);
	assert.match(r.stdout,/Unpublished registration candidate/);
	assert.match(r.stdout,/retired ids no longer resolve catalog\/legacy sources/);
	assert.doesNotMatch(r.stdout,/--only subagents,fff|skill visibility, goal/);
});
