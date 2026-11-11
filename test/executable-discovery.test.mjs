// Executable discovery: the CLI resolves `pi` and `npm` from PATH itself.
//
// It used to ask the external `which` command, so a machine without `which`
// made a present `pi` look absent and `install` then offered a global npm
// bootstrap. That accident already ran one real `npm install -g` in this
// repository. Every case below observes the public CLI surface through the
// isolated sandbox, so no case can reach a real tool.
import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { delimiter, join } from "node:path";

import { createCliSandbox } from "./helpers/cli-spawn.mjs";

const WEB_ACCESS = ["install", "--yes", "--only", "web-access"];
const posixOnly = { skip: process.platform === "win32" ? "POSIX executable semantics" : false };

// A `pi` that reports which copy of itself ran, so a test can tell PATH entries
// apart. It starts through an absolute interpreter, so it needs no PATH lookup.
function writePi(dir, { label, marker }) {
	const target = join(dir, "pi");
	writeFileSync(
		target,
		`#!${process.execPath}
import { appendFileSync } from "node:fs";
appendFileSync(${JSON.stringify(marker)}, ${JSON.stringify(`${label} `)} + process.argv.slice(2).join(" ") + "\\n");
`,
	);
	chmodSync(target, 0o755);
	return target;
}

// The CLI reports environment findings on stdout, so a case asserts the whole
// visible result instead of guessing the stream.
function output(result) {
	return `${result.stdout}\n${result.stderr}`;
}

function markerLog(sandbox, name = "pi-runs.log") {
	const path = join(sandbox.root, name);
	writeFileSync(path, "");
	return path;
}

test("install resolves a present pi from PATH when which is absent", (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("which");

	const result = sandbox.run(WEB_ACCESS);

	assert.equal(result.error, undefined);
	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(result.stderr, "");
	assert.deepEqual(sandbox.external(), [{ command: "pi", argv: ["install", "npm:pi-web-access"], status: 0 }]);
	assert.equal(sandbox.external().some((record) => record.command === "npm"), false, "a present pi must never bootstrap npm");
});

