import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { stripVTControlCharacters } from "node:util";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const TTY_RUNNER = "/usr/bin/script";
const SUBAGENT_BUILTIN_MODELS = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];
// Control bytes that may not reach a terminal unescaped when they came from a
// settings or auth file. Newline and tab are deliberately absent: `status`
// output is line-oriented and no fixture below relies on either.
const RAW_CONTROL_RE = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/;

// Every child below runs with the isolation helper's environment: PATH holds
// one stub directory, so no host pi, npm, or system tool is reachable.
function createSandbox(t) {
	return createCliSandbox(t, { prefix: "lazypi-settings-integrity-" });
}

// Lines directly under a `status` section header, up to the blank separator.
function sectionLines(stdout, header) {
	const lines = stdout.split("\n");
	const at = lines.findIndex((line) => line.startsWith(header));
	assert.notEqual(at, -1, `missing section ${header} in:\n${stdout}`);
	const found = [];
	for (const line of lines.slice(at + 1)) {
		if (line === "") break;
		found.push(line);
	}
	return found;
}

function alignToSecondBoundary() {
	const target = Date.now() + 1000 - (Date.now() % 1000) + 10;
	const shared = new Int32Array(new SharedArrayBuffer(4));
	while (Date.now() < target) Atomics.wait(shared, 0, 0, Math.min(50, target - Date.now()));
}

// Rule 1 (security S1): a symlinked or non-regular settings file is refused.
test("a symlinked settings file is refused without copying or overwriting its target", (t) => {
	const sandbox = createSandbox(t);
	for (const local of [false, true]) {
		const settings = sandbox.settingsPath(local);
		const target = join(sandbox.dirs.home, `linked-${local ? "local" : "global"}.json`);
		const targetBytes = '{\n  "keep": true,\n  "packages": []\n}\n';
		writeFileSync(target, targetBytes, { mode: 0o600 });
		symlinkSync(target, settings);

		const result = sandbox.run(["install", "--yes", ...(local ? ["--local"] : [])]);
		assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
		assert.equal(result.stderr, `Refusing to write ${settings} — it is a symbolic link.\n`);
		assert.doesNotMatch(result.stdout, /Done\./);
		assert.equal(readFileSync(target, "utf8"), targetBytes);
		assert.equal(statSync(target).mode & 0o777, 0o600);
		assert.equal(readlinkSync(settings), target);
		assert.deepEqual(sandbox.entries(dirname(settings)), ["settings.json"]);
	}
	assert.deepEqual(sandbox.external(), []);
});

test("a non-regular settings path is refused before it is read or written", (t) => {
	const sandbox = createSandbox(t);
	const settings = sandbox.settingsPath();
	mkdirSync(settings);

	const result = sandbox.run(["install", "--yes"]);
	assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
	assert.equal(result.stderr, `Invalid settings file ${settings} — it is not a regular file.\n`);
	assert.equal(result.stdout, "");
	assert.deepEqual(sandbox.entries(sandbox.dirs.agent), ["settings.json"]);
	assert.deepEqual(sandbox.entries(settings), []);
	assert.deepEqual(sandbox.external(), []);
});

