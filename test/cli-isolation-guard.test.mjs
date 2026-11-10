// Enforceable isolation guard for every child process the test suite starts.
//
// The accident this file prevents is real: fixtures used to prepend a stub bin
// directory to the inherited PATH, force /usr/bin and /bin onto a child PATH, or
// add the running Node install directory, which also contains a real `npm`. Two
// authorized baseline preparations failed on exactly that kind of assumption,
// and this repository once ran a real `npm install -g` from a test path.
//
// The rules are static so they bind future fixtures too, and they are proven
// against fixture sources below rather than assumed to work.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const TEST_ROOT = fileURLToPath(new URL(".", import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const HELPER = resolve(TEST_ROOT, "helpers", "cli-spawn.mjs");

// #region detector
// Everything between these markers is stripped from this file before it is
// scanned, because it necessarily contains the very literals the rules forbid.
// Sample sources prove each rule fires instead of being trusted.
const RULES = [
	{
		name: "parent-path",
		why: "builds a child PATH from the parent process environment, so a real pi, npm or system tool stays reachable",
		pattern: /\bprocess\s*\.\s*env\s*(?:\.\s*PATH\b|\[\s*["']PATH["']\s*\])/g,
	},
	{
		name: "system-dir-entry",
		why: "puts a system directory entry on a child PATH",
		pattern: /(["'`])\/usr\/bin\1|(["'`])\/bin\2/g,
	},
	{
		name: "system-dir-list",
		why: "puts a system-directory PATH string on a child PATH",
		pattern: /(["'`])(?:\/usr\/bin|\/bin)(?:[:;](?:\/usr\/bin|\/bin))+\1/g,
	},
	{
		name: "node-install-dir",
		why: "puts the running Node install directory on a child PATH, which also holds a real npm",
		pattern: /\bdirname\s*\(\s*process\s*\.\s*execPath\s*\)/g,
	},
];
const cliPathRule = {
	name: "cli-path-literal",
	why: "names the CLI by path instead of taking it from the isolated helper, which is how a test spawns it with an unchecked environment",
	pattern: /(["'`])(?:\.\/)?bin\/lazypi\.mjs\1/g,
};
const cliSpawnLiteralRule = {
	name: "cli-spawn-literal",
	why: "builds a CLI path inside a spawn call instead of asking the isolated helper for it",
	pattern: /lazypi\.mjs/g,
};
const cliBindingRule = {
	name: "cli-binding-in-spawn",
	why: "spawns the CLI straight through the helper's path constant instead of the helper's runner, which also applies the isolated environment and the stub checks",
	pattern: /\bCLI_PATH\b/g,
};
const SAMPLES = {
	"parent-path": 'const env = { PATH: [bin, process.env.PATH].join(delimiter) };\n',
	"system-dir-entry": 'const env = { PATH: [bin, "/usr/bin", "/bin"].join(delimiter) };\n',
	"system-dir-list": 'const env = { PATH: "/usr/bin:/bin" };\n',
	"node-install-dir": "const env = { PATH: [bin, dirname(process.execPath)].join(delimiter) };\n",
	"cli-path-literal": 'const cli = resolve("bin/lazypi.mjs");\nspawnSync(process.execPath, [cli, "--help"]);\n',
	"cli-spawn-literal": 'spawnSync(process.execPath, [join(target, "lazypi.mjs")], { encoding: "utf8" });\n',
	"cli-binding-in-spawn": 'spawnSync(process.execPath, [CLI_PATH, "--help"], { encoding: "utf8" });\n',
	clean: 'import { createCliSandbox } from "./helpers/cli-spawn.mjs";\nconst sandbox = createCliSandbox(t);\nsandbox.run(["--version"]);\n',
	// Workflow command text and a fixture-owned package filename are data, not a
	// spawn of this repository's CLI, so they must not be reported.
	"clean-data-text": 'const OPTIONAL_INSTALL = "node bin/lazypi.mjs --yes --only optional";\nwriteFileSync(join(target, "lazypi.mjs"), packed);\n',
};
// #endregion detector

function withoutDetectorRegion(source) {
	return source.replace(/\n\/\/ #region detector[\s\S]*?\/\/ #endregion detector\n/, "\n");
}

function testFiles(dir = TEST_ROOT, found = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) testFiles(path, found);
		else if (extname(entry.name) === ".mjs") found.push(path);
	}
	return found.sort();
}

function findings(source, path, rules = RULES) {
	const found = [];
	for (const rule of rules) {
		for (const match of source.matchAll(rule.pattern)) {
			const line = source.slice(0, match.index).split("\n").length;
			found.push({ rule: rule.name, why: rule.why, path, line, text: match[0] });
		}
	}
	return found;
}

function describe(found) {
	return found.map((f) => `${relative(TEST_ROOT, f.path)}:${f.line}: ${f.rule} — ${f.why}\n    ${f.text}`).join("\n");
}

// Every call that starts a child, with its balanced argument text. A non-greedy
// match would stop at the first inner `)`, so the scan counts brackets and skips
// string and template literals.
function spawnCalls(source) {
	const calls = [];
	for (const match of source.matchAll(/\b(?:spawnSync|spawn|fork|execFileSync|execFile)\s*\(/g)) {
		let depth = 1;
		let quote = null;
		let at = match.index + match[0].length;
		while (at < source.length && depth > 0) {
			const char = source[at];
			if (quote) {
				if (char === "\\") at += 1;
				else if (char === quote) quote = null;
			} else if (char === '"' || char === "'" || char === "`") quote = char;
			else if ("([{".includes(char)) depth += 1;
			else if (")]}".includes(char)) depth -= 1;
			at += 1;
		}
		calls.push({ index: match.index, text: source.slice(match.index, at) });
	}
	return calls;
}

function cliSpawnFindings(source, path) {
	const found = [];
	for (const call of spawnCalls(source)) {
		for (const rule of [cliSpawnLiteralRule, cliBindingRule]) {
			for (const match of call.text.matchAll(rule.pattern)) {
				const line = source.slice(0, call.index).split("\n").length;
				found.push({ rule: rule.name, why: rule.why, path, line, text: match[0] });
			}
		}
	}
	return found;
}

test("no test file builds a child PATH from the parent environment or a system directory", () => {
	const found = [];
	for (const path of testFiles()) {
		const source = path === SELF ? withoutDetectorRegion(readFileSync(path, "utf8")) : readFileSync(path, "utf8");
		found.push(...findings(source, path));
	}
	assert.deepEqual(found, [], `child PATH is not isolated:\n${describe(found)}`);
});

test("the shared helper is the only way a test spawns the CLI, and the helper itself is isolated", () => {
	const named = [];
	for (const path of testFiles()) {
		const source = path === SELF ? withoutDetectorRegion(readFileSync(path, "utf8")) : readFileSync(path, "utf8");
		// Reading the CLI source is not a spawn, so the path rule only binds files
		// that start a child of their own.
		if (spawnCalls(source).length > 0) named.push(...findings(source, path, [cliPathRule]));
		if (path !== HELPER) named.push(...cliSpawnFindings(source, path));
	}
	assert.deepEqual(named, [], `the CLI must be spawned through test/helpers/cli-spawn.mjs:\n${describe(named)}`);

	const helper = readFileSync(HELPER, "utf8");
	assert.equal(findings(helper, HELPER).length, 0, "the helper itself must not inherit a PATH or add a system directory");
	assert.match(helper, /#!\$\{process\.execPath\}/, "every stub must start through the absolute Node interpreter, so no PATH lookup is needed");
});

test("the detector proves itself on sources it did not choose", (t) => {
	const root = mkdtempSync(join(tmpdir(), "lazypi-guard-probe-"));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	for (const [expected, source] of Object.entries(SAMPLES)) {
		const path = join(root, `${expected}.mjs`);
		writeFileSync(path, source);
		const found = [...new Set([
			...findings(source, path, [...RULES, cliPathRule]).map((f) => f.rule),
			...cliSpawnFindings(source, path).map((f) => f.rule),
		])];
		if (expected.startsWith("clean")) assert.deepEqual(found, [], `a compliant fixture must not be flagged: ${expected}`);
		else assert.deepEqual(found, [expected], `${expected} sample was not detected exactly once`);
	}

	// A sampled source in a nested directory is still scanned, so discovery does
	// not depend on the paths this suite happens to have today.
	mkdirSync(join(root, "nested"), { recursive: true });
	const nested = join(root, "nested", "case.mjs");
	writeFileSync(nested, SAMPLES["parent-path"]);
	assert.equal(findings(readFileSync(nested, "utf8"), nested).length, 1);
});

test("the helper's child PATH holds fixture stub directories only", (t) => {
	const sandbox = createCliSandbox(t);
	const entries = sandbox.env.PATH.split(delimiter).filter(Boolean);
	assert.deepEqual(entries, [sandbox.bin], "PATH must be exactly the fixture stub directory");
	for (const entry of entries) {
		// The parent PATH is an ambient value, so this asserts the fixture bin is the
		// only entry instead of comparing against a host-dependent list. It also
		// excludes the running Node install directory, which holds a real npm.
		assert.equal(entry, sandbox.bin);
		assert.notEqual(entry, ["", "usr", "bin"].join("/"), "a system directory holds real tools");
		assert.notEqual(entry, ["", "bin"].join("/"), "a system directory holds real tools");
	}
	assert.ok(sandbox.bin.startsWith(tmpdir()), "the fixture bin lives in a private temp directory");
	assert.equal(sandbox.env.HOME, sandbox.home);
	assert.equal(sandbox.env.TMPDIR, sandbox.dirs.tmp);
	assert.equal(sandbox.env.npm_config_cache, sandbox.dirs["npm-cache"]);
	for (const name of ["pi", "npm"]) {
		assert.equal(sandbox.hasStub(name), true, `${name} must be stubbed by default`);
	}
});

test("the helper records each invocation as JSON argv plus exit status", (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.stub("pi", "process.exit(3);");
	const result = sandbox.run(["install", "--yes", "--only", "subagents"]);
	assert.equal(result.error, undefined);
	assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
	assert.deepEqual(sandbox.external(), [{ command: "pi", argv: ["install", "npm:pi-subagents"], status: 3 }]);
	assert.match(result.stderr, /failed to install subagents/);
	assert.deepEqual(sandbox.calls().at(-1), { command: "lazypi", argv: ["install", "--yes", "--only", "subagents"], status: 1 });
	assert.ok(sandbox.queries().some((query) => query.argv[0] === "pi" && query.status === 0));
});

test("a command with no stub breaks the test instead of reaching a real tool", (t) => {
	const sandbox = createCliSandbox(t);
	assert.throws(
		() => sandbox.spawn("ghost-tool", []),
		(error) => /no stub/.test(error.message) && error.message.includes(sandbox.bin),
	);

	// The same guarantee holds for a command the child asks for at run time: the
	// stubbed `which` records the failed lookup, so the run itself fails here.
	sandbox.stub("pi", `import { spawnSync } from "node:child_process";\nspawnSync("which", ["ghost-tool"]);\n`);
	assert.throws(() => sandbox.run(["install", "--yes", "--only", "subagents"]), /ghost-tool/);

	// A deliberate removal is the only absence that is allowed.
	const strict = createCliSandbox(t);
	strict.removeStub("pi");
	assert.equal(strict.run(["install", "--only", "core"]).status, 127);
});
