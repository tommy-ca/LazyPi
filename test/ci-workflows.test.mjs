import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

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

test("packed CLI smoke script exists", () => {
	assert.equal(existsSync("scripts/packed-cli-smoke.mjs"), true);
});

test("linux CI executes gates and packed CLI checks in order", () => {
	assertCommandsInOrder(readWorkflow(".github/workflows/test.yml"), [
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
	assertCommandsInOrder(readWorkflow(".github/workflows/windows-smoke.yml"), WINDOWS_COMMANDS);
});

test("workflow checks reject commented, conditional, and unsupported required commands", () => {
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
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
	const workflow = readWorkflow(".github/workflows/windows-smoke.yml");
	const step = `        run: ${OPTIONAL_INSTALL}`;
	const mutations = [
		workflow.replace(step, `        env:\n          run: ${OPTIONAL_INSTALL}\n        run: echo skipped`),
		workflow.replace(`      - name: Install optional catalog tier\n${step}`, `      - name: |\n          run: ${OPTIONAL_INSTALL}\n        run: echo skipped`),
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
	const swapped = workflow.replace(OPTIONAL_INSTALL, "__OPTIONAL__")
		.replace("node scripts/assert-installed-packages.mjs --check-status", OPTIONAL_INSTALL)
		.replace("__OPTIONAL__", "node scripts/assert-installed-packages.mjs --check-status");
	assert.throws(() => assertCommandsInOrder(swapped, WINDOWS_COMMANDS));
});