// Rule 2 (security S2): control characters from settings or auth never reach
// the terminal raw.
test("control characters from settings and auth are escaped before printing", (t) => {
	const sandbox = createSandbox(t);
	const settings = sandbox.settingsPath();
	const auth = sandbox.authPath();
	const escape = "\u001b";
	writeFileSync(
		settings,
		JSON.stringify({ packages: ["npm:evil\u001b]0;pwned\u0007", "git:github.com/acme/tool\u001b[31m"] }) + "\n",
	);
	writeFileSync(auth, JSON.stringify({ "anthropic\u001b[2J": { type: "oauth" } }) + "\n");

	const status = sandbox.run(["status"]);
	assert.equal(status.status, 0, `${status.stdout}\n${status.stderr}`);
	assert.equal(status.stderr, "");
	assert.doesNotMatch(status.stdout, RAW_CONTROL_RE);
	assert.deepEqual(sectionLines(status.stdout, "Other Pi packages outside the LazyPi catalog (2):"), [
		"  · npm:evil\\u001b]0;pwned\\u0007",
		"  · git:github.com/acme/tool\\u001b[31m",
	]);

	const doctor = sandbox.run(["doctor"]);
	assert.equal(doctor.status, 0, `${doctor.stdout}\n${doctor.stderr}`);
	assert.equal(doctor.stderr, "");
	assert.equal(doctor.stdout.includes(escape), false, doctor.stdout);
	assert.equal(
		doctor.stdout.split("\n").includes(`  ! git:github.com/acme/tool\\u001b[31m is an unpinned git head — pin it to a commit for reproducible installs`),
		true,
		doctor.stdout,
	);
	assert.equal(doctor.stdout.split("\n").includes(`  ✓ ${auth} → anthropic\\u001b[2J`), true, doctor.stdout);

	const install = sandbox.run(["install", "--yes", "--only", "subagents"]);
	assert.equal(install.status, 0, `${install.stdout}\n${install.stderr}`);
	assert.equal(install.stdout.includes(escape), false, install.stdout);
	assert.equal(install.stdout.includes("Pi credentials:    anthropic\\u001b[2J (auth.json)\n"), true, install.stdout);
});

// Rule 3 (correctness C1): a write that fails after the file is opened leaves
// the original bytes intact.
test("a failed settings write leaves the original bytes and the directory intact", { skip: process.platform === "win32" ? "file-size limits need a POSIX shell" : false }, (t) => {
	const sandbox = createSandbox(t);
	const settings = sandbox.settingsPath();
	const probe = join(sandbox.dirs.tmp, "size-probe");
	const limited = "ulimit -f 4; ";
	// A file-size measurement, not a CLI child: this shell probe writes through
	// the parent environment on purpose and never asks for pi, npm, or the CLI.
	spawnSync("/bin/sh", ["-c", `${limited}head -c 200000 /dev/zero > '${probe}'`], { encoding: "utf8" });
	assert.equal(existsSync(probe), true);
	const limitBytes = statSync(probe).size;
	assert.ok(limitBytes >= 1024, `unexpected file-size limit ${limitBytes}`);
	rmSync(probe, { force: true });

	const packages = ["npm:pi-subagents"];
	const skeleton = JSON.stringify({ packages, note: "", keep: true }, null, 2) + "\n";
	// The original sits just under the limit, so the backup copy succeeds and the
	// mutated document (which adds the six builtin overrides) crosses it.
	const original = JSON.stringify({ packages, note: "x".repeat(limitBytes - 32 - Buffer.byteLength(skeleton)), keep: true }, null, 2) + "\n";
	assert.equal(Buffer.byteLength(original), limitBytes - 32);
	writeFileSync(settings, original);
	const before = sandbox.entries(sandbox.dirs.agent);

	const result = sandbox.run(["install", "--yes", "--only", "subagents"], {
		wrapper: (argv) => ({ command: "/bin/sh", args: ["-c", `${limited}exec "$0" "$@"`, ...argv] }),
	});
	assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
	assert.equal(result.stderr, `Could not write ${settings} — EFBIG. The file was left unchanged.\n`);
	assert.equal(readFileSync(settings, "utf8"), original);
	assert.deepEqual(sandbox.entries(sandbox.dirs.agent), before);
	assert.deepEqual(sandbox.external(), []);
});

