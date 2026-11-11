import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PACKAGES } from "../bin/lazypi.mjs";

const script = resolve("scripts/e2e-install.mjs");
const repo = resolve(".");
const forbidden = {
	OPENAI_API_KEY: "fixture-secret", SSH_AUTH_SOCK: "/fixture/socket", PI_OVERRIDE: "fixture",
	NODE_OPTIONS: "--no-warnings", npm_config_registry: "https://fixture.invalid",
	NPM_CONFIG_USERCONFIG: "/fixture/npmrc", NPM_TOKEN: "fixture-token", GH_TOKEN: "fixture-token",
	ANTHROPIC_API_KEY: "fixture-secret", PI_CODING_AGENT_DIR: "/fixture/agent",
	HTTPS_PROXY: "https://fixture.invalid", AWS_SESSION_TOKEN: "fixture-token",
};

function drive({ mode = "ok", keep = false, missingPi = false, args = [] } = {}) {
	const fixture = mkdtempSync(join(tmpdir(), "packed-fixture-"));
	const bin = join(fixture, "bin");
	const temp = join(fixture, "tmp");
	mkdirSync(bin); mkdirSync(temp);
	const log = join(fixture, "calls.jsonl");
	const packed = `import { mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
appendFileSync(${JSON.stringify(log)}, JSON.stringify({command:'packed',args:process.argv.slice(2),cwd:process.cwd(),env:process.env})+'\\n');
const file=join(process.env.PI_CODING_AGENT_DIR,'settings.json');
mkdirSync(process.env.PI_CODING_AGENT_DIR,{recursive:true});
let s; try { s=JSON.parse(readFileSync(file)); } catch { s={packages:[]}; }
const core=${JSON.stringify(PACKAGES.filter(p => p.category === "core").map(p => p.installSource ?? p.source))};
const optional=${JSON.stringify(PACKAGES.filter(p => p.category === "optional").map(p => p.installSource ?? p.source))};
const a=process.argv.slice(2);
if(${JSON.stringify(mode)}==='stage' && a[0]==='status') { console.error('fixture status failure'); process.exit(23); }
if(a[0]==='install') {
 if(a.includes('optional') && optional.length===0) { console.log('Nothing selected — nothing to install.'); process.exit(0); }
 const sources=a.includes('optional')?optional:a.includes('pstack')?[]:core;
 const fresh=sources.filter(p=>!s.packages.includes(p));
 s.packages.push(...fresh);
 s.subagents={agentOverrides:Object.fromEntries(['context-builder','planner','researcher','reviewer','scout','worker'].map(n=>[n,{model:''}]))};
 console.log(fresh.length?'Will install: '+fresh.length+'\\nInstalled '+fresh.length+' package(s)':'Nothing to do');
 if(a.includes('pstack')) process.exit(0);
} else if(a[0]==='status') {
 const reported=${JSON.stringify(mode)}==='wrong-header'?${PACKAGES.length - 1}:${PACKAGES.length};
 console.log('Installed from LazyPi catalog ('+reported+'/${PACKAGES.length})\\nnone — full catalog is installed');
 if(${JSON.stringify(mode)}==='bad-status') s.packages=[];
 if(${JSON.stringify(mode)}==='bad-overrides') delete s.subagents;
}
else if(a[0]==='remove') s.packages=s.packages.filter(p=>typeof p==='string');
else if(a[0]==='doctor') console.log('  ✓ Node 20.0.0\\n  ✓ npm is on PATH\\n  ✓ \u0060pi\u0060 is on PATH\\n  ✓ '+file+' is readable'+(${JSON.stringify(mode)}==='bad-doctor'?'\\n  ✗ npm is not on PATH\\n1 problem(s) found.':''));
else process.exit(91);
writeFileSync(file,JSON.stringify(s));`;
	const executable = (name, body) => writeFileSync(join(bin, name), `#!${process.execPath}\n${body}`, { mode: 0o755 });
	const prelude = `import * as fs from 'node:fs'; import path from 'node:path'; const a=process.argv.slice(2); fs.appendFileSync(${JSON.stringify(log)},JSON.stringify({command:path.basename(process.argv[1]),args:a,cwd:process.cwd(),env:process.env})+'\\n');`;
	executable("npm", `${prelude}
if(a[0]==='pack') {
 if(${JSON.stringify(mode)}==='pack') { console.error('fixture pack failure'); process.exit(21); }
 if(${JSON.stringify(mode)}==='bad-pack') { console.log('../fixture.tgz'); process.exit(0); }
 const i=a.indexOf('--pack-destination'); const dest=i<0?${JSON.stringify(temp)}:a[i+1];
 fs.writeFileSync(path.join(dest,'fixture.tgz'),'fake tarball'); console.log(i<0?path.join(dest,'fixture.tgz'):'fixture.tgz');
} else if(a[0]==='install' && a[1]==='--omit=dev') {
 if(${JSON.stringify(mode)}==='install') { console.error('fixture install failure'); process.exit(22); }
 const target=path.join(process.cwd(),'node_modules','@tommy-ca','lazypi','bin'); fs.mkdirSync(target,{recursive:true});
 fs.writeFileSync(path.join(target,'lazypi.mjs'),${JSON.stringify(packed)});
} else { console.error('unexpected npm command'); process.exit(90); }`);
	if (!missingPi) executable("pi", `${prelude}
if(a.join(' ')==='--version') { console.log('fixture Pi'); process.exit(${mode === "pi" ? 24 : 0}); }
if(!['install','remove'].includes(a[0]) || a.length!==2) process.exit(90);
const file=path.join(process.env.PI_CODING_AGENT_DIR,'settings.json'); const s=JSON.parse(fs.readFileSync(file));
if(a[0]==='remove') s.packages=s.packages.filter(p=>p!==a[1]); else s.packages.push(a[1]);
fs.writeFileSync(file,JSON.stringify(s));`);
	const result = spawnSync(process.execPath, [script, ...(keep ? ["--keep"] : []), ...args], {
		cwd: repo, env: { PATH: bin, HOME: join(fixture, "ambient-home"), TMPDIR: temp, ...forbidden },
		encoding: "utf8", timeout: 15_000,
	});
	writeFileSync(join(fixture, "command.json"), JSON.stringify([process.execPath, script, ...(keep ? ["--keep"] : []), ...args]));
	writeFileSync(join(fixture, "stdout.txt"), result.stdout ?? "");
	writeFileSync(join(fixture, "stderr.txt"), result.stderr ?? "");
	writeFileSync(join(fixture, "exit.txt"), String(result.status));
	assert.equal(result.error, undefined);
	const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").map(JSON.parse) : [];
	return { ...result, calls, fixture, temp };
}

