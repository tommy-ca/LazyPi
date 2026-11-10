import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { fork, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { privateEnvironment, runOwned, runProof, supportInventoryCommand, validateSupportGraph } from "../scripts/native-pstack-proof.mjs";

// Fixture evidence lives outside the checkout and is removed when this test
// process exits. The previous in-checkout tree was never cleaned up and reached
// 1.2 GB; growth is now bounded by a single run.
const scratch = mkdtempSync(join(tmpdir(), "lazypi-native-proof-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));
const script = resolve("scripts/native-pstack-proof.mjs");
const pin = "f1571b8431034dcd195f4ea055ccf1c84fc14fc8";
const roleHash = "bc3815ef60257540414371a480a53c4dbabe7097a94a17ecfd750e1acd798c33";
function discovery() {
	return { sha: pin, treeClean: true, root: "/private/canonical", role: { paths: ["/private/canonical/agents/how-explorer.md"], hash: roleHash, modelDeclared: false },
		skills: [{ path: "/private/canonical/skills/how/SKILL.md", hash: "a".repeat(64) }],
		extensions: [{ path: "/private/subagents/bundle/index.js", hash: "b".repeat(64) }],
		schemas: { read: { type: "object", properties: { path: { type: "string" } }, required: ["path"] }, subagent: { type: "object", properties: { action: { type: "string" }, agent: { type: "string" } } } },
		policy: { model: "lazypi-native-proof/canary", provider: "lazypi-native-proof", api: "openai-completions", baseUrl: "http://127.0.0.1:1234/v1", inheritSkills: false, shadowed: 0, diagnostics: [], digest: "c".repeat(64), tools: ["read"], extensions: [] },
		parentSessionId: "parent", parentSessionFile: "/private/parent.jsonl" };
}
function child() {
	return { requestId: "request", ownerRunId: "owner", nodeId: "canary", runId: "run", agent: "how-explorer", status: "completed", exitCode: 0,
		model: "lazypi-native-proof/canary", launchContractDigest: "c".repeat(64),
		metadata: { runId: "run", parentSessionId: "parent", agent: "how-explorer", exitCode: 0, model: "lazypi-native-proof/canary", launchContractDigest: "c".repeat(64) },
		session: { id: "child", parentSession: "/private/parent.jsonl" },
		events: [{ type: "tool_execution_start", toolName: "read", toolCallId: "read1", args: { path: "/private/canary" } }, { type: "tool_execution_end", toolName: "read", toolCallId: "read1", isError: false, result: { content: [{ type: "text", text: "PRIVATE-CANARY" }] } }, { type: "agent_settled", aborted: false }] };
}
function drive(t, change = {}) {
	const root = mkdtempSync(join(scratch, "fixture-"));
	const input = { discovery: discovery(), child: child(), ...change };
	const file = join(root, "input.json");
	writeFileSync(file, JSON.stringify(input));
	writeFileSync(join(root, "backup"), "unchanged");
	const runner = join(root, "runner.mjs");
	writeFileSync(runner, `import { runProof } from ${JSON.stringify(new URL(`file://${script}`).href)};
import { readFileSync } from 'node:fs';
const input = JSON.parse(readFileSync(${JSON.stringify(file)}, 'utf8'));
let children = 0; const effects = [];
let phaseNumber = 0;
const timeoutAt = {install:1,discovery:2,child:3,shutdown:4}[input.timeout];
const clock = input.timeout ? { setTimeout(fn) { if (++phaseNumber === timeoutAt) queueMicrotask(fn); return phaseNumber; }, clearTimeout() {} } : undefined;
const pending = () => new Promise(() => {});
const transport = {
 install: async () => { effects.push('install'); if(input.timeout === 'install') return pending(); },
 discover: async () => { effects.push('discover'); if(input.timeout === 'discovery') return pending(); return input.discovery; },
 child: async () => { children++; effects.push('child'); if(input.timeout === 'child') return pending(); return input.child; },
 shutdown: async () => { effects.push('shutdown'); if(input.timeout === 'shutdown') return pending(); return {code:0,signal:null}; },
 terminate: async () => { effects.push('terminate-owned'); }
};
const result = await runProof(transport, { canary: 'PRIVATE-CANARY', canaryPath: '/private/canary', identity: {requestId:'request',ownerRunId:'owner',nodeId:'canary'}, clock });
process.stdout.write(JSON.stringify({ ...result, children, effects }) + '\\n'); process.exitCode = result.ok ? 0 : 1;
`);
	const before = readFileSync(file, "utf8");
	const result = spawnSync(process.execPath, [runner], { encoding: "utf8", timeout: 5000, env: { PATH: "/usr/bin:/bin", HOME: root } });
	assert.equal(result.error, undefined);
	assert.equal(result.stderr, "");
	assert.equal(readFileSync(file, "utf8"), before);
	assert.equal(readFileSync(join(root, "backup"), "utf8"), "unchanged");
	return { ...result, value: JSON.parse(result.stdout) };
}

test("help is offline and names the hosted-only boundary", () => {
	const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8", timeout: 5000 });
	assert.equal(result.status, 0); assert.equal(result.stderr, "");
	assert.match(result.stdout, /hosted-only/);
});
for (const [name, mutate, reason] of [
	["wrong canonical SHA", d => d.sha = "0".repeat(40), "canonical identity"],
	["dirty canonical tree", d => d.treeClean = false, "canonical identity"],
	["missing role origin", d => d.role.paths = [], "role origin"],
	["duplicate role origin", d => d.role.paths.push(d.role.paths[0]), "role origin"],
	["unsupported role origin", d => d.role.paths = ["runtime:how-explorer"], "role origin"],
	["wrong role hash", d => d.role.hash = "0".repeat(64), "role hash"],
	["declared canonical model", d => d.role.modelDeclared = true, "model policy"],
	["missing read schema", d => delete d.schemas.read, "tool schema"],
	["unparseable schema", d => d.schemas.subagent = {}, "tool schema"],
	["wrong provider", d => d.policy.provider = "openai", "provider policy"],
	["wrong model", d => d.policy.model = "openai/production", "model policy"],
	["non-loopback endpoint", d => d.policy.baseUrl = "https://example.com", "provider policy"],
	["inherited canonical skills", d => d.policy.inheritSkills = true, "model policy"],
	["shadowed origin", d => d.policy.shadowed = 1, "role origin"],
	["unsupported preflight diagnostic", d => d.policy.diagnostics = [{ code: "host_required" }], "model policy"],
	["missing canonical skill", d => d.skills = [], "resource origin"],
]) test(`${name} rejects before any child and preserves inputs`, t => {
	const d = discovery(); mutate(d); const r = drive(t, { discovery: d });
	assert.equal(r.status, 1); assert.deepEqual(r.value, { ok: false, reason, children: 0, effects: ["install", "discover", "shutdown"] });
});
for (const [name, mutate] of [
	["text alone", c => c.events = [{ type: "agent_settled" }]],
	["wrong canary", c => c.events[1].result.content[0].text = "WRONG"],
	["wrong request identity", c => c.requestId = "other"],
	["wrong run identity", c => c.metadata.runId = "other"],
	["wrong session identity", c => c.session.parentSession = "/other"],
	["missing settled watermark", c => c.events.pop()],
	["aborted settled watermark", c => c.events[2].aborted = true],
	["abnormal child exit", c => c.exitCode = 1],
	["unexpected extra tool", c => c.events.unshift({ type: "tool_execution_start", toolName: "bash" })],
	["wrong read identity", c => c.events[1].toolCallId = "other"],
]) test(`${name} cannot certify the child`, t => {
	const c = child(); mutate(c); const r = drive(t, { child: c });
	assert.equal(r.status, 1); assert.deepEqual(r.value, { ok: false, reason: "child evidence", children: 1, effects: ["install", "discover", "child", "shutdown"] });
});
test("correlated read, canary, settled and normal exit produce only a scoped fixture result", t => {
	const r = drive(t); assert.equal(r.status, 0);
	assert.deepEqual(r.value, { ok: true, scope: "discovery-and-one-foreground-child", children: 1, effects: ["install", "discover", "child", "shutdown"] });
});
for (const phase of ["install", "discovery", "child", "shutdown"]) test(`${phase} timeout terminates only owned work without retry`, t => {
	const r = drive(t, { timeout: phase });
	assert.equal(r.status, 1); assert.equal(r.value.reason, `${phase} timeout`);
	assert.equal(r.value.effects.filter(x => x === "terminate-owned").length, 1);
	assert.equal(r.value.effects.filter(x => x === "install").length, 1);
	assert.equal(r.value.children, ["child", "shutdown"].includes(phase) ? 1 : 0);
});

test("hosted entry rejects a local invocation before installing or touching state", () => {
	const r = spawnSync(process.execPath, [script, "--hosted"], { encoding: "utf8", timeout: 5000, env: { PATH: "/usr/bin:/bin" } });
	assert.equal(r.status, 1); assert.equal(r.stderr, "");
	const records = r.stdout.trim().split("\n").map(JSON.parse);
	assert.equal(records.length, 1); assert.equal(records[0].kind, "negative");
	assert.equal(Buffer.from(records[0].data, "base64").toString(), '{"reason":"hosted envelope rejected"}');
});

test("probe-owned HTTP transport emits one read and refuses an extra request", async () => {
	const { startProvider } = await import("../scripts/native-pstack-provider.mjs");
	const records = [];
	const provider = await startProvider({ canaryPath: "/private/canary", canary: "PRIVATE-CANARY", record: (kind, data) => records.push({ kind, data }) });
	const send = body => fetch(`${provider.baseUrl}/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: "canary", stream: true, messages: [], tools: [], ...body }) });
	try {
		for (const name of ["subagents_enable", "subagent", "subagent"]) {
			const r = await send({ tools: [{ function: { name } }] }); assert.equal(r.status, 200); assert.match(await r.text(), /tool_calls/);
		}
		assert.equal((await send({})).status, 200); provider.child();
		const read = await send({ tools: [{ function: { name: "read" } }] }); assert.equal(read.status, 200);
		assert.match(await read.text(), /"name":"read"/);
		const result = await send({ messages: [{ role: "tool", content: "PRIVATE-CANARY" }] }); assert.equal(result.status, 200); await result.text();
		const extra = await send({}); assert.equal(extra.status, 400);
		assert.deepEqual(await extra.json(), { error: { message: "extra child request" } });
		assert.throws(() => provider.check(), /extra child request/);
		assert.equal(records.filter(r => r.kind === "provider-response" && r.data.phase === "child").length, 2);
	} finally { await provider.close(); }
});

