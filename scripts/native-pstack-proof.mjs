import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gunzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

export const CANONICAL = "f1571b8431034dcd195f4ea055ccf1c84fc14fc8";
export const ROLE_HASH = "bc3815ef60257540414371a480a53c4dbabe7097a94a17ecfd750e1acd798c33";
export const PROVIDER = "lazypi-native-proof";
export const MODEL = `${PROVIDER}/canary`;
const DEADLINES = { install: 600000, discovery: 60000, child: 60000, shutdown: 15000 };
export const PINS = { "@earendil-works/pi-coding-agent": "1.5.0", "pi-subagents": "0.86.0", "pi-better-sandbox": "0.14.1", "pi-verdict": "0.16.0", "pi-ask-user": "0.17.2" };
export const hash = value => createHash("sha256").update(value).digest("hex");
export function receipt(kind, data) {
	const bytes = Buffer.from(JSON.stringify(data));
	if (bytes.length > 16 * 1024 * 1024) throw new Error("evidence bound exceeded");
	const digest = hash(bytes);
	for (let offset = 0; offset < bytes.length; offset += 12000) {
		process.stdout.write(JSON.stringify({ kind, sha256: digest, bytes: bytes.length, offset, encoding: "base64", data: bytes.subarray(offset, offset + 12000).toString("base64") }) + "\n");
	}
}
export function privateEnvironment(root, node = process.execPath) {
	return { PATH: `${join(root, "prefix/bin")}:${dirname(node)}:/usr/bin:/bin`, HOME: join(root, "home"), USERPROFILE: join(root, "home"),
		PI_CODING_AGENT_DIR: join(root, "agent"), TMPDIR: join(root, "tmp"), XDG_CONFIG_HOME: join(root, "config"), XDG_CACHE_HOME: join(root, "cache"), XDG_DATA_HOME: join(root, "data"),
		NPM_CONFIG_PREFIX: join(root, "prefix"), NPM_CONFIG_CACHE: join(root, "npm-cache"), NPM_CONFIG_USERCONFIG: join(root, "npm-user.rc"), NPM_CONFIG_GLOBALCONFIG: join(root, "npm-global.rc"),
		NPM_CONFIG_ENGINE_STRICT: "true", NPM_CONFIG_FETCH_RETRIES: "0", NPM_CONFIG_AUDIT: "false", NPM_CONFIG_FUND: "false",
		GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: join(root, "gitconfig"), GIT_TERMINAL_PROMPT: "0", LANG: "C.UTF-8", CI: "1" };
}
// Keep a live, TERM-resistant group leader until escalation, even after the
// command exits. Its reserved PID/PGID prevents a delayed signal hitting a reused ID.
const GROUP_KEEPER = `
const {spawn}=require('node:child_process');
process.on('SIGTERM',()=>{});
const ipc=process.argv[3]==='ipc';
const command=spawn(process.argv[1],JSON.parse(process.argv[2]),{stdio:ipc?['ignore','inherit','inherit','ipc']:['ignore','inherit','inherit']});
if(ipc){process.on('message',m=>{if(command.connected)command.send(m)});command.on('message',m=>process.send(m));}
command.on('error',error=>process.send({ownedCommandExit:{code:1,signal:null,error:error.message}}));
command.on('close',(code,signal)=>process.send({ownedCommandExit:{code,signal}}));
process.on('disconnect',()=>process.kill(-process.pid,'SIGKILL'));
setInterval(()=>{},1000);
`;
function startOwned(command, args, { cwd, env, owned, ipc = false }) {
	const child = spawn(process.execPath, ["-e", GROUP_KEEPER, command, JSON.stringify(args), ipc ? "ipc" : "plain"], { cwd, env, detached: true, stdio: ["ignore", "pipe", "pipe", "ipc"] });
	owned.add(child); let exit, escalation, killed = false;
	function kill() {
		if (killed || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
		killed = true;
		try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
	}
	function stop() {
		if (killed || escalation || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
		try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
		escalation = setTimeout(kill, 500);
	}
	child.terminateOwned = kill;
	child.on("message", message => {
		if (message.ownedCommandExit) { exit = message.ownedCommandExit; child.emit("command-close", exit); stop(); }
	});
	const closed = new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code, signal) => { clearTimeout(escalation); owned.delete(child); resolve(exit ?? { code, signal }); });
	});
	child.ownedClosed = closed;
	return { child, closed, stop };
}
export async function runOwned(command, args, { cwd, env, timeoutMs, owned = new Set() }) {
	const group = startOwned(command, args, { cwd, env, owned });
	let stdout = "", stderr = "", timeout = false, overflow = false;
	const timer = setTimeout(() => { timeout = true; group.stop(); }, timeoutMs);
	group.child.once("command-close", () => clearTimeout(timer));
	for (const [stream, append] of [[group.child.stdout, text => stdout += text], [group.child.stderr, text => stderr += text]]) stream.on("data", data => {
		append(data.toString());
		if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 16 * 1024 * 1024 && !overflow) { overflow = true; group.stop(); }
	});
	try { const exit = await group.closed; return { ...exit, stdout, stderr, timeout, overflow }; }
	finally { clearTimeout(timer); }
}
export function configureProbeSettings(agentDir) {
	const file = join(agentDir, "settings.json");
	const settings = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : { packages: [] };
	settings.retry = { ...settings.retry, enabled: false, provider: { ...settings.retry?.provider, maxRetries: 0 } };
	writeFileSync(file, JSON.stringify(settings) + "\n", { mode: 0o600 });
}
function verifySRI(bytes, integrity) {
	const match = /^(sha512|sha384|sha256|sha1)-([A-Za-z0-9+/]+={0,2})$/.exec(integrity ?? "");
	requireFact(match && createHash(match[1]).update(bytes).digest("base64") === match[2], "archive integrity: SRI mismatch or unsupported digest");
}
function archiveIdentity(bytes) {
	const tar = gunzipSync(bytes, { maxOutputLength: 64 * 1024 * 1024 }); let manifest;
	for (let offset = 0; offset + 512 <= tar.length; ) {
		const header = tar.subarray(offset, offset + 512); if (header.every(b => b === 0)) break;
		const field = (start, length) => header.subarray(start, start + length).toString().replace(/\0.*$/s, "");
		const sizeText = field(124, 12).trim(), checksum = field(148, 8).trim();
		requireFact(/^[0-7]+$/.test(sizeText) && /^[0-7]+$/.test(checksum), "archive integrity: unsupported tar header");
		const size = parseInt(sizeText, 8), sum = header.reduce((n, b, i) => n + (i >= 148 && i < 156 ? 32 : b), 0);
		requireFact(sum === parseInt(checksum, 8) && offset + 512 + size <= tar.length, "archive integrity: invalid tar bounds or checksum");
		const type = field(156, 1), name = [field(345, 155), field(0, 100)].filter(Boolean).join("/");
		requireFact(!["x", "g", "L", "K"].includes(type), "archive integrity: unsupported extended tar header");
		if (name === "package/package.json") {
			requireFact(!manifest && ["", "0"].includes(type) && size <= 1024 * 1024, "archive integrity: ambiguous archive identity");
			manifest = JSON.parse(tar.subarray(offset + 512, offset + 512 + size));
		}
		offset += 512 + Math.ceil(size / 512) * 512;
	}
	requireFact(manifest?.name && manifest.version, "archive integrity: missing archive identity"); return manifest;
}
export async function verifyGlobalIntegrity(graph, cache, record = receipt) {
	try {
		const entries = Object.values(await cache.entries());
		requireFact(entries.length <= 20000, "archive integrity: cache inventory bound");
		let count = 0, total = 0; const verified = new Map();
		async function visit(dependencies) {
			for (const [edge, node] of Object.entries(dependencies ?? {})) {
				requireFact(++count <= 10000 && node.name === edge && typeof node.version === "string" && typeof node.path === "string" && /^https:\/\/registry\.npmjs\.org\/[^?#]+\.tgz$/.test(node.resolved), "archive integrity: unsupported alias, bundled, missing or unresolved node");
				const identity = JSON.stringify([node.name, node.version, node.resolved]);
				if (!verified.has(identity)) {
					const matches = entries.filter(e => e.metadata?.url === node.resolved);
					requireFact(matches.length === 1, "archive integrity: missing or ambiguous cache receipt");
					const entry = matches[0];
					requireFact(Number.isSafeInteger(entry.size) && entry.size > 0 && entry.size <= 16 * 1024 * 1024 && total + entry.size <= 32 * 1024 * 1024, "archive integrity: archive byte bound");
					const bytes = await cache.read(entry.key); total += bytes.length;
					requireFact(bytes.length === entry.size, "archive integrity: archive size mismatch"); verifySRI(bytes, entry.integrity);
					const manifest = archiveIdentity(bytes);
					requireFact(manifest.name === node.name && manifest.version === node.version, "archive integrity: wrong archive identity");
					verified.set(identity, { bytes, entry });
					for (let offset = 0; offset < bytes.length; offset += 12000) record("download-archive", { name: node.name, version: node.version, resolved: node.resolved, integrity: entry.integrity, bytes: bytes.length, offset, encoding: "base64", data: bytes.subarray(offset, offset + 12000).toString("base64") });
				}
				const { bytes, entry } = verified.get(identity);
				for (const sri of [node.integrity, node._integrity].filter(Boolean)) verifySRI(bytes, sri);
				record("download-integrity", { path: node.path, name: node.name, version: node.version, resolved: node.resolved, cacheKey: entry.key, integrity: entry.integrity, bytes: bytes.length, sha256: hash(bytes) });
				await visit(node.dependencies);
			}
		}
		await visit(graph?.dependencies); requireFact(count > 0, "archive integrity: empty global graph");
	} catch (error) { throw new Error(error.message.startsWith("archive integrity:") ? error.message : `archive integrity: ${error.message}`); }
}
function requireFact(ok, reason) { if (!ok) throw new Error(reason); }
const SDK_PEERS = new Set(["@earendil-works/pi-coding-agent", "@earendil-works/pi-tui", "typebox", "@sinclair/typebox"]);
// npm ls exits nonzero when peers resolve outside the audited tree, so the support
// graph is judged by content: every pin present at its exact version, and every
// reported problem about a peer the SDK provides rather than a real dependency.
// npm ls exits 1 when peers resolve outside the audited tree, so the inventory is
// allowed to exit 0 or 1 and its content is judged by validateSupportGraph.
export function supportInventoryCommand(prefixDir) {
	return { args: ["ls", "--prefix", prefixDir, "--all", "--json"], allowExit: [0, 1] };
}

export function validateSupportGraph(graph) {
	try {
		const expected = Object.entries(PINS).filter(([name]) => !name.startsWith("@earendil"));
		requireFact(graph && typeof graph === "object", "support graph: not an object");
		for (const [name, version] of expected) {
			const node = graph.dependencies?.[name];
			requireFact(node && node.version === version, `support graph: ${name} not pinned at ${version}`);
		}
		for (const problem of graph.problems ?? []) {
			const match = /^missing: (@?[^@]+)@/.exec(String(problem));
			requireFact(match && SDK_PEERS.has(match[1]), `support graph: unresolved dependency ${String(problem)}`);
		}
		return true;
	} catch (error) { throw new Error(error.message.startsWith("support graph:") ? error.message : `support graph: ${error.message}`); }
}

export function validateDiscovery(d) {
	requireFact(d?.sha === CANONICAL && d.treeClean === true, "canonical identity");
	const paths = d.role?.paths;
	requireFact(Array.isArray(paths) && paths.length === 1 && paths[0] === `${d.root}/agents/how-explorer.md` && d.policy?.shadowed === 0, "role origin");
	requireFact(d.role.hash === ROLE_HASH, "role hash");
	requireFact(d.schemas?.read?.type === "object" && d.schemas.read.properties?.path?.type === "string" && d.schemas.read.required?.includes("path") && d.schemas?.subagent?.type === "object" && d.schemas.subagent.properties?.action && d.schemas.subagent.properties?.agent, "tool schema");
	requireFact(d.skills?.length > 0 && d.skills.every(s => s.path.startsWith(`${d.root}/`) && /^[a-f0-9]{64}$/.test(s.hash)) && d.extensions?.length > 0, "resource origin");
	const p = d.policy;
	requireFact(p.provider === PROVIDER && p.api === "openai-completions" && /^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(p.baseUrl), "provider policy");
	requireFact(!d.role.modelDeclared && p.model === MODEL && p.inheritSkills === false && p.diagnostics?.length === 0 && /^[a-f0-9]{64}$/.test(p.digest) && p.tools?.includes("read") && p.extensions?.length === 0, "model policy");
}
export function validateChild(c, d, { identity, canary, canaryPath }) {
	const match = Object.entries(identity).every(([key, value]) => c?.[key] === value);
	const m = c?.metadata;
	const events = c?.events ?? [];
	const starts = events.filter(e => e.type === "tool_execution_start");
	const ends = events.filter(e => e.type === "tool_execution_end");
	const settles = events.filter(e => e.type === "agent_settled");
	const text = ends[0]?.result?.content?.filter(p => p.type === "text").map(p => p.text).join("\n");
	requireFact(match && c.status === "completed" && c.agent === "how-explorer" && c.exitCode === 0 && c.model === MODEL && c.launchContractDigest === d.policy.digest &&
		m?.runId === c.runId && m.parentSessionId === d.parentSessionId && m.agent === c.agent && m.exitCode === 0 && m.model === MODEL && m.launchContractDigest === c.launchContractDigest &&
		c.session?.id && c.session.parentSession === d.parentSessionFile &&
		starts.length === 1 && starts[0].toolName === "read" && starts[0].args?.path === canaryPath &&
		ends.length === 1 && ends[0].toolName === "read" && ends[0].toolCallId === starts[0].toolCallId && ends[0].isError === false && text?.includes(canary) &&
		settles.length === 1 && settles[0].aborted === false && events.indexOf(starts[0]) < events.indexOf(ends[0]) && events.indexOf(ends[0]) < events.indexOf(settles[0]) &&
		!events.some(e => ["auto_retry_start", "compaction_start"].includes(e.type)), "child evidence");
}
export async function runProof(transport, options) {
	const clock = options.clock ?? globalThis;
	async function phase(name, fn) {
		let timer;
		try { return await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = clock.setTimeout(() => reject(new Error(`${name} timeout`)), DEADLINES[name]); })]); }
		finally { clock.clearTimeout(timer); }
	}
	let outcome; let timedOut = false;
	try {
		await phase("install", async () => {
			const installation = await transport.install();
			if (installation) await verifyGlobalIntegrity(installation.graph, installation.cache, installation.record);
		});
		const discovery = await phase("discovery", () => transport.discover());
		validateDiscovery(discovery);
		const child = await phase("child", () => transport.child(options.identity));
		validateChild(child, discovery, options);
		outcome = { ok: true, scope: "discovery-and-one-foreground-child" };
	} catch (error) { outcome = { ok: false, reason: error.message }; timedOut = error.message.endsWith(" timeout"); }
	if (!timedOut) {
		try { const exit = await phase("shutdown", () => transport.shutdown()); requireFact(exit?.code === 0 && exit.signal === null, "controller exit"); }
		catch (error) { outcome = { ok: false, reason: error.message }; timedOut = true; }
	}
	if (timedOut) await transport.terminate();
	return outcome;
}

