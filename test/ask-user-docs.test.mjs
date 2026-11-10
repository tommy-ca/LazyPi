import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PACKAGES } from "../bin/lazypi.mjs";

const page = readFileSync("docs/docs/packages/ask-user.html", "utf8");
const paragraph = needle => page.split("\n").find(line => line.includes(needle)) ?? "";

test("catalog hint names both question shapes and keeps the non-approval clause", () => {
	const hint = PACKAGES.find(pkg => pkg.id === "pi-ask-user").hint;
	assert.match(hint, /2-4/);
	assert.match(hint, /not hard approval/);
});

test("page describes a batch of independent questions with a review page", () => {
	const text = paragraph("batch of 2-4");
	assert.match(text, /review page before submitting/);
	assert.ok(page.includes("belongs in a later call"), "dependent questions are deferred to a later call");
});

test("page names the settings file and its precedence", () => {
	assert.ok(page.includes("~/.pi/agent/ask-user.json"), "settings path is documented");
	assert.ok(page.includes("PI_CODING_AGENT_DIR"), "agent-dir override is documented");
	assert.ok(
		page.includes("override environment variables, and environment variables override the settings file"),
		"precedence is documented",
	);
	assert.ok(page.includes("not valid JSON fails the call with its path in the error"), "invalid JSON is documented");
});

test("page discloses what emitFullEvents shares, when, and its default", () => {
	const text = paragraph("emitFullEvents");
	assert.match(text, /answers and prompt context/);
	assert.match(text, /offered options on cancellation/);
	assert.match(text, /off by default/);
});

test("page keeps the non-approval boundary statement", () => {
	assert.ok(
		page.includes("Registration does not establish native loading, unattended denial, child authorization, or readiness."),
		"registration limits are retained",
	);
});