test("owned finite process timeout is recorded and does not retry", async () => {
	const { runOwned } = await import("../scripts/native-pstack-proof.mjs");
	const root = mkdtempSync(join(scratch, "process-timeout-"));
	const r = await runOwned(process.execPath, ["-e", "process.stdout.write('started\\\\n');setInterval(()=>{},1000)"], { cwd: root, env: { PATH: "/usr/bin:/bin" }, timeoutMs: 200 });
	assert.equal(r.stdout, "started\\n"); assert.equal(r.stderr, ""); assert.equal(r.timeout, true); assert.equal(r.signal, "SIGTERM"); assert.equal(r.code, null);
});

test("owned process receives exact argv and private allowlisted environment", async () => {
	const { privateEnvironment, runOwned } = await import(new URL(`file://${script}`));
	const root = mkdtempSync(join(scratch, "env-"));
	const env = privateEnvironment(root, process.execPath);
	const r = await runOwned(process.execPath, ["-e", "process.stdout.write(JSON.stringify({argv:process.argv.slice(1),env:process.env,cwd:process.cwd()}))", "literal argument"], { cwd: root, env, timeoutMs: 1000 });
	assert.equal(r.code, 0); assert.equal(r.stderr, "");
	const got = JSON.parse(r.stdout); assert.deepEqual(got.argv, ["literal argument"]); assert.equal(got.cwd, root);
	assert.equal(got.env.HOME, join(root, "home")); assert.equal(got.env.PI_CODING_AGENT_DIR, join(root, "agent"));
	assert.equal(got.env.NPM_CONFIG_USERCONFIG, join(root, "npm-user.rc")); assert.equal(got.env.NPM_CONFIG_GLOBALCONFIG, join(root, "npm-global.rc"));
	assert.deepEqual(Object.keys(got.env).sort(), Object.keys(env).sort());
	for (const name of ["GITHUB_TOKEN", "GH_TOKEN", "NPM_TOKEN", "NODE_AUTH_TOKEN", "ACTIONS_ID_TOKEN_REQUEST_TOKEN", "SSH_AUTH_SOCK", "OPENAI_API_KEY", "NODE_OPTIONS"]) assert.equal(got.env[name], undefined);
});

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
for (const name of ["observer", "provider"]) test(`${name} rejects unknown arguments without changing input`, () => {
	const root = mkdtempSync(join(scratch, "argv-"));
	const file = join(root, "settings.json"); writeFileSync(file, '{"packages":[]}\n');
	const before = digest(readFileSync(file));
	const r = spawnSync(process.execPath, [resolve(`scripts/native-pstack-${name}.mjs`), "--typo"], { cwd: root, env: privateEnvironment(root), encoding: "utf8", timeout: 3000 });
	assert.equal(r.error, undefined); assert.equal(digest(readFileSync(file)), before);
	assert.equal(r.status, 2); assert.equal(r.stdout, ""); assert.equal(r.stderr, "Use --help for this internal probe entry point.\n");
});
test("observer help does not run the imported provider entry point", () => {
	const r = spawnSync(process.execPath, [resolve("scripts/native-pstack-observer.mjs"), "--help"], { encoding: "utf8", timeout: 3000 });
	assert.equal(r.status, 0); assert.equal(r.stderr, "");
	assert.equal(r.stdout, "Probe-owned native observer. --controller ROOT SDK_ROOT CANARY is an IPC-only internal entry point, never a local verification command.\n");
});
test("imports ignore caller arguments and produce no output", () => {
	for (const arg of ["--help", "--typo"]) {
		const r = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(new URL("../scripts/native-pstack-observer.mjs", import.meta.url).href)});await import(${JSON.stringify(new URL("../scripts/native-pstack-provider.mjs", import.meta.url).href)});`, "--", "fixture", arg], { encoding: "utf8", timeout: 3000 });
		assert.equal(r.status, 0); assert.equal(r.stdout, ""); assert.equal(r.stderr, "");
	}
});
test("timeout kills a same-group descendant that ignores SIGTERM", { skip: process.platform === "win32" }, async () => {
	const root = mkdtempSync(join(scratch, "descendant-"));
	const heartbeat = join(root, "heartbeat"), stop = join(root, "stop");
	const code = `process.on('SIGTERM',()=>{});let n=0;setInterval(()=>{const fs=require('node:fs');if(fs.existsSync(process.argv[2]))process.exit(0);fs.writeFileSync(process.argv[1],String(++n))},40)`;
	const leader = `require('node:child_process').spawn(process.execPath,['-e',${JSON.stringify(code)},${JSON.stringify(heartbeat)},${JSON.stringify(stop)}],{stdio:'ignore'});setInterval(()=>{},1000)`;
	try {
		const owned = new Set();
		const r = await runOwned(process.execPath, ["-e", leader], { cwd: root, env: privateEnvironment(root), timeoutMs: 500, owned });
		writeFileSync(join(root, "timeout-receipt.json"), JSON.stringify(r));
		assert.equal(r.timeout, true); assert.equal(r.code, null); assert.equal(r.signal, "SIGTERM"); assert.equal(r.stdout, ""); assert.equal(r.stderr, "");
		await new Promise(resolve => setTimeout(resolve, 800)); const before = readFileSync(heartbeat, "utf8");
		await new Promise(resolve => setTimeout(resolve, 160)); assert.equal(readFileSync(heartbeat, "utf8"), before, "descendant still executing after escalation");
		assert.equal(owned.size, 0);
	} finally { writeFileSync(stop, "stop only this fixture's descendant"); }
});

// Owned gzip/ustar data, not downloaded packages or a precomputed runtime receipt.
function archive(name, version) {
	const body = Buffer.from(JSON.stringify({ name, version })); const header = Buffer.alloc(512);
	header.write("package/package.json"); header.write("0000644\0", 100); header.write(body.length.toString(8).padStart(11, "0") + "\0", 124);
	header.fill(32, 148, 156); header.write("0", 156); header.write("ustar\0", 257);
	const sum = header.reduce((a, b) => a + b, 0); header.write(sum.toString(8).padStart(6, "0") + "\0 ", 148);
	return gzipSync(Buffer.concat([header, body, Buffer.alloc((512 - body.length % 512) % 512 + 1024)]));
}
for (const mode of ["complete", "missing", "corrupt", "wrong-identity", "ambiguous", "alias", "bundled"]) test(`archive closure ${mode} through install lifecycle preserves input`, async () => {
	const root = mkdtempSync(join(scratch, "integrity-"));
	const graph = { dependencies: { example: { name: "example", version: "1.0.0", path: "/private/global/node_modules/example", resolved: "https://registry.npmjs.org/example/-/example-1.0.0.tgz", dependencies: { leaf: { name: "leaf", version: "2.0.0", path: "/private/global/node_modules/leaf", resolved: "https://registry.npmjs.org/leaf/-/leaf-2.0.0.tgz" } } } } };
	const entries = {};
	for (const [name, version] of [["example", "1.0.0"], ["leaf", "2.0.0"]]) {
		const bytes = archive(name === "leaf" && mode === "wrong-identity" ? "wrong" : name, version);
		const sri = "sha512-" + createHash("sha512").update(bytes).digest("base64");
		entries[name] = { key: name, integrity: sri, size: bytes.length, metadata: { url: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz` } };
		writeFileSync(join(root, name), mode === "corrupt" && name === "leaf" ? Buffer.from("corrupt") : bytes);
	}
	if (mode === "missing") delete entries.leaf;
	if (mode === "ambiguous") entries.other = { ...entries.leaf, key: "other" };
	if (mode === "alias") graph.dependencies.example.dependencies.alias = graph.dependencies.example.dependencies.leaf;
	if (mode === "bundled") delete graph.dependencies.example.dependencies.leaf.resolved;
	writeFileSync(join(root, "graph.json"), JSON.stringify(graph)); writeFileSync(join(root, "index.json"), JSON.stringify(entries));
	const inputs = ["graph.json", "index.json", "example", "leaf"].map(f => [f, digest(readFileSync(join(root, f)))]);
	let children = 0, discoveries = 0, installs = 0; const records = [];
	const result = await runProof({
		async install() { installs++; return { graph: JSON.parse(readFileSync(join(root, "graph.json"))), cache: { async entries() { return JSON.parse(readFileSync(join(root, "index.json"))); }, async read(key) { return readFileSync(join(root, key)); } }, record: (kind, data) => records.push({ kind, data }) }; },
		async discover() { discoveries++; return discovery(); }, async child() { children++; return child(); }, async shutdown() { return { code: 0, signal: null }; }, async terminate() { assert.fail("no fixture timeout"); },
	}, { identity: { requestId: "request", ownerRunId: "owner", nodeId: "canary" }, canary: "PRIVATE-CANARY", canaryPath: "/private/canary" });
	assert.deepEqual(inputs, inputs.map(([f]) => [f, digest(readFileSync(join(root, f)))])); assert.equal(installs, 1);
	if (mode === "complete") {
		assert.equal(result.ok, true); assert.equal(children, 1); assert.equal(discoveries, 1);
		assert.equal(records.filter(r => r.kind === "download-integrity").length, 2);
		for (const name of ["example", "leaf"]) {
			const record = records.find(r => r.kind === "download-integrity" && r.data.name === name).data;
			assert.equal(record.resolved, entries[name].metadata.url); assert.equal(record.integrity, entries[name].integrity);
			const chunks = records.filter(r => r.kind === "download-archive" && r.data.name === name);
			assert.deepEqual(Buffer.concat(chunks.map(r => Buffer.from(r.data.data, "base64"))), readFileSync(join(root, name)));
		}
	} else { assert.equal(result.ok, false); assert.match(result.reason, /^archive integrity:/); assert.equal(children, 0); assert.equal(discoveries, 0); }
});

