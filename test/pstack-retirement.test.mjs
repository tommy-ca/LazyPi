import nodeTest from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Fixtures use POSIX executable launchers, never host Pi/npm.
const test = (name, fn) => nodeTest(name, { skip: process.platform === "win32" && "Fixture launchers require POSIX" }, fn);
const cli = resolve("bin/lazypi.mjs");
const identity = "git:github.com/tommy-ca/pstack";
const pinned = `${identity}@f1571b8431034dcd195f4ea055ccf1c84fc14fc8`;
const core = [pinned, "npm:pi-subagents", "npm:pi-better-sandbox", "npm:pi-verdict", "npm:pi-ask-user", "npm:pi-web-access"];
const hints = {
	pstack: "Canonical checkout registration only; native role binding and loading remain unverified.",
	subagents: "Run isolated sub-agents for parallel work.",
	sandbox: "Disabled until explicitly configured; registration is not containment.",
	verdict: "Permission gate with fail-closed classifier errors; configured exemptions and manual shell escapes are not classified.",
	"pi-ask-user": "Interactive user questions, single or 2-4 question batches; not hard approval.",
	"web-access": "Built-in web search and URL fetching.",
};

function installOutput(f, ids, sources, installed = 0, local = false) {
	return [
		`Target:            ${local ? "project (.pi/settings.json)" : `global (${f.settings})`}`,
		`Selected:          ${ids.length}/6`,
		`Already installed: ${installed}`,
		`Will install:      ${sources.length}`,
		"Pi credentials:    none detected",
		...sources.flatMap(source => ["", `→ pi install ${source}`]),
		"", "What you've got:",
		...ids.map(id => `  ${id.padEnd(20)} ${hints[id]}`),
		"", "Remove pi packages with `pi remove <source>`.",
		...(sources.length ? [] : ["Nothing to do — every selected package is already installed."]),
		"", sources.length ? `Installed ${sources.length} package(s) — next steps:` : "Next steps:",
		"Pi credentials: none detected.", "",
		"Run `pi`, then type `/login` inside Pi to sign in with a",
		"subscription (Claude Pro/Max, ChatGPT Plus/Pro, Copilot, Gemini)",
		"or set a provider env var (ANTHROPIC_API_KEY, OPENAI_API_KEY, …)",
		"before launching pi.", "",
	].join("\n");
}

const retired = ["pi-skillful", "mention-skill", "goal", "btw", "context-usage", "simplify", "fff", "dynamic-workflows", "ponytail", "lsp", "interactive-shell", "autoresearch", "todos", "memory"];
const builtins = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];

function fixture({ local = false, packages = [], overrides = true, missingPi = false } = {}) {
	const root = mkdtempSync(join(tmpdir(), "retirement-"));
	const dirs = Object.fromEntries(["home", "agent", "work", "bin", "tmp", "config", "cache", "data", "state"].map(n => [n, join(root, n)]));
	for (const dir of Object.values(dirs)) mkdirSync(dir);
	mkdirSync(join(dirs.work, ".pi"));
	const settings = join(local ? join(dirs.work, ".pi") : dirs.agent, "settings.json");
	const opposite = join(local ? dirs.agent : join(dirs.work, ".pi"), "settings.json");
	writeFileSync(opposite, '{"packages":["npm:opposite@1"],"keep":true}\n');
	const original = { packages, keep: { nested: [42, true] }, subagents: { agentOverrides: Object.fromEntries(builtins.map(n => [n, { model: overrides ? "" : "old-model", tools: ["read"] }])) } };
	writeFileSync(settings, JSON.stringify(original, null, 2) + "\n");
	writeFileSync(`${settings}.lazypi.fixture.bak`, "existing backup\n");
	const calls = join(root, "calls.jsonl");
	writeFileSync(calls, "");
	function executable(name, body) {
		const file = join(dirs.bin, name);
		writeFileSync(file, `#!${process.execPath}\n${body}`);
		chmodSync(file, 0o755);
	}
	executable("which", `if (!['pi','npm'].includes(process.argv[2])) process.exit(98);
if (${missingPi} && process.argv[2] === 'pi') process.exit(1);
console.log(${JSON.stringify(dirs.bin)}+'/'+process.argv[2]);`);
	executable("npm", `import { appendFileSync } from 'node:fs';
appendFileSync(${JSON.stringify(calls)}, JSON.stringify(['npm', ...process.argv.slice(2)])+'\\n');
console.error('Unexpected npm bootstrap'); process.exit(99);`);
	executable("pi", `import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
const a=process.argv.slice(2); appendFileSync(${JSON.stringify(calls)},JSON.stringify(a)+'\\n');
const file=${JSON.stringify(settings)}; const s=JSON.parse(readFileSync(file));
if(a[0]==='install') s.packages.push(a.at(-1));
else if(a[0]==='remove') s.packages=s.packages.filter(p=>(typeof p==='string'?p:p.source)!==a.at(-1));
else if(a[0]!=='update') process.exit(97);
if(a[0]!=='update') writeFileSync(file,JSON.stringify(s,null,2)+'\\n');`);
	const env = { PATH: dirs.bin, HOME: dirs.home, USERPROFILE: dirs.home, PI_CODING_AGENT_DIR: dirs.agent, TMPDIR: dirs.tmp, XDG_CONFIG_HOME: dirs.config, XDG_CACHE_HOME: dirs.cache, XDG_DATA_HOME: dirs.data, XDG_STATE_HOME: dirs.state };
	const snapshot = () => Object.fromEntries([dirs.agent, join(dirs.work, ".pi")].flatMap(dir => readdirSync(dir).sort().map(n => [join(dir,n), readFileSync(join(dir,n), "utf8")])));
	const before = snapshot();
	let count = 0;
	const run = args => {
		const command = [process.execPath, cli, ...args, ...(local ? ["--local"] : [])];
		const r = spawnSync(command[0], command.slice(1), { cwd: dirs.work, env, encoding: "utf8", timeout: 15_000 });
		const evidence = join(root, `run-${++count}`); mkdirSync(evidence);
		writeFileSync(join(evidence,"command.json"),JSON.stringify(command));
		for(const key of ["stdout","stderr"]) writeFileSync(join(evidence,`${key}.txt`),r[key] ?? "");
		writeFileSync(join(evidence,"exit.txt"),String(r.status));
		assert.equal(r.error, undefined);
		return r;
	};
	return { run, snapshot, before, settings, original, readCalls: () => readFileSync(calls,"utf8").split("\n").filter(Boolean).map(JSON.parse) };
}

