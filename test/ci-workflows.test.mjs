import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const PACKED_CLI_SMOKE_COMMAND = "node scripts/packed-cli-smoke.mjs";
const OPTIONAL_INSTALL = "node bin/lazypi.mjs --yes --only optional";
const WINDOWS_COMMANDS = [
	"npm test",
	PACKED_CLI_SMOKE_COMMAND,
	"node bin/lazypi.mjs --yes",
	OPTIONAL_INSTALL,
	"node scripts/assert-installed-packages.mjs --check-status",
	"node bin/lazypi.mjs doctor",
];

function assertCommandsInOrder(workflow, commands) {
	// ponytail: current eight-space, single-line run keys only; use a YAML parser for richer workflows.
	assert.doesNotMatch(workflow, /^\s*(?:-\s*)?if:/m, "Conditional workflows need explicit contract coverage");
	assert.doesNotMatch(workflow, /^\s+run:\s*[|>]/m, "Multiline commands need explicit contract coverage");
	const runs = [...workflow.matchAll(/^ {8}run: ([^\r\n]+)$/gm)].map(match => match[1].trim());
	let previous = -1;
	for (const command of commands) {
		const at = runs.indexOf(command);
		assert.ok(at > previous, `Required command missing or out of order: ${command}`);
		previous = at;
	}
}

test("packed CLI smoke script exists", () => {
	assert.equal(existsSync("scripts/packed-cli-smoke.mjs"), true);
});

test("linux CI executes gates and packed CLI checks in order", () => {
	assertCommandsInOrder(readFileSync(".github/workflows/test.yml", "utf8"), [
		"npm test",
		"npm run spec:validate",
		PACKED_CLI_SMOKE_COMMAND,
		"node bin/lazypi.mjs --yes",
		OPTIONAL_INSTALL,
		"node scripts/assert-installed-packages.mjs --check-status",
		"node scripts/e2e-install.mjs",
	]);
});

test("windows CI executes optional installation before the full-catalog assertion", () => {
	assertCommandsInOrder(readFileSync(".github/workflows/windows-smoke.yml", "utf8"), WINDOWS_COMMANDS);
});

test("workflow checks reject commented, conditional, and unsupported required commands", () => {
	const workflow = readFileSync(".github/workflows/windows-smoke.yml", "utf8");
	const step = `        run: ${OPTIONAL_INSTALL}`;
	for (const replacement of [
		`        # run: ${OPTIONAL_INSTALL}`,
		`        if: false\n${step}`,
		`        if: \${{ false }}\n${step}`,
		`        run: |\n          ${OPTIONAL_INSTALL}`,
	]) {
		assert.throws(() => assertCommandsInOrder(workflow.replace(step, replacement), WINDOWS_COMMANDS), replacement);
	}
});

test("workflow checks reject command text in environment or multiline step names", () => {
	const workflow = readFileSync(".github/workflows/windows-smoke.yml", "utf8");
	const step = `        run: ${OPTIONAL_INSTALL}`;
	const mutations = [
		workflow.replace(step, `        env:\n          run: ${OPTIONAL_INSTALL}\n        run: echo skipped`),
		workflow.replace(`      - name: Install optional catalog tier\n${step}`, `      - name: |\n          run: ${OPTIONAL_INSTALL}\n        run: echo skipped`),
	];
	for (const mutated of mutations) {
		assert.throws(() => assertCommandsInOrder(mutated, WINDOWS_COMMANDS));
	}
});

test("workflow checks reject reversed required command order", () => {
	const workflow = readFileSync(".github/workflows/windows-smoke.yml", "utf8");
	const swapped = workflow.replace(OPTIONAL_INSTALL, "__OPTIONAL__")
		.replace("node scripts/assert-installed-packages.mjs --check-status", OPTIONAL_INSTALL)
		.replace("__OPTIONAL__", "node scripts/assert-installed-packages.mjs --check-status");
	assert.throws(() => assertCommandsInOrder(swapped, WINDOWS_COMMANDS));
});