// Adapted verifier handoff: only this test's locally authored fake SDK is imported.
async function observeFixture(mode) {
	const evidence = mkdtempSync(join(scratch, "observer-")), root = join(evidence, "fake-observer");
	for (const p of ["home", "agent", "work", "tmp", "prefix/bin", "sdk/dist", "agent/sessions", "agent/git/github.com/tommy-ca/pstack/agents", "agent/git/github.com/tommy-ca/pstack/skills/how"]) mkdirSync(join(root, p), { recursive: true });
	const canonical = join(root, "agent/git/github.com/tommy-ca/pstack");
	const role = "---\nname: how-explorer\ndescription: pstack how explorer. Same posture as the pstack role of this name. Shipped effort is frontmatter `effort`. Setup may overlay per-role values using the overlay path the active host declares in `profiles/<host>.json`.\neffort: medium\ncapabilityMode: execute\ninheritSkills: false\n---\n\n# How Explorer\n\nYou are a read-only child. Do not edit files. Do not commit. Do not open a PR. Search, read, and run shell commands as needed. Follow the parent prompt.\n";
	writeFileSync(join(canonical, "agents/how-explorer.md"), role); writeFileSync(join(canonical, "skills/how/SKILL.md"), "owned fixture skill");
	writeFileSync(join(root, "work/canary.txt"), "PRIVATE-CANARY"); writeFileSync(join(root, "agent/settings.json"), '{"packages":["unchanged-fixture-source"]}');
	for (const name of ["pi-subagents", "pi-better-sandbox", "pi-verdict", "pi-ask-user"]) {
		const p = join(root, "agent/npm/node_modules", name); mkdirSync(join(p, "bundle"), { recursive: true }); writeFileSync(join(p, "package.json"), '{"type":"module"}'); writeFileSync(join(p, "bundle/index.js"), "// owned placeholder, never imported");
	}
	writeFileSync(join(root, "sdk/package.json"), '{"type":"module"}');
	writeFileSync(join(root, "prefix/bin/git"), `#!/usr/bin/env node
const a=process.argv.slice(2).join(' ');process.stdout.write(a==='rev-parse HEAD'?'${pin}\\n':a==='rev-parse HEAD^{tree}'?'${"a".repeat(40)}\\n':a==='ls-files -z'?'agents/how-explorer.md\\0skills/how/SKILL.md\\0':'');`, { mode: 0o755 });
	writeFileSync(join(root, "sdk/dist/index.js"), `
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {join} from 'node:path';import {createServer} from 'node:http';
const root=${JSON.stringify(root)},canonical=${JSON.stringify(canonical)},mode=${JSON.stringify(mode)},provider='lazypi-native-proof';let api,ctx,baseUrl,subscriber,aborted=false,cancelled=false;
const handlers=new Map(),bus=new Map();
export class SettingsManager {static create(){const s=JSON.parse(readFileSync(join(root,'agent/settings.json')));writeFileSync(join(root,'settings-consumed.json'),JSON.stringify(s));return {getRetryEnabled:()=>s.retry?.enabled??true,getRetrySettings:()=>({enabled:s.retry?.enabled??true,maxRetries:s.retry?.maxRetries??3}),getProviderRetrySettings:()=>({maxRetries:s.retry?.provider?.maxRetries})};}}
export class ModelRuntime {static async create(){baseUrl=JSON.parse(readFileSync(join(root,'agent/models.json'))).providers[provider].baseUrl;return {getModel(){return {provider,id:'canary',api:'openai-completions',baseUrl}}};}}
export class SessionManager {static create(){return {};}}
export class DefaultResourceLoader {
constructor(o){this.o=o;}
async reload(){api={on(n,fn){handlers.set(n,fn)},events:{on(n,fn){let a=bus.get(n)??[];a.push(fn);bus.set(n,a);return ()=>bus.set(n,a.filter(x=>x!==fn))},emit(n,v){if(n==='cancel'){cancelled=true;return;}if(n!=='request')return;
writeFileSync(join(root,'dispatch-count'),'1');const inherited=SettingsManager.create();writeFileSync(join(root,'child-settings.json'),JSON.stringify({retry:inherited.getRetrySettings(),provider:inherited.getProviderRetrySettings()}));
if(mode==='child-retry'){for(const fn of bus.get('update')??[])fn({...v,providerDiagnostics:{retry:{phase:'backoff',attempt:1}}});queueMicrotask(()=>writeFileSync(join(root,'child-extra-attempt'),cancelled?'0':'1'));return;}
const dir=join(root,'agent/sessions/subagent-artifacts');mkdirSync(dir,{recursive:true});
const stem=join(dir,'run_how-explorer_'+(mode==='wrong-index'?'1':'0'));const meta={runId:mode==='wrong-run'?'other':'run',parentSessionId:'parent',agent:'how-explorer',exitCode:0,model:'lazypi-native-proof/canary',launchContractDigest:'${"c".repeat(64)}'};
writeFileSync(stem+'_meta.json',JSON.stringify(meta));if(mode==='duplicate'){const other=join(root,'tmp/other');mkdirSync(other,{recursive:true});writeFileSync(join(other,'run_how-explorer_0_meta.json'),JSON.stringify(meta));}
writeFileSync(stem+'.jsonl',[{type:'tool_execution_start',toolName:'read',toolCallId:'read1',args:{path:join(root,'work/canary.txt')}},{type:'tool_execution_end',toolName:'read',toolCallId:'read1',isError:false,result:{content:[{type:'text',text:'PRIVATE-CANARY'}]}},{type:'agent_settled',aborted:false}].map(JSON.stringify).join('\\n')+'\\n');
writeFileSync(join(root,'agent/sessions/child.jsonl'),JSON.stringify({type:'session',id:'child',parentSession:join(root,'agent/sessions/parent.jsonl')})+'\\n');
const finish=()=>{for(const fn of bus.get('response')??[])fn({...v,runId:'run',status:'completed',agent:'how-explorer',exitCode:0,model:'lazypi-native-proof/canary',launchContractDigest:'${"c".repeat(64)}'});};
(async()=>{const canary=readFileSync(join(root,'work/canary.txt'),'utf8');const send=b=>fetch(baseUrl+'/chat/completions',{method:'POST',body:JSON.stringify(b)}).then(r=>r.text());
await send({model:'canary',stream:true,messages:[{role:'user',content:'child run'}],tools:[{function:{name:'read'}}]});
await send({model:'canary',stream:true,messages:[{role:'user',content:'child run'},{role:'tool',content:canary}],tools:[{function:{name:'read'}}]});
finish();})().catch(()=>finish());
}}};this.o.extensionFactories[0](api);}
getExtensions(){return {errors:[],extensions:['pi-subagents','pi-better-sandbox','pi-verdict','pi-ask-user'].map(n=>({resolvedPath:join(root,'agent/npm/node_modules',n,'bundle/index.js'),sourceInfo:{source:'npm'}}))};}
getSkills(){return {skills:[{filePath:join(canonical,'skills/how/SKILL.md')}],diagnostics:[]};}getPrompts(){return [];}getAgentsFiles(){return {agentsFiles:[]};}}
export async function createAgentSession(o){const model={provider,id:'canary',api:'openai-completions',baseUrl};ctx={model,modelRegistry:{getAvailable:()=>[model]},sessionManager:{getSessionId:()=> 'parent',getSessionFile:()=>join(root,'agent/sessions/parent.jsonl'),getLeafId:()=> 'leaf'},isProjectTrusted:()=>false};
const session={resourceLoader:o.resourceLoader,subscribe(fn){subscriber=fn;},async bindExtensions(){handlers.get('session_start')({},ctx)},messages:[],getAllTools(){return [{name:'read',sourceInfo:{path:'builtin:read'},parameters:{type:'object',properties:{path:{type:'string'}},required:['path']}},{name:'subagent',sourceInfo:{path:join(root,'agent/npm/node_modules/pi-subagents/bundle/index.js')},parameters:{type:'object',properties:{action:{type:'string'},agent:{type:'string'}}}}]},async prompt(){
if(mode==='retryable-error'){let requests=0;const server=createServer((q,r)=>{requests++;r.writeHead(503);r.end('fixture transient error');});await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const settings=o.settingsManager;const attempts=settings.getRetrySettings().enabled?2:1;const httpAttempts=settings.getProviderRetrySettings().maxRetries===0?1:2;for(let a=0;a<attempts;a++)for(let b=0;b<httpAttempts;b++){const r=await fetch('http://127.0.0.1:'+server.address().port);await r.text();}}finally{server.closeAllConnections();await new Promise(r=>server.close(r));writeFileSync(join(root,'request-count'),String(requests));}throw new Error('fixture retryable 503');}
if(mode==='unexpected-retry'){subscriber({type:'auto_retry_start'});await Promise.resolve();writeFileSync(join(root,'request-count'),aborted?'0':'1');if(aborted)throw new Error('fixture retry aborted');}
for(const name of ['subagents_enable','subagent','subagent',null]){const response=await fetch(baseUrl+'/chat/completions',{method:'POST',body:JSON.stringify({model:'canary',stream:true,messages:[],tools:name?[{function:{name}}]:[]})});if(response.status!==200)throw new Error('own fixture transcript');await response.text();}
this.messages=[{role:'toolResult',toolName:'subagents_enable'},{role:'toolResult',toolName:'subagent',content:[{type:'text',text:'how-explorer'}]},{role:'toolResult',toolName:'subagent',content:[{type:'text',text:'Path: '+join(canonical,'agents/how-explorer.md')}]}];},abortRetry(){aborted=true;},async abort(){aborted=true;},extensionRunner:{async emit(){}},dispose(){}};return {session};}
`);
	writeFileSync(join(root, "agent/npm/node_modules/pi-subagents/bundle/preflight.js"), `export async function resolveSubagentLaunchContract(){return {ok:true,contract:{model:'lazypi-native-proof/canary',inheritSkills:false,agent:{shadowedCandidates:[]},diagnostics:[],launchContractDigest:'${"c".repeat(64)}',tools:{effectiveAllowlist:['read'],runtimeExtensions:[],configuredExtensions:[]}}};}`);
	writeFileSync(join(root, "agent/npm/node_modules/pi-subagents/bundle/delegation.js"), "export const SUBAGENT_DELEGATION_REQUEST_EVENT='request',SUBAGENT_DELEGATION_RESPONSE_EVENT='response',SUBAGENT_DELEGATION_STARTED_EVENT='started',SUBAGENT_DELEGATION_UPDATE_EVENT='update',SUBAGENT_DELEGATION_CANCEL_EVENT='cancel';");
	const before = [join(canonical, "agents/how-explorer.md"), join(root, "work/canary.txt")].map(p => [p, digest(readFileSync(p))]);
	const childProcess = fork(resolve("scripts/native-pstack-observer.mjs"), ["--controller", root, join(root, "sdk"), join(root, "work/canary.txt")], { cwd: join(root, "work"), env: privateEnvironment(root), stdio: ["ignore", "pipe", "pipe", "ipc"] });
	let stdout = "", stderr = "", dispatched = 0, timedOut = false, childEvidence;
	childProcess.stdout.on("data", b => stdout += b); childProcess.stderr.on("data", b => stderr += b);
	const timer = setTimeout(() => { timedOut = true; childProcess.kill("SIGKILL"); }, 7000);
	childProcess.on("message", m => {
		if (m.name === "discovery") { dispatched++; childProcess.send({ name: "child", data: { requestId: "request", ownerRunId: "owner", nodeId: "canary" } }); }
		else if (m.name === "child") { childEvidence = m.data; childProcess.send({ name: "shutdown" }); }
	});
	const result = await new Promise(r => childProcess.on("close", (code, signal) => r({ code, signal }))); clearTimeout(timer);
	writeFileSync(join(evidence, "stdout.txt"), stdout); writeFileSync(join(evidence, "stderr.txt"), stderr); writeFileSync(join(evidence, "exit.json"), JSON.stringify(result));
	assert.equal(timedOut, false); assert.equal(stderr, ""); assert.deepEqual(before, before.map(([p]) => [p, digest(readFileSync(p))]));
	const negatives = stdout.trim().split("\n").filter(Boolean).map(JSON.parse).filter(r => r.kind === "negative").map(r => JSON.parse(Buffer.from(r.data, "base64").toString()));
	return { root, result, negatives, dispatched, childEvidence };
}
for (const mode of ["valid", "wrong-index", "duplicate", "wrong-run"]) test(`observer indexed artifacts ${mode}`, async () => {
	const r = await observeFixture(mode); assert.equal(r.dispatched, 1);
	if (mode === "valid") {
		assert.deepEqual(r.result, { code: 0, signal: null }); assert.deepEqual(r.negatives, []); assert.equal(r.childEvidence.metadata.runId, "run");
		const settings = JSON.parse(readFileSync(join(r.root, "settings-consumed.json")));
		assert.deepEqual(settings.packages, ["unchanged-fixture-source"]); assert.equal(settings.retry.enabled, false); assert.equal(settings.retry.provider.maxRetries, 0);
		assert.deepEqual(JSON.parse(readFileSync(join(r.root, "child-settings.json"))), { retry: { enabled: false, maxRetries: 3 }, provider: { maxRetries: 0 } });
	} else {
		// The exact reason pins that the mode reached its artifact check. A gate that
		// rejects earlier for an unrelated reason would otherwise pass this branch.
		const reasons = { "wrong-index": "missing or duplicate child metadata", duplicate: "missing or duplicate child metadata", "wrong-run": "child evidence" };
		assert.deepEqual(r.result, { code: 1, signal: null }); assert.equal(r.childEvidence, undefined);
		assert.deepEqual(r.negatives, [{ reason: reasons[mode] }]);
	}
});
test("private retry settings produce one request on a retryable fixture failure", async () => {
	const r = await observeFixture("retryable-error"); assert.equal(r.result.code, 1); assert.equal(r.dispatched, 0);
	assert.equal(readFileSync(join(r.root, "request-count"), "utf8"), "1"); assert.deepEqual(r.negatives, [{ reason: "fixture retryable 503" }]);
});
test("unexpected parent retry is aborted before another fixture attempt", async () => {
	const r = await observeFixture("unexpected-retry"); assert.equal(r.result.code, 1); assert.equal(r.dispatched, 0);
	assert.equal(readFileSync(join(r.root, "request-count"), "utf8"), "0"); assert.equal(r.negatives.length, 1);
});
test("unexpected child retry is cancelled before another fixture attempt", async () => {
	const r = await observeFixture("child-retry"); assert.equal(r.result.code, 1); assert.equal(r.dispatched, 1);
	assert.equal(readFileSync(join(r.root, "child-extra-attempt"), "utf8"), "0"); assert.equal(r.negatives.length, 1);
});