for (const local of [false, true]) {
	test(`${local ? "local" : "global"} fresh default registers all six core sources and preserves retired state`, () => {
		const packages = [{ source: "npm:pi-btw@0.1.0", extensions: [], metadata: { owner: "fixture" } }, "npm:@quintinshaw/pi-dynamic-workflows@3", "npm:@zenspc/pi-pstack@1"];
		const f = fixture({ local, packages, overrides: false });
		const r = f.run(["install", "--yes"]);
		assert.equal(r.status, 0, r.stdout + r.stderr); assert.equal(r.stderr, "");
		assert.equal(r.stdout, installOutput(f, ["pstack", "subagents", "sandbox", "verdict", "pi-ask-user", "web-access"], core, 0, local));
		assert.deepEqual(f.readCalls(), core.map(s => ["install", ...(local ? ["-l", "--approve"] : []), s]));
		const after = JSON.parse(readFileSync(f.settings));
		assert.deepEqual(after, { ...f.original, packages: [...packages, ...core], subagents: { agentOverrides: Object.fromEntries(builtins.map(n => [n, { model: "", tools: ["read"] }])) } });
		const snapshot = f.snapshot();
		for (const [path, bytes] of Object.entries(f.before)) if(path !== f.settings) assert.equal(snapshot[path], bytes);
		const backups = Object.keys(snapshot).filter(p => !(p in f.before));
		assert.equal(backups.length, 1); assert.equal(snapshot[backups[0]], f.before[f.settings]);
	});

	test(`${local ? "local" : "global"} canonical pin remains installed without duplication or settings writes`, () => {
		const f = fixture({ local, packages: [{ source: `${identity}@older-audit`, skills: [], metadata: { keep: true } }, "npm:pi-subagents@0.86.0"] });
		const r = f.run(["install", "--yes", "--only", "pstack,subagents"]);
		assert.equal(r.status, 0, r.stdout + r.stderr); assert.equal(r.stderr, "");
		assert.equal(r.stdout, installOutput(f, ["pstack", "subagents"], [], 2, local));
		assert.deepEqual(f.readCalls(), []); assert.deepEqual(f.snapshot(), f.before);
	});
}

test("fresh canonical-only install uses the audited ref, not the identity or independent npm distribution", () => {
	const f = fixture({ packages: ["npm:@zenspc/pi-pstack@1"] });
	const r = f.run(["install", "--yes", "--only", "pstack"]);
	assert.equal(r.status, 0, r.stdout + r.stderr); assert.equal(r.stderr, "");
	assert.equal(r.stdout, installOutput(f, ["pstack"], [pinned]));
	assert.deepEqual(f.readCalls(), [["install", pinned]]);
	assert.deepEqual(JSON.parse(readFileSync(f.settings)), { ...f.original, packages: ["npm:@zenspc/pi-pstack@1", pinned] });
});

test("retired install selectors reject before any package command and leave settings and backups unchanged", () => {
	for (const id of retired) for (const flag of ["--only", "--except"]) {
		const f = fixture({ packages: ["npm:pi-btw@0.1.0"], missingPi: true });
		const r = f.run(["install", "--yes", flag, id]);
		assert.equal(r.status, 2, `${id}: ${r.stdout}${r.stderr}`); assert.equal(r.stdout, "");
		assert.equal(r.stderr, `Unknown ${flag}: ${id}\nValid categories: core, optional\nValid package ids: pstack, subagents, sandbox, verdict, pi-ask-user, web-access\n`);
		assert.deepEqual(f.readCalls(), []); assert.deepEqual(f.snapshot(), f.before);
	}
});

