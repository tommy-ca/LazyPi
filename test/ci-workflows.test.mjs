import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const PACKED_CLI_SMOKE_COMMAND = "node scripts/packed-cli-smoke.mjs";
// The gate for an empty optional selection, asserted on both operating systems
// by the same hermetic proof. A bare `--only optional` run cannot be that gate:
// it prints "Nothing selected" and exits 0 whatever the product does, so the
// step only fails when the command itself breaks.
const EMPTY_OPTIONAL_GATE = "node --test test/ci-workflows.test.mjs";
// Windows runs the whole file, not a title pattern: a renamed test makes a
// pattern select zero tests, and `node --test` reports those as skipped with
// exit 0, so the gate would disappear with nothing to see in the log.
const WINDOWS_OPTIONAL_GATE = "node --test test/ci-workflows.test.mjs";
const WINDOWS_COMMANDS = [
	"npm test",
	PACKED_CLI_SMOKE_COMMAND,
	"node bin/lazypi.mjs --yes",
	WINDOWS_OPTIONAL_GATE,
	"node scripts/assert-installed-packages.mjs --check-status",
	"node bin/lazypi.mjs doctor",
];

function readWorkflow(path) {
	return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

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

function job(workflow, name) {
	const match = workflow.match(new RegExp(`^  ${name}:\\r?\\n([\\s\\S]*?)(?=^  [a-z][a-z_-]*:|$(?![\\s\\S]))`, "m"));
	assert.ok(match, `Missing job: ${name}`);
	return match[1];
}

// Reads the top-level keys of the `on:` block literally. A workflow that
// changes trigger shape must fail this reader instead of silently recording no
// triggers.
function triggersFromWorkflowText(workflow) {
	const lines = workflow.split("\n");
	const start = lines.findIndex((line) => /^on:/.test(line));
	assert.notEqual(start, -1, "workflow has no on: trigger block");
	const triggers = [];
	for (const line of lines.slice(start + 1)) {
		if (line.trim() === "") continue;
		if (!/^\s/.test(line)) break;
		const match = line.match(/^ {2}([a-z_]+):\s*$/);
		if (match) triggers.push(match[1]);
	}
	assert.ok(triggers.length > 0, "could not read any trigger from the on: block");
	return triggers;
}

function workflowTriggers(path) {
	return triggersFromWorkflowText(readWorkflow(path));
}

function enabled(block, github) {
	const condition = block.match(/^    if: \$\{\{ (.+) \}\}$/m);
	if (!condition) return true;
	const expression = condition[1].replace(/github\.(event_name|repository|ref)/g, (_, key) => JSON.stringify(github[key]));
	assert.match(expression, /^[\w\s'"/().=!&|:-]+$/);
	return Function(`"use strict"; return (${expression});`)();
}

test("only the exact authorized manual repository and branch select the native job", () => {
	const workflow = readWorkflow(".github/workflows/test.yml");
	for (const [event_name, repository, ref, ordinary, native] of [
		["workflow_dispatch", "tommy-ca/LazyPi", "refs/heads/feat/strict-native-pstack-proof", false, true],
		["pull_request", "tommy-ca/LazyPi", "refs/heads/feat/strict-native-pstack-proof", true, false],
		["push", "tommy-ca/LazyPi", "refs/heads/master", true, false],
		["workflow_dispatch", "fork/LazyPi", "refs/heads/feat/strict-native-pstack-proof", true, false],
		["workflow_dispatch", "tommy-ca/LazyPi", "refs/heads/master", true, false],
		["workflow_dispatch", "tommy-ca/LazyPi", "refs/tags/feat/strict-native-pstack-proof", true, false],
	]) {
		const context = { event_name, repository, ref };
		assert.equal(enabled(job(workflow, "test"), context), ordinary, JSON.stringify(context));
		assert.equal(enabled(job(workflow, "native-pstack"), context), native, JSON.stringify(context));
	}
});

test("packed CLI smoke script exists", () => {
	assert.equal(existsSync("scripts/packed-cli-smoke.mjs"), true);
});

test("linux CI executes gates and packed CLI checks in order", () => {
	const ordinary = job(readWorkflow(".github/workflows/test.yml"), "test");
	assertCommandsInOrder(ordinary.slice(ordinary.indexOf("    steps:")), [
		"npm test",
		"npm run spec:validate",
		PACKED_CLI_SMOKE_COMMAND,
		"node bin/lazypi.mjs --yes",
		EMPTY_OPTIONAL_GATE,
		"node scripts/assert-installed-packages.mjs --check-status",
		"node scripts/e2e-install.mjs",
	]);
});

test("linux CI asserts the empty optional selection contract instead of a no-op install", () => {
	const ordinary = job(readWorkflow(".github/workflows/test.yml"), "test");
	const steps = ordinary.slice(ordinary.indexOf("    steps:"));
	assertCommandsInOrder(steps, [
		"node bin/lazypi.mjs --yes",
		EMPTY_OPTIONAL_GATE,
		"node scripts/assert-installed-packages.mjs --check-status",
	]);
	assert.doesNotMatch(steps, /--yes --only optional/, "a bare empty optional run cannot fail, so it cannot be the gate");
	assert.match(steps, /- name: Assert empty optional selection changes nothing/);
});

// Hermetic proof of the contract the Linux gate asserts: the empty optional
// selection exits 0, touches no settings byte, and reaches no package command.
// Its name is the pattern the workflow step selects, so the gate and this proof
// cannot drift apart.
test("empty optional selection changes nothing and runs no pi install", (t) => {
	const sandbox = createCliSandbox(t, { prefix: "lazypi-empty-optional-" });
	const settings = sandbox.settingsPath();
	const original = JSON.stringify({ packages: ["npm:pi-subagents"], keep: true }) + "\n";
	writeFileSync(settings, original);
	writeFileSync(`${settings}.lazypi.fixture.bak`, "existing backup\n");
	// Stub executables, not a filtered environment: an empty selection that grew
	// a spawn would reach a stub and leave a recorded invocation behind.
	const result = sandbox.run(["--yes", "--only", "optional"]);
	assert.equal(result.error, undefined);
	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(result.stdout, "Nothing selected — nothing to install.\n");
	assert.equal(result.stderr, "");
	assert.deepEqual(sandbox.external(), [], "an empty selection must not run pi or npm");
	assert.equal(readFileSync(settings, "utf8"), original);
	assert.equal(readFileSync(`${settings}.lazypi.fixture.bak`, "utf8"), "existing backup\n");
});

test("windows smoke records that its dispatch-only trigger cannot gate a pull request", () => {
	// A recorded gap, not a satisfied gate: the installer spec makes a Windows
	// obligation normative, but this workflow runs only on manual dispatch, so a
	// pull request can never be blocked by it. Moving the trigger is a cost
	// decision for the maintainer, so the trigger is asserted rather than changed.
	assert.deepEqual(workflowTriggers(".github/workflows/windows-smoke.yml"), ["workflow_dispatch"]);
	assert.ok(workflowTriggers(".github/workflows/test.yml").includes("pull_request"));
});

test("trigger recording fails when a pull request trigger is added to the dispatch-only workflow", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	const mutated = workflow.replace("on:\n  workflow_dispatch:\n", "on:\n  pull_request:\n  workflow_dispatch:\n");
	assert.notEqual(mutated, workflow, "mutation must change the workflow fixture");
	assert.deepEqual(triggersFromWorkflowText(mutated), ["pull_request", "workflow_dispatch"]);
	assert.throws(() => triggersFromWorkflowText("name: no-triggers\njobs:\n  x:\n"));
});

test("windows CI asserts the empty optional selection with a step that can fail", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	assertCommandsInOrder(workflow, WINDOWS_COMMANDS);
	// The same contradiction the Linux job closed: a bare empty optional install
	// exits 0 whatever the product does, so it cannot be the enforced gate.
	assert.doesNotMatch(workflow, /--yes --only optional/, "a bare empty optional run cannot fail, so it cannot be the gate");
	assert.match(workflow, /- name: Assert empty optional selection changes nothing/);
});

test("windows CI runs the gate file whole so a renamed test cannot empty the step", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	const step = `        run: ${WINDOWS_OPTIONAL_GATE}`;
	assert.ok(workflow.includes(`${step}\n`), `the Windows gate step runs the whole gate file: ${WINDOWS_OPTIONAL_GATE}`);
	assert.doesNotMatch(workflow, /--test-name-pattern/, "a title pattern selects zero tests after a rename and still exits 0");
	assert.match(workflow, /- name: Assert empty optional selection changes nothing/);
});