// Rule 4 (correctness C2): two mutations in one second keep distinct backups.
test("two settings mutations in the same second keep distinct backups", (t) => {
	const sandbox = createSandbox(t);
	const settings = sandbox.settingsPath();
	const v1 = JSON.stringify({ keep: true, packages: [], subagents: { agentOverrides: { planner: { model: "claude-opus" } } } }, null, 2) + "\n";
	writeFileSync(settings, v1);

	alignToSecondBoundary();
	const second = Math.floor(Date.now() / 1000);
	const first = sandbox.run(["install", "--yes", "--only", "subagents"]);
	assert.equal(first.status, 0, `${first.stdout}\n${first.stderr}`);
	const afterFirst = readFileSync(settings, "utf8");
	const firstBackups = sandbox.backups(sandbox.dirs.agent);
	assert.deepEqual(firstBackups.map((name) => readFileSync(join(sandbox.dirs.agent, name), "utf8")), [v1]);
	assert.match(firstBackups[0], /^settings\.json\.lazypi\.\d{8}T\d{6}\.\d{3}Z\.bak$/);

	const parsed = JSON.parse(afterFirst);
	parsed.subagents.agentOverrides.planner = { model: "claude-opus" };
	const v2 = JSON.stringify(parsed, null, 2) + "\n";
	writeFileSync(settings, v2);
	const again = sandbox.run(["install", "--yes", "--only", "subagents"]);
	assert.equal(again.status, 0, `${again.stdout}\n${again.stderr}`);
	assert.equal(Math.floor(Date.now() / 1000), second, "both mutations must land in the same second");

	const backups = sandbox.backups(sandbox.dirs.agent);
	assert.equal(backups.length, 2, backups.join(", "));
	assert.deepEqual(
		backups.map((name) => readFileSync(join(sandbox.dirs.agent, name), "utf8")).sort(),
		[v1, v2].sort(),
	);
});

// Rule 5 (correctness C3, C4, C5): an unusable settings document is rejected
// before anything is written.
test("a settings document that is not an object of the right shape is rejected", (t) => {
	const cases = [
		{ bytes: "[]\n", args: ["install", "--yes"], detail: "the top-level JSON value is an array, but LazyPi needs an object" },
		{ bytes: "5\n", args: ["install", "--yes"], detail: "the top-level JSON value is a number, but LazyPi needs an object" },
		{ bytes: '"yes"\n', args: ["install", "--yes"], detail: "the top-level JSON value is a string, but LazyPi needs an object" },
		{ bytes: '{"subagents":"yes","keep":1}\n', args: ["install", "--yes"], detail: '"subagents" must be an object, but it is a string' },
		{ bytes: '{"packages":42}\n', args: ["status"], detail: '"packages" must be an array, but it is a number' },
		{ bytes: '{"packages":"npm:pi-verdict"}\n', args: ["status"], detail: '"packages" must be an array, but it is a string' },
		{ bytes: '{"subagents":{"agentOverrides":"nope"}}\n', args: ["install", "--yes"], detail: '"subagents.agentOverrides" must be an object, but it is a string' },
	];
	for (const { bytes, args, detail } of cases) {
		const sandbox = createSandbox(t);
		const settings = sandbox.settingsPath();
		writeFileSync(settings, bytes);
		const before = sandbox.entries(sandbox.dirs.agent);

		const result = sandbox.run(args);
		const label = `${args.join(" ")} with ${bytes.trim()}`;
		assert.equal(result.status, 2, `${label}\n${result.stdout}\n${result.stderr}`);
		assert.equal(result.stderr, `Invalid settings file ${settings} — ${detail}.\n`, label);
		assert.doesNotMatch(`${result.stdout}${result.stderr}`, /TypeError|Cannot create property|is not iterable/, label);
		assert.equal(readFileSync(settings, "utf8"), bytes, label);
		assert.deepEqual(sandbox.entries(sandbox.dirs.agent), before, label);
		assert.deepEqual(sandbox.external(), [], label);
	}
});

// Rule 6 (correctness D2): --version does not swallow an invalid argument.
test("--version reports an invalid argument instead of the version", (t) => {
	const sandbox = createSandbox(t);
	const result = sandbox.run(["--version", "--bogus"]);
	assert.equal(result.status, 2, `${result.stdout}\n${result.stderr}`);
	assert.equal(result.stderr, "Unknown argument: --bogus\n");
	assert.doesNotMatch(result.stdout, /@tommy-ca\/lazypi \d+\.\d+\.\d+/);
	assert.match(result.stdout, /^lazypi — opinionated installer for Pi extensions\n\nUsage:\n/);
	assert.deepEqual(sandbox.external(), []);

	const version = sandbox.run(["--version"]);
	assert.equal(version.status, 0, `${version.stdout}\n${version.stderr}`);
	assert.match(version.stdout, /^@tommy-ca\/lazypi \d+\.\d+\.\d+\n$/);
	assert.equal(version.stderr, "");

	const unknown = sandbox.run(["--bogus"]);
	assert.equal(unknown.status, 2, `${unknown.stdout}\n${unknown.stderr}`);
	assert.equal(unknown.stderr, "Unknown argument: --bogus\n");
	assert.match(unknown.stdout, /^lazypi — opinionated installer for Pi extensions\n\nUsage:\n/);
});