async function hosted() {
	const ref = "refs/heads/feat/strict-native-pstack-proof";
	requireFact(process.env.GITHUB_ACTIONS === "true" && process.env.GITHUB_EVENT_NAME === "workflow_dispatch" && process.env.GITHUB_REPOSITORY === "tommy-ca/LazyPi" && process.env.GITHUB_REF === ref && process.env.GITHUB_RUN_ATTEMPT === "1", "hosted envelope rejected");
	requireFact(process.version === "v22.19.0", "Node version mismatch");
	requireFact(process.env.GITHUB_WORKFLOW_REF === `tommy-ca/LazyPi/.github/workflows/test.yml@${ref}` && process.env.GITHUB_WORKFLOW_SHA === process.env.GITHUB_SHA, "workflow identity mismatch");
	const root = mkdtempSync(join(process.env.RUNNER_TEMP, "lazypi-native-"));
	const env = privateEnvironment(root);
	for (const path of ["home", "agent", "tmp", "config", "cache", "data", "npm-cache", "prefix", "work"]) mkdirSync(join(root, path), { mode: 0o700 });
	for (const path of ["npm-user.rc", "npm-global.rc", "gitconfig"]) writeFileSync(join(root, path), "", { mode: 0o600 });
	configureProbeSettings(join(root, "agent"));
	const owned = new Set();
	async function command(cmd, args, cwd = join(root, "work"), timeoutMs = 600000, allowExit = [0]) {
		receipt("spawn", { cmd, args, cwd, env });
		const result = await runOwned(cmd, args, { cwd, env, timeoutMs, owned }); receipt("close", result);
		requireFact(allowExit.includes(result.code) && !result.signal && !result.timeout && !result.overflow, "subprocess failed"); return result.stdout.trim();
	}
	const checkout = await command("git", ["rev-parse", "HEAD"], process.cwd(), 5000);
	requireFact(checkout === process.env.GITHUB_SHA, "checkout identity mismatch");
	receipt("workflow", { sha: checkout, tree: await command("git", ["rev-parse", "HEAD^{tree}"], process.cwd(), 5000), cwd: process.cwd(), workflow_ref: process.env.GITHUB_WORKFLOW_REF, workflow_sha: process.env.GITHUB_WORKFLOW_SHA, attempt: 1, root });
	const sdkRoot = join(root, "prefix/lib/node_modules/@earendil-works/pi-coding-agent");
	const pi = join(sdkRoot, "dist/cli.js");
	const npm = join(dirname(process.execPath), "npm");
	const canary = `canary-${randomUUID()}`; const canaryPath = join(root, "work/canary.txt");
	writeFileSync(canaryPath, canary, { mode: 0o600 });
	const identity = { requestId: randomUUID(), ownerRunId: randomUUID(), nodeId: "canary" };
	let controller, closed, send, wait;
	const transport = {
		async install() {
			const start = Date.now();
			// install keeps the shared time budget and refuses extra arguments, so a
			// caller cannot silently drop an option such as an allowed exit code.
			const install = (cmd, args, ...rest) => {
				requireFact(rest.length === 0, "install: unsupported extra arguments");
				return command(cmd, args, join(root, "work"), Math.max(1, 600000 - (Date.now() - start)));
			};
			receipt("versions", { node: process.version, npm: await install(npm, ["--version"]) });
			await install(npm, ["install", "--global", "@earendil-works/pi-coding-agent@1.5.0"]);
			for (const [name, version] of Object.entries(PINS).slice(1)) await install(process.execPath, [pi, "install", `npm:${name}@${version}`]);
			await install(process.execPath, [pi, "install", `git:github.com/tommy-ca/pstack@${CANONICAL}`]);
			for (const [name, version] of Object.entries(PINS)) {
				const base = name.startsWith("@earendil") ? sdkRoot : join(root, "agent/npm/node_modules", name);
				const pkg = JSON.parse(readFileSync(join(base, "package.json"), "utf8")); requireFact(pkg.version === version, "package version mismatch"); receipt("package", { path: base, name: pkg.name, version: pkg.version, engines: pkg.engines, hash: hash(readFileSync(join(base, "package.json"))) });
			}
			const graph = JSON.parse(await install(npm, ["ls", "--global", "--all", "--long", "--json"]));
			receipt("dependency-graph", graph);
			// npm ls reports satisfied out-of-tree peers as problems and exits 1, so the exit
		// code is not the signal here. validateSupportGraph judges the inventory.
		// npm ls exits 1 when peers resolve outside this tree, and install would drop
		// that allowance, so the inventory is invoked through command directly.
		const inventory = supportInventoryCommand(join(root, "agent/npm"));
		const supportGraph = JSON.parse(await command(npm, inventory.args, join(root, "work"), 600000, inventory.allowExit));
		validateSupportGraph(supportGraph); receipt("support-graph", supportGraph);
			for (const file of [join(root, "agent/npm/package-lock.json"), join(sdkRoot, "package.json")]) receipt("installed-file", { path: file, contents: readFileSync(file, "utf8") });
			// npm documents its opaque cache as cacache; use npm's own bundled API,
			// never reverse-engineer content paths, fetch missing entries, or install a helper.
			const npmRequire = createRequire(realpathSync(npm));
			const cacache = npmRequire("cacache"), cacheRoot = join(root, "npm-cache/_cacache");
			receipt("cache-reader", { npm: realpathSync(npm), module: npmRequire.resolve("cacache") });
			return { graph, cache: { entries: () => cacache.ls(cacheRoot), read: async key => (await cacache.get(cacheRoot, key, { memoize: false })).data } };
		},
		async discover() {
			const args = [fileURLToPath(new URL("./native-pstack-observer.mjs", import.meta.url)), "--controller", root, sdkRoot, canaryPath];
			receipt("spawn-controller", { command: process.execPath, args, cwd: join(root, "work"), env });
			const group = startOwned(process.execPath, args, { cwd: join(root, "work"), env, owned, ipc: true });
			controller = group.child;
			const pending = new Map(); let bytes = 0;
			wait = name => new Promise((resolve, reject) => pending.set(name, { resolve, reject }));
			send = (name, data) => controller.send({ name, data });
			controller.on("message", message => { if (message.ownedCommandExit) return; receipt("controller-message", message); const target = pending.get(message.name); if (target) { pending.delete(message.name); target.resolve(message.data); } });
			for (const [name, stream] of [["stdout", controller.stdout], ["stderr", controller.stderr]]) stream.on("data", data => { bytes += data.length; if (bytes > 16 * 1024 * 1024) { for (const p of pending.values()) p.reject(new Error("controller evidence bound")); } else receipt(`controller-${name}`, data.toString()); });
			closed = group.closed.then(value => { receipt("controller-close", value); for (const p of pending.values()) p.reject(new Error("controller closed before evidence")); return value; });
			return wait("discovery");
		},
		async child(id) { const result = wait("child"); send("child", id); return result; },
		async shutdown() { if (!controller) return { code: 0, signal: null }; send("shutdown"); return closed; },
		async terminate() { const groups = [...owned]; for (const child of groups) child.terminateOwned(); await Promise.all(groups.map(child => child.ownedClosed)); receipt("cleanup", { ownedRemaining: owned.size }); },
	};
	const result = await runProof(transport, { identity, canary, canaryPath }); receipt("verdict", result); process.exitCode = result.ok ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	if (process.argv.length === 3 && process.argv[2] === "--help") process.stdout.write("Usage: node scripts/native-pstack-proof.mjs --hosted\nOne hosted-only discovery and conditional foreground-child probe. No local native execution.\n");
	else if (process.argv.length === 3 && process.argv[2] === "--hosted") hosted().catch(error => { receipt("negative", { reason: error.message }); process.exitCode = 1; });
	else { process.stderr.write("Use --help or the authorized --hosted entry point.\n"); process.exitCode = 2; }
}