// Support-graph inventory: npm ls exits 1 when peers resolve outside the private
// agent tree, which is the expected layout. Only genuinely unresolved entries fail.
const supportPins = { "pi-subagents": "0.86.0", "pi-better-sandbox": "0.14.1", "pi-verdict": "0.16.0", "pi-ask-user": "0.17.2" };
const pinnedDeps = () => Object.fromEntries(Object.entries(supportPins).map(([name, version]) => [name, { version }]));
const peerProblem = name => `missing: ${name}, required by pi-ask-user@0.17.2`;
test("support graph accepts peers provided by the SDK prefix", () => {
	const graph = { name: "pi-extensions", problems: [peerProblem("@earendil-works/pi-coding-agent@>=0.74.0"), peerProblem("@earendil-works/pi-tui@>=0.74.0"), peerProblem("@sinclair/typebox@*")], dependencies: pinnedDeps() };
	assert.equal(validateSupportGraph(graph), true);
});
test("support graph rejects a missing pinned package", () => {
	const graph = { name: "pi-extensions", problems: [], dependencies: { "pi-subagents": { version: "0.86.0" } } };
	assert.throws(() => validateSupportGraph(graph), /support graph/);
});
test("support graph rejects an unresolved non-peer dependency", () => {
	const graph = { name: "pi-extensions", problems: ["missing: proper-lockfile@^4.1.2, required by pi-better-sandbox@0.14.1"], dependencies: pinnedDeps() };
	assert.throws(() => validateSupportGraph(graph), /support graph/);
});
test("support graph rejects a pinned version that changed", () => {
	const graph = { name: "pi-extensions", problems: [], dependencies: { ...pinnedDeps(), "pi-verdict": { version: "0.16.1" } } };
	assert.throws(() => validateSupportGraph(graph), /support graph/);
});