const posix = { skip: process.platform === "win32" ? "Fixture launchers require POSIX" : false };

// `check()` counts a pass as soon as its body returns, so a body that asserts
// nothing reports a pass. Two such bodies reached a live e2e run and were
// counted, so the shape is read from the script here instead of trusted.
function checkCallBodies(source) {
	const bodies = [];
	for (const match of source.matchAll(/\bcheck\(\s*[`"]/g)) {
		const arrow = source.indexOf("=> {", match.index);
		assert.notEqual(arrow, -1, `check() call without an arrow body: ${source.slice(match.index, match.index + 60)}`);
		const open = arrow + "=> ".length;
		let depth = 0;
		let close = -1;
		for (let i = open; i < source.length; i++) {
			if (source[i] === "{") depth++;
			else if (source[i] === "}" && --depth === 0) { close = i; break; }
		}
		assert.notEqual(close, -1, "unbalanced check() body");
		bodies.push({ start: open + 1, end: close, source: source.slice(open + 1, close) });
	}
	return bodies;
}

const nonAssertingBodies = (source) => checkCallBodies(source).filter((body) => !/\bassert\./.test(body.source));

test("packed verification uses private state and an allowlisted environment for every command", posix, () => {
	const r = drive();
	assert.equal(r.status, 0, r.stderr);
	assert.equal(r.stderr, "");
	assert.match(r.stdout, /\nE2E PASS: 8 checks\n$/);
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.equal(r.calls[0].command, "pi");
	assert.deepEqual(r.calls[0].args, ["--version"]);
	assert.deepEqual(r.calls.filter(c => c.command === "npm").map(c => c.args), [
		["pack", repo, "--silent", "--pack-destination", root],
		["install", "--omit=dev", join(root, "fixture.tgz")],
	]);
	assert.deepEqual(r.calls.filter(c => c.command === "packed").map(c => c.args), [
		["install", "--yes"], ["install", "--yes", "--only", "optional"], ["install", "--yes"],
		["status"], ["install", "--yes", "--only", "pstack"], ["remove", "pstack", "npm:pi-btw@0.1.0"], ["doctor"],
	]);
	assert.deepEqual(r.calls.filter(c => c.command === "pi").map(c => c.args), [
		["--version"],
	]);
	for (const c of r.calls) {
		assert.equal(c.cwd, root);
		for (const key of Object.keys(forbidden).filter(k => !["NPM_CONFIG_USERCONFIG", "PI_CODING_AGENT_DIR"].includes(k))) assert.equal(c.env[key], undefined, key);
		const privateKeys = ["HOME", "USERPROFILE", "XDG_CONFIG_HOME", "XDG_DATA_HOME", "XDG_CACHE_HOME", "XDG_STATE_HOME", "XDG_RUNTIME_DIR", "TMPDIR", "TMP", "TEMP", "PI_CODING_AGENT_DIR", "NPM_CONFIG_CACHE", "NPM_CONFIG_USERCONFIG", "NPM_CONFIG_GLOBALCONFIG"];
		assert.deepEqual(Object.keys(c.env).sort(), ["PATH", ...privateKeys].sort());
		for (const key of privateKeys) {
			assert.ok(c.env[key]?.startsWith(`${root}/`), `${key}: ${c.env[key]}`);
		}
	}
	assert.equal(existsSync(root), false);
	assert.deepEqual(readdirSync(r.temp), []);
	assert.equal(existsSync(join(repo, "fixture.tgz")), false);
});

for (const mode of ["pack", "install"]) for (const keep of [false, true]) {
	test(`${mode} setup failure ${keep ? "keeps" : "cleans"} private state`, posix, () => {
		const r = drive({ mode, keep });
		assert.equal(r.status, 1);
		const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
		assert.equal(r.stderr.split("\n")[1], `E2E FAIL: npm ${mode === "pack" ? "pack" : "install packed tarball"} failed: fixture ${mode} failure`);
		assert.equal(r.stdout, `sandbox: ${root}\n\n${keep ? `kept sandbox: ${root}\n` : ""}`);
		assert.equal(existsSync(root), keep);
		assert.equal(existsSync(join(repo, "fixture.tgz")), false);
		assert.equal(r.calls.some(c => c.command === "packed"), false);
	});
}

test("missing Pi fails before npm or packed installation", posix, () => {
	const r = drive({ missingPi: true });
	assert.equal(r.status, 1);
	assert.equal(r.stderr.split("\n")[1], "E2E FAIL: Pi executable required on PATH before packed verification");
	assert.deepEqual(r.calls, []);
	assert.deepEqual(readdirSync(r.temp), []);
});

for (const [mode, message] of [
	["pi", "Pi executable required on PATH before packed verification: "],
	["bad-pack", "npm pack returned an invalid tarball filename"],
	["stage", "Expected values to be strictly equal:"],
]) test(`rejected ${mode} result cleans private state`, posix, () => {
	const r = drive({ mode });
	assert.equal(r.status, 1);
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.equal(r.stderr.split("\n")[1], `E2E FAIL: ${message}`);
	assert.equal(existsSync(root), false);
	assert.deepEqual(readdirSync(r.temp), []);
	if (mode === "pi") assert.deepEqual(r.calls.map(c => [c.command, ...c.args]), [["pi", "--version"]]);
	if (mode === "bad-pack") assert.deepEqual(r.calls.map(c => c.command), ["pi", "npm"]);
	if (mode === "stage") assert.deepEqual(r.calls.at(-1).args, ["status"]);
});

test("a status result that rewrites the catalog it reports fails the counted check", posix, () => {
	// The empty body this replaces counted as a pass, so a status run that wiped
	// the installed catalog while printing a full-catalog header reached E2E PASS.
	const r = drive({ mode: "bad-status" });
	assert.equal(r.status, 1, r.stdout);
	assert.doesNotMatch(r.stdout, /E2E PASS/);
	assert.match(r.stderr, /^E2E FAIL: Expected values to be strictly deep-equal:/m);
	assert.deepEqual(r.calls.at(-1).args, ["status"]);
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.equal(existsSync(root), false);
});

test("a doctor result that reports a problem fails the counted check", posix, () => {
	const r = drive({ mode: "bad-doctor" });
	assert.equal(r.status, 1, r.stdout);
	assert.doesNotMatch(r.stdout, /E2E PASS/);
	assert.match(r.stderr, /^E2E FAIL: The input was expected to not match the regular expression/m);
	assert.deepEqual(r.calls.at(-1).args, ["doctor"]);
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.equal(existsSync(root), false);
});

test("a status header that reports the wrong count fails the counted check", posix, () => {
	// The fixture prints the header the script matches, so without a mode that
	// prints a different count those banner regexes could never fail.
	const r = drive({ mode: "wrong-header" });
	assert.equal(r.status, 1, r.stdout);
	assert.doesNotMatch(r.stdout, /E2E PASS/);
	assert.match(r.stderr, /^E2E FAIL: The input did not match the regular expression/m);
	assert.deepEqual(r.calls.at(-1).args, ["status"]);
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.equal(existsSync(root), false);
});

test("a status result that drops the subagent overrides fails the counted check", posix, () => {
	// Reading back `packages` alone let a status run delete the six overrides the
	// install wrote and still reach E2E PASS.
	const r = drive({ mode: "bad-overrides" });
	assert.equal(r.status, 1, r.stdout);
	assert.doesNotMatch(r.stdout, /E2E PASS/);
	assert.match(r.stderr, /^E2E FAIL: Expected values to be strictly deep-equal:/m);
	assert.deepEqual(r.calls.at(-1).args, ["status"]);
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.equal(existsSync(root), false);
});

test("every counted e2e check body asserts, so an empty body cannot report a pass", () => {
	const source = readFileSync(script, "utf8");
	assert.equal(checkCallBodies(source).length, 8, "the eight counted checks drive the E2E PASS count");
	assert.deepEqual(nonAssertingBodies(source), [], "a check body that asserts nothing still prints a pass");
	assert.doesNotMatch(source, /check\(\s*[`"][^`"]*[`"]\s*,\s*\(\)\s*=>\s*\{\s*\}/, "the empty check body form must not come back");
});

test("the counted-check guard fails on a planted empty body", () => {
	// Planting the defect in a copy of the real source proves the guard can fail;
	// a guard that only describes the current tree passes whatever it reads.
	const source = readFileSync(script, "utf8");
	const [first] = checkCallBodies(source);
	const planted = source.slice(0, first.start) + source.slice(first.end);
	assert.notEqual(planted, source, "planting must change the source");
	const offending = nonAssertingBodies(planted);
	assert.equal(offending.length, 1);
	assert.equal(offending[0].source.trim(), "");
});

test("catalog source derivation resolves a pin in the optional tier the way it does in core", () => {
	// Every catalog entry is core, so no live stage can put a pinned optional
	// package in front of the two derivations. The premise is asserted here: when
	// a pinned optional package appears, this test fails and asks for a live stage
	// instead of leaving the derivation pinned only by its source text.
	assert.deepEqual(
		PACKAGES.filter((p) => p.category === "optional"),
		[],
		"add a live stage for the pinned optional package instead of relying on this source-text pin",
	);
	const script = readFileSync("scripts/e2e-install.mjs", "utf8");
	assert.equal(script.match(/p\.installSource \?\? p\.source/g).length, 2, "the core and optional derivations must both resolve a pin");
	assert.doesNotMatch(script, /p\.category === "(?:core|optional)"\)\.map\(\(p\) => p\.source\)/, "a derivation that ignores installSource compares the wrong source");
});

test("kept successful run retains only private artifacts and settings", posix, () => {
	const r = drive({ keep: true });
	assert.equal(r.status, 0, r.stderr);
	assert.equal(r.stderr, "");
	const root = r.stdout.match(/^sandbox: (.+)\n/)[1];
	assert.ok(r.stdout.endsWith(`E2E PASS: 8 checks\nkept sandbox: ${root}\n`));
	assert.equal(existsSync(join(root, "fixture.tgz")), true);
	const settings = JSON.parse(readFileSync(join(root, "agent", "settings.json")));
	assert.deepEqual(settings.packages, PACKAGES.filter(p => p.id !== "pstack").map(p => p.source));
});