// Rule 7 (correctness D4): a non-object auth.json creates no phantom provider.
test("a non-object auth.json does not create phantom providers", (t) => {
	for (const bytes of ['["nobody"]\n', '"nobody"\n', "0\n"]) {
		const sandbox = createSandbox(t);
		const auth = sandbox.authPath();
		writeFileSync(auth, bytes);

		const doctor = sandbox.run(["doctor"]);
		assert.equal(doctor.status, 0, `${bytes}${doctor.stdout}\n${doctor.stderr}`);
		assert.equal(doctor.stdout.includes("auth.json → "), false, bytes);
		assert.equal(doctor.stdout.split("\n").includes("  ! No credentials detected — run `pi` then `/login`, or export a provider API key"), true, doctor.stdout);

		const install = sandbox.run(["install", "--yes", "--only", "subagents"]);
		assert.equal(install.status, 0, `${bytes}${install.stdout}\n${install.stderr}`);
		assert.equal(install.stdout.includes("Pi credentials:    none detected\n"), true, install.stdout);
		assert.equal(install.stdout.includes("(auth.json)"), false, install.stdout);
	}
});

// Rule 8 (structure F4): ensurePi uses the caller's interactivity decision, so
// the documented `--only` scripted path never blocks on a prompt.
test("the scripted --only path never blocks on a Pi bootstrap prompt", { skip: process.platform !== "linux" ? "requires a POSIX tty runner" : false }, async (t) => {
	const sandbox = createSandbox(t);
	sandbox.removeStub("pi");
	assert.ok(existsSync(TTY_RUNNER), `missing tty runner ${TTY_RUNNER}`);

	const command = sandbox.shellCommand(["install", "--only", "core"]);
	const child = spawn(TTY_RUNNER, ["-q", "-e", "-c", command, join(sandbox.dirs.tmp, "typescript")], {
		cwd: sandbox.dirs.work,
		env: sandbox.env,
		stdio: ["pipe", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	child.stdout.on("data", (chunk) => {
		stdout += chunk;
	});
	child.stderr.on("data", (chunk) => {
		stderr += chunk;
	});
	const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
	const status = await new Promise((resolveClose, rejectClose) => {
		child.on("error", rejectClose);
		child.on("close", resolveClose);
	});
	clearTimeout(timer);

	const text = stripVTControlCharacters(stdout);
	assert.equal(status, 127, `child did not exit on its own\n${text}\n${stderr}`);
	assert.doesNotMatch(text, /Install Pi now with/);
	assert.match(text, /Install Pi first \(`npm install -g @earendil-works\/pi-coding-agent`\), then re-run `npx @tommy-ca\/lazypi`\./);
	assert.deepEqual(sandbox.external(), []);
});

// ---------------------------------------------------------------------------
// Preserved behavior of the surfaces the rules above touch
// ---------------------------------------------------------------------------
test("install --local still rewrites overrides, keeps extra keys, and preserves the file mode", (t) => {
	const sandbox = createSandbox(t);
	const settings = sandbox.settingsPath(true);
	mkdirSync(dirname(settings), { recursive: true });
	const original = JSON.stringify({ keep: { nested: [42, true] }, packages: ["npm:pi-btw@0.1.0"], subagents: { agentOverrides: { planner: { model: "claude-opus", tools: ["read"] } } } }, null, 2) + "\n";
	writeFileSync(settings, original, { mode: 0o600 });

	const result = sandbox.run(["install", "--yes", "--only", "subagents", "--local"]);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	const written = JSON.parse(readFileSync(settings, "utf8"));
	assert.deepEqual(written.keep, { nested: [42, true] });
	assert.deepEqual(written.packages, ["npm:pi-btw@0.1.0"]);
	for (const name of SUBAGENT_BUILTIN_MODELS) assert.equal(written.subagents.agentOverrides[name].model, "");
	assert.deepEqual(written.subagents.agentOverrides.planner, { model: "", tools: ["read"] });
	assert.equal(statSync(settings).mode & 0o777, 0o600);
	const backups = sandbox.backups(dirname(settings));
	assert.equal(backups.length, 1, backups.join(", "));
	assert.equal(readFileSync(join(dirname(settings), backups[0]), "utf8"), original);
	assert.equal(statSync(join(dirname(settings), backups[0])).mode & 0o777, 0o600);
});

test("status still classifies catalog, legacy, missing, and other sources", (t) => {
	const sandbox = createSandbox(t);
	writeFileSync(sandbox.settingsPath(), JSON.stringify({ packages: ["npm:pi-subagents@0.86.0", "npm:pi-btw@0.1.0"] }) + "\n");

	const result = sandbox.run(["status"]);
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
	assert.equal(result.stderr, "");
	assert.deepEqual(sectionLines(result.stdout, "Installed from LazyPi catalog (1/6):"), [
		"  core 1/6, optional 0/0",
		"  ✓ [core] subagents            npm:pi-subagents@0.86.0",
	]);
	assert.deepEqual(sectionLines(result.stdout, "Other Pi packages outside the LazyPi catalog (1):"), ["  · npm:pi-btw@0.1.0"]);
});

test("a valid auth.json object is still reported as a credential", (t) => {
	const sandbox = createSandbox(t);
	const auth = sandbox.authPath();
	writeFileSync(auth, JSON.stringify({ anthropic: { type: "oauth", access: "secret-token" } }) + "\n");

	const doctor = sandbox.run(["doctor"]);
	assert.equal(doctor.status, 0, `${doctor.stdout}\n${doctor.stderr}`);
	assert.equal(doctor.stdout.split("\n").includes(`  ✓ ${auth} → anthropic`), true, doctor.stdout);
	assert.equal(doctor.stdout.includes("secret-token"), false);

	const install = sandbox.run(["install", "--yes", "--only", "subagents"]);
	assert.equal(install.status, 0, `${install.stdout}\n${install.stderr}`);
	assert.equal(install.stdout.includes("Pi credentials:    anthropic (auth.json)\n"), true, install.stdout);
	assert.equal(install.stdout.includes("secret-token"), false);
});

test("an install without pi on a non-TTY still exits 127 with the install-first error", (t) => {
	const sandbox = createSandbox(t);
	sandbox.removeStub("pi");

	const result = sandbox.run(["install", "--only", "core"]);
	assert.equal(result.status, 127, `${result.stdout}\n${result.stderr}`);
	assert.match(result.stdout, /Install Pi first \(`npm install -g @earendil-works\/pi-coding-agent`\), then re-run `npx @tommy-ca\/lazypi`\./);
	assert.doesNotMatch(result.stdout, /Install Pi now with/);
	assert.deepEqual(sandbox.external(), []);
});

// R4-status-diagnostic-regression: `status` has always reported a malformed
// settings document as "  could not parse: <error>". New failure modes may use
// the shared printer, but this branch must keep its original bytes.
test("status keeps its original could-not-parse diagnostic for malformed JSON", (t) => {
	const sandbox = createSandbox(t);
	writeFileSync(sandbox.settingsPath(), "{ not json\n");
	const result = sandbox.run(["status"]);
	assert.equal(result.status, 2);
	const stderrLines = result.stderr.split("\n").filter(Boolean);
	assert.equal(stderrLines.length, 1, `unexpected stderr:\n${result.stderr}`);
	assert.match(stderrLines[0], /^ {2}could not parse: /);
	assert.doesNotMatch(result.stderr, /Could not parse/);
	assert.match(result.stdout, /^Settings file: /);
	assert.deepEqual(sandbox.external(), []);
});