test("workflow checks reject commented, conditional, and unsupported required commands", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	const step = `        run: ${WINDOWS_OPTIONAL_GATE}`;
	for (const replacement of [
		`        # run: ${WINDOWS_OPTIONAL_GATE}`,
		`        if: false\n${step}`,
		`        if: \${{ false }}\n${step}`,
		`        run: |\n          ${WINDOWS_OPTIONAL_GATE}`,
	]) {
		assert.throws(() => assertCommandsInOrder(workflow.replace(step, replacement), WINDOWS_COMMANDS), replacement);
	}
});

test("workflow checks reject command text in environment or multiline step names", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	const step = `        run: ${WINDOWS_OPTIONAL_GATE}`;
	const mutations = [
		workflow.replace(step, `        env:\n          run: ${WINDOWS_OPTIONAL_GATE}\n        run: echo skipped`),
		workflow.replace(`      - name: Assert empty optional selection changes nothing\n${step}`, `      - name: |\n          run: ${WINDOWS_OPTIONAL_GATE}\n        run: echo skipped`),
	];
	for (const mutated of mutations) {
		assert.notEqual(mutated, workflow, "Mutation must change the workflow fixture");
		assert.throws(() => assertCommandsInOrder(mutated, WINDOWS_COMMANDS));
	}
});