test("empty optional selector skips bootstrap and preserves settings, backups, and counters", () => {
	const f = fixture({ missingPi: true, packages: [{ source: "npm:pi-web-access@1", metadata: { keep: true } }] });
	const r = f.run(["install", "--yes", "--only", "optional"]);
	assert.equal(r.status, 0, r.stdout + r.stderr); assert.equal(r.stderr, "");
	assert.equal(r.stdout, "Nothing selected — nothing to install.\n");
	assert.deepEqual(f.readCalls(), []);
	assert.deepEqual(f.snapshot(), f.before);
});

test("web access remains individually selectable and preserves an existing pinned object", () => {
	const f = fixture({ packages: [{ source: "npm:pi-web-access@1", extensions: [], metadata: { keep: true } }] });
	const r = f.run(["install", "--yes", "--only", "web-access"]);
	assert.equal(r.status, 0, r.stdout + r.stderr); assert.equal(r.stderr, "");
	assert.equal(r.stdout, installOutput(f, ["web-access"], [], 1));
	assert.deepEqual(f.readCalls(), []);
	assert.deepEqual(f.snapshot(), f.before);
});

test("status classifies retired and independent registrations as Other without changing bytes", () => {
	const f = fixture({ packages: [`${identity}@old`, "npm:pi-btw@0.1.0", "npm:@zenspc/pi-pstack@1"] });
	const r = f.run(["status"]);
	assert.equal(r.status, 0); assert.equal(r.stderr, "");
	assert.equal(r.stdout, [
		`Settings file: ${f.settings}`, "",
		"Installed from LazyPi catalog (1/6):", "  core 1/6, optional 0/0",
		"  ✓ [core] pstack               git:github.com/tommy-ca/pstack@old", "",
		"Missing from LazyPi catalog (5):",
		"  · [core] subagents            npm:pi-subagents",
		"  · [core] sandbox              npm:pi-better-sandbox",
		"  · [core] verdict              npm:pi-verdict",
		"  · [core] pi-ask-user          npm:pi-ask-user",
		"  · [core] web-access           npm:pi-web-access", "",
		"Other Pi packages outside the LazyPi catalog (2):",
		"  · npm:pi-btw@0.1.0", "  · npm:@zenspc/pi-pstack@1", "",
	].join("\n"));
	assert.deepEqual(f.readCalls(), []); assert.deepEqual(f.snapshot(), f.before);
});

test("removal passthrough does not resolve retired IDs or legacy sources, and raw exact removal still works", () => {
	const f = fixture({ packages: [{ source: "npm:pi-btw@0.1.0", metadata: true }] });
	const bare = f.run(["remove", "btw"]);
	assert.equal(bare.status, 0); assert.equal(bare.stdout, ""); assert.equal(bare.stderr, "");
	assert.deepEqual(f.readCalls(), [["remove", "btw"]]); assert.deepEqual(f.snapshot(), f.before);
	const raw = f.run(["remove", "npm:pi-btw@0.1.0"]);
	assert.equal(raw.status, 0); assert.equal(raw.stdout, ""); assert.equal(raw.stderr, "");
	assert.deepEqual(f.readCalls(), [["remove", "btw"], ["remove", "npm:pi-btw@0.1.0"]]);
	assert.deepEqual(JSON.parse(readFileSync(f.settings)), { ...f.original, packages: [] });
});

test("unknown bare removal retains passthrough without settings changes", () => {
	const f = fixture({ packages: ["npm:unrelated@1"] });
	const r = f.run(["remove", "not-a-catalog-id"]);
	assert.equal(r.status, 0);
	assert.equal(r.stdout, "");
	assert.equal(r.stderr, "");
	assert.deepEqual(f.readCalls(), [["remove", "not-a-catalog-id"]]);
	assert.deepEqual(f.snapshot(), f.before);
});

test("already-installed subagents still resets all six builtin models and preserves extra keys", () => {
	const f = fixture({ packages: ["npm:pi-subagents@0.86.0"], overrides: false });
	const r = f.run(["install", "--yes", "--only", "subagents"]);
	assert.equal(r.status, 0);
	assert.equal(r.stderr, "");
	assert.equal(r.stdout, installOutput(f, ["subagents"], [], 1));
	assert.deepEqual(f.readCalls(), []);
	assert.deepEqual(JSON.parse(readFileSync(f.settings)), {
		...f.original,
		subagents: { agentOverrides: Object.fromEntries(builtins.map(n => [n, { model: "", tools: ["read"] }])) },
	});
	const after = f.snapshot();
	const backups = Object.keys(after).filter(p => !(p in f.before));
	assert.equal(backups.length, 1);
	assert.equal(after[backups[0]], f.before[f.settings]);
	for (const [path, bytes] of Object.entries(f.before)) if (path !== f.settings) assert.equal(after[path], bytes);
});

test("update remains broad and leaves registrations unchanged", () => {
	const f = fixture({ packages: ["npm:pi-btw@0.1.0", `${identity}@old`] });
	const r = f.run(["update"]);
	assert.equal(r.status, 0); assert.equal(r.stdout, "pi update\n"); assert.equal(r.stderr, "");
	assert.deepEqual(f.readCalls(), [["update"]]); assert.deepEqual(f.snapshot(), f.before);
});