test("resolution starts no lookup subprocess of its own", posixOnly, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("which");

	const result = sandbox.run(["doctor"]);

	assert.equal(result.error, undefined);
	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(result.stdout, /pi` is on PATH/);
	assert.match(result.stdout, /npm is on PATH/);
	assert.deepEqual(sandbox.queries(), [], "resolution must not spawn which or where");
});

test("the first eligible PATH entry wins in PATH order", posixOnly, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("pi");
	sandbox.removeStub("which");
	const first = join(sandbox.root, "first");
	const second = join(sandbox.root, "second");
	mkdirSync(first);
	mkdirSync(second);
	const marker = markerLog(sandbox);
	writePi(first, { label: "first", marker });
	writePi(second, { label: "second", marker });

	for (const order of [
		[first, second],
		[second, first],
	]) {
		writeFileSync(marker, "");
		const result = sandbox.run(WEB_ACCESS, { env: { PATH: order.join(delimiter) } });
		assert.equal(result.error, undefined);
		assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
		const label = order[0] === first ? "first" : "second";
		assert.equal(readFileSync(marker, "utf8"), `${label} install npm:pi-web-access\n`, order.join(delimiter));
	}
});

test("empty PATH entries are skipped rather than resolved from the working directory", posixOnly, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("which");
	const marker = markerLog(sandbox);
	// A decoy the CLI would run if it treated an empty entry as the working directory.
	writePi(sandbox.work, { label: "cwd-decoy", marker });

	const result = sandbox.run(WEB_ACCESS, { env: { PATH: ["", sandbox.bin].join(delimiter) } });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(readFileSync(marker, "utf8"), "", "an empty entry must not resolve the decoy");
	assert.deepEqual(sandbox.external().map((record) => record.argv), [["install", "npm:pi-web-access"]]);

	const emptyOnly = createCliSandbox(t);
	emptyOnly.removeStub("which");
	const emptyMarker = markerLog(emptyOnly, "empty-pi-runs.log");
	writePi(emptyOnly.work, { label: "cwd-decoy", marker: emptyMarker });

	const absent = emptyOnly.run(["install", "--local"], { env: { PATH: "" } });

	assert.equal(absent.status, 127, `STDOUT:\n${absent.stdout}\nSTDERR:\n${absent.stderr}`);
	assert.match(output(absent), /Could not find the `pi` command/);
	assert.equal(readFileSync(emptyMarker, "utf8"), "", "an empty entry must not resolve the decoy");
	assert.deepEqual(emptyOnly.external(), []);
});

test("an unset PATH yields no resolution", posixOnly, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("which");

	const result = sandbox.run(["install", "--local"], { env: { PATH: undefined } });

	assert.equal(result.error, undefined);
	assert.equal(result.status, 127, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.match(output(result), /Could not find the `pi` command/);
	assert.deepEqual(sandbox.external(), []);
});

test("a non-executable file is skipped and an executable later in PATH wins", posixOnly, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("which");
	const inert = join(sandbox.root, "inert");
	mkdirSync(inert);
	const marker = markerLog(sandbox);
	chmodSync(writePi(inert, { label: "inert", marker }), 0o644);

	const result = sandbox.run(WEB_ACCESS, { env: { PATH: [inert, sandbox.bin].join(delimiter) } });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(readFileSync(marker, "utf8"), "", "a non-executable file must never run");
	assert.deepEqual(sandbox.external().map((record) => record.argv), [["install", "npm:pi-web-access"]]);

	const inertOnly = createCliSandbox(t);
	inertOnly.removeStub("which");
	const inertDir = join(inertOnly.root, "inert-only");
	mkdirSync(inertDir);
	const inertMarker = markerLog(inertOnly, "inert-pi-runs.log");
	chmodSync(writePi(inertDir, { label: "inert-only", marker: inertMarker }), 0o644);

	const absent = inertOnly.run(["install", "--local"], { env: { PATH: inertDir } });

	assert.equal(absent.status, 127, `STDOUT:\n${absent.stdout}\nSTDERR:\n${absent.stderr}`);
	assert.match(output(absent), /Could not find the `pi` command/);
	assert.equal(readFileSync(inertMarker, "utf8"), "", "a non-executable file must never run");
	assert.deepEqual(inertOnly.external(), []);
});

test("a symlink on PATH resolves to the file it names", posixOnly, (t) => {
	const sandbox = createCliSandbox(t);
	sandbox.removeStub("which");
	const links = join(sandbox.root, "links");
	mkdirSync(links);
	symlinkSync(join(sandbox.bin, "pi"), join(links, "pi"));

	const result = sandbox.run(WEB_ACCESS, { env: { PATH: links } });

	assert.equal(result.status, 0, `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
	assert.equal(result.stderr, "");
	assert.deepEqual(sandbox.external(), [{ command: "pi", argv: ["install", "npm:pi-web-access"], status: 0 }]);

	const dangling = createCliSandbox(t);
	dangling.removeStub("which");
	const danglingLinks = join(dangling.root, "links");
	const targets = join(dangling.root, "targets");
	mkdirSync(danglingLinks);
	mkdirSync(targets);
	const danglingMarker = markerLog(dangling, "dangling-pi-runs.log");
	chmodSync(writePi(targets, { label: "dangling-target", marker: danglingMarker }), 0o644);
	symlinkSync(join(targets, "pi"), join(danglingLinks, "pi"));

	const absent = dangling.run(["install", "--local"], { env: { PATH: danglingLinks } });

	assert.equal(absent.status, 127, `STDOUT:\n${absent.stdout}\nSTDERR:\n${absent.stderr}`);
	assert.match(output(absent), /Could not find the `pi` command/);
	assert.equal(readFileSync(danglingMarker, "utf8"), "", "a symlink to a non-executable file must not resolve");
	assert.deepEqual(dangling.external(), []);
});