test("workflow suite accepts CRLF checkout files without weakening mutations", (t) => {
	const root = mkdtempSync(join(tmpdir(), "lazypi-workflow-crlf-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	mkdirSync(join(root, ".github", "workflows"), { recursive: true });
	mkdirSync(join(root, "scripts"));
	mkdirSync(join(root, "helpers"));
	// The suite imports the isolation helper, so a run from another checkout root
	// needs its copy beside the suite as well.
	writeFileSync(join(root, "helpers", "cli-spawn.mjs"), readFileSync(join("test", "helpers", "cli-spawn.mjs")));
	writeFileSync(join(root, "scripts", "packed-cli-smoke.mjs"), readFileSync("scripts/packed-cli-smoke.mjs"));
	for (const name of ["test.yml", "windows-smoke.yml"]) {
		writeFileSync(join(root, ".github", "workflows", name), readFileSync(`.github/workflows/${name}`, "utf8").replace(/\r?\n/g, "\r\n"));
	}
	const suite = join(root, "ci-workflows.test.mjs");
	writeFileSync(suite, readFileSync(new URL(import.meta.url), "utf8"));
	const env = { ...process.env, HOME: root, USERPROFILE: root, PI_CODING_AGENT_DIR: join(root, "agent") };
	delete env.NODE_TEST_CONTEXT;
	const result = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "--test-name-pattern=^(linux CI|windows CI|workflow checks)", suite], {
		cwd: root,
		env,
		encoding: "utf8",
		timeout: 15_000,
	});
	assert.equal(result.error, undefined);
	assert.match(result.stdout, /^ok \d+ - workflow checks reject command text in environment or multiline step names\r?$/m);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test("workflow checks reject reversed required command order", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	const swapped = workflow.replace(WINDOWS_OPTIONAL_GATE, "__OPTIONAL__")
		.replace("node scripts/assert-installed-packages.mjs --check-status", WINDOWS_OPTIONAL_GATE)
		.replace("__OPTIONAL__", "node scripts/assert-installed-packages.mjs --check-status");
	assert.throws(() => assertCommandsInOrder(swapped, WINDOWS_COMMANDS));
});