// The allowance for the support inventory is a value, not a call detail hidden in
// argument forwarding, so removing it fails a test instead of a hosted run.
test("support inventory command carries its allowed exit codes", () => {
	const inventory = supportInventoryCommand("/private/agent/npm");
	assert.deepEqual(inventory.allowExit, [0, 1]);
	assert.deepEqual(inventory.args, ["ls", "--prefix", "/private/agent/npm", "--all", "--json"]);
});
test("support inventory allowance rejects an ordinary failure code", () => {
	const inventory = supportInventoryCommand("/private/agent/npm");
	assert.equal(inventory.allowExit.includes(0), true);
	assert.equal(inventory.allowExit.includes(1), true);
	assert.equal(inventory.allowExit.includes(2), false);
});
test("recorded hosted inventory passes the support gate", () => {
	const recorded = JSON.parse(readFileSync("test/fixtures/native-pstack-hosted-support-graph.json", "utf8"));
	assert.equal(recorded.problems.length, 6);
	assert.equal(validateSupportGraph(recorded), true);
	assert.throws(() => validateSupportGraph({ ...recorded, dependencies: { ...recorded.dependencies, "pi-verdict": { version: "0.15.0" } } }), /support graph/);
});

// A child that never contacts the provider must not count as a completed child
// transcript. Artifacts alone can be produced without any provider round trip.
const post = (baseUrl, body) => fetch(`${baseUrl}/chat/completions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(r => r.text());
const chat = messages => ({ model: "canary", stream: true, messages, tools: [{ type: "function", function: { name: "read" } }, { type: "function", function: { name: "subagent" } }, { type: "function", function: { name: "subagents_enable" } }] });
// The provider serves three discovery tool calls and then one closing completion.
const discover = async baseUrl => { for (let i = 0; i < 4; i += 1) await post(baseUrl, chat([{ role: "user", content: `step ${i}` }])); };
test("provider check rejects a child that never contacted the provider", async () => {
	const { startProvider } = await import("../scripts/native-pstack-provider.mjs");
	const provider = await startProvider({ canaryPath: "/nonexistent/canary.txt", canary: "canary-test", record: () => {} });
	try {
		await discover(provider.baseUrl);
		provider.child();
		assert.throws(() => provider.check(), /child provider transcript incomplete/);
	} finally { await provider.close(); }
});
test("provider check accepts a completed child transcript", async () => {
	const { startProvider } = await import("../scripts/native-pstack-provider.mjs");
	const provider = await startProvider({ canaryPath: "/nonexistent/canary.txt", canary: "canary-test", record: () => {} });
	try {
		await discover(provider.baseUrl);
		provider.child();
		await post(provider.baseUrl, chat([{ role: "user", content: "begin" }]));
		await post(provider.baseUrl, chat([{ role: "user", content: "begin" }, { role: "assistant", content: null, tool_calls: [{ id: "probe-child-0", type: "function", function: { name: "read", arguments: "{}" } }] }, { role: "tool", tool_call_id: "probe-child-0", content: "canary-test" }]));
		assert.equal(provider.check(), undefined);
	} finally { await provider.close(); }
});
test("provider check rejects a child transcript missing its canary tool result", async () => {
	const { startProvider } = await import("../scripts/native-pstack-provider.mjs");
	const provider = await startProvider({ canaryPath: "/nonexistent/canary.txt", canary: "canary-test", record: () => {} });
	try {
		await discover(provider.baseUrl);
		provider.child();
		await post(provider.baseUrl, chat([{ role: "user", content: "begin" }]));
		await post(provider.baseUrl, chat([{ role: "user", content: "begin" }, { role: "tool", tool_call_id: "probe-child-0", content: "no canary here" }]));
		assert.throws(() => provider.check(), /provider missing canary tool result/);
	} finally { await provider.close(); }
});
