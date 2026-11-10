import { existsSync, readFileSync, realpathSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { CANONICAL, MODEL, PROVIDER, ROLE_HASH, configureProbeSettings, hash, receipt, runOwned, validateChild, validateDiscovery } from "./native-pstack-proof.mjs";
import { startProvider } from "./native-pstack-provider.mjs";

function assert(ok, reason) { if (!ok) throw new Error(reason); }
function text(result) { return result?.content?.filter(p => p.type === "text").map(p => p.text).join("\n") ?? ""; }
function files(root) {
	const found = []; let visited = 0;
	function walk(dir) {
		for (const item of readdirSync(dir, { withFileTypes: true })) {
			assert(++visited < 20000, "artifact inventory bound");
			const path = join(dir, item.name);
			if (item.isSymbolicLink()) continue;
			if (item.isDirectory()) walk(path); else if (item.isFile()) found.push(path);
		}
	}
	if (existsSync(root)) walk(root); return found;
}
function boundedRead(path) { assert(statSync(path).size <= 4 * 1024 * 1024, "artifact byte bound"); return readFileSync(path, "utf8"); }

async function controller(root, sdkRoot, canaryPath) {
	assert(process.send && resolve(process.env.PI_CODING_AGENT_DIR) === join(root, "agent") && resolve(process.env.HOME) === join(root, "home"), "private controller envelope");
	for (const key of Object.keys(process.env)) assert(!/^(GITHUB|GH_|ACTIONS|NPM_TOKEN|NODE_AUTH|SSH_|OPENAI_API_KEY|ANTHROPIC_API_KEY|NODE_OPTIONS)/.test(key), "credential environment rejected");
	const provider = await startProvider({ canaryPath, canary: boundedRead(canaryPath) });
	const agentDir = join(root, "agent"), cwd = join(root, "work");
	writeFileSync(join(agentDir, "models.json"), JSON.stringify({ providers: { [PROVIDER]: { baseUrl: provider.baseUrl, api: "openai-completions", apiKey: "probe-dummy-key", models: [{ id: "canary", name: "Private canary transcript", reasoning: false, input: ["text"], cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 2048 }] } } }), { mode: 0o600 });
	writeFileSync(join(agentDir, "auth.json"), "{}", { mode: 0o600 });
	let session, api, context, failed, dispatches = 0;
	async function finish() {
		if (session) { await session.abort(); await session.extensionRunner.emit({ type: "session_shutdown", reason: "quit" }); session.dispose(); }
		await provider.close(); process.disconnect();
	}
	try {
		configureProbeSettings(agentDir);
		// Native code is imported only here, in the outer driver's sanitized process.
		const sdk = await import(pathToFileURL(join(sdkRoot, "dist/index.js")).href);
		const settingsManager = sdk.SettingsManager.create(cwd, agentDir);
		assert(settingsManager.getRetryEnabled() === false && settingsManager.getProviderRetrySettings().maxRetries === 0, "private no-retry settings not consumed");
		receipt("retry-settings", { agent: settingsManager.getRetrySettings(), provider: settingsManager.getProviderRetrySettings() });
		const loader = new sdk.DefaultResourceLoader({ cwd, agentDir, settingsManager, extensionFactories: [pi => {
			api = pi;
			pi.on("session_start", (_event, ctx) => { context = ctx; });
			pi.on("ui_prompt_start", () => { failed = "interactive gate unsupported"; });
			pi.on("tool_call", event => {
				const allowed = event.toolName === "subagents_enable" && Object.keys(event.input).length === 0 || event.toolName === "subagent" && ["list", "get"].includes(event.input.action) && !event.input.task && !event.input.workflow;
				if (!allowed) { failed = "unexpected parent tool"; return { block: true, terminate: true, reason: failed }; }
			});
			pi.on("before_provider_request", (_event, ctx) => { if (failed) throw new Error(failed); if (ctx.model?.provider !== PROVIDER || ctx.model?.id !== "canary") { failed = "unexpected provider routing"; throw new Error(failed); } });
		}] });
		await loader.reload();
		const runtime = await sdk.ModelRuntime.create({ authPath: join(agentDir, "auth.json"), modelsPath: join(agentDir, "models.json"), modelsStorePath: join(agentDir, "models-store.json"), allowModelNetwork: false });
		const model = runtime.getModel(PROVIDER, "canary"); assert(model?.baseUrl === provider.baseUrl && model.api === "openai-completions", "private provider unavailable");
		({ session } = await sdk.createAgentSession({ cwd, agentDir, resourceLoader: loader, settingsManager, modelRuntime: runtime, model, sessionManager: sdk.SessionManager.create(cwd, join(agentDir, "sessions")) }));
		session.subscribe(event => {
			if (event.type !== "message_update") receipt("parent-event", event);
			if (event.type === "auto_retry_start") {
				failed = "unexpected native retry";
				// Pi emits before creating its backoff AbortController. The microtask
				// cancels that controller after creation, before the next model attempt.
				queueMicrotask(() => { session.abortRetry(); void session.abort(); });
			}
		});
		await session.bindExtensions({ mode: "print", onError: error => { failed = `extension error: ${error.event}`; receipt("extension-error", error); } });
		assert(context && api && session.resourceLoader === loader, "same-session binding unavailable");
		const extensions = loader.getExtensions(); assert(extensions.errors.length === 0, "extension load failure");
		const extensionOrigins = extensions.extensions.map(e => ({ path: e.resolvedPath, sourceInfo: e.sourceInfo, hash: existsSync(e.resolvedPath) ? hash(readFileSync(e.resolvedPath)) : null }));
		receipt("resources", { extensions: extensionOrigins, skills: loader.getSkills(), prompts: loader.getPrompts(), agentsFiles: loader.getAgentsFiles().agentsFiles.map(f => ({ path: f.path, hash: hash(f.content) })) });
		await session.prompt("Run the fixed discovery transcript only. Enable subagents, list roles, get how-explorer, then stop. Do not launch any child.");
		provider.check(); assert(!failed, failed);
		const tools = session.getAllTools(); receipt("tool-schemas", tools);
		assert(tools.find(t => t.name === "read")?.sourceInfo?.path === "builtin:read", "read tool override unsupported");
		const subagentRoot = realpathSync(join(agentDir, "npm/node_modules/pi-subagents"));
		const subagentSource = tools.find(t => t.name === "subagent")?.sourceInfo?.path;
		assert(typeof subagentSource === "string" && realpathSync(subagentSource).startsWith(`${subagentRoot}/`), "subagent tool origin unsupported");
		for (const name of ["pi-subagents", "pi-better-sandbox", "pi-verdict", "pi-ask-user"]) {
			const packageRoot = realpathSync(join(agentDir, "npm/node_modules", name));
			assert(extensionOrigins.some(e => e.hash && e.path.startsWith(`${packageRoot}/`)), `required extension origin missing: ${name}`);
		}
		const results = session.messages.filter(m => m.role === "toolResult");
		assert(results.length === 3 && results.every(r => !r.isError) && results[0].toolName === "subagents_enable" && results[1].toolName === "subagent" && results[2].toolName === "subagent", "discovery tool result mismatch");
		receipt("role-list", results[1]); receipt("role-get", results[2]);
		const canonical = realpathSync(join(agentDir, "git/github.com/tommy-ca/pstack"));
		const git = async args => {
			const r = await runOwned("git", args, { cwd: canonical, env: process.env, timeoutMs: 5000 });
			assert(r.code === 0 && !r.signal && !r.timeout, "canonical git identity unavailable"); return r.stdout.trim();
		};
		const sha = await git(["rev-parse", "HEAD"]); const tree = await git(["rev-parse", "HEAD^{tree}"]); const status = await git(["status", "--porcelain"]);
		const tracked = new Set((await git(["ls-files", "-z"])).split("\0"));
		const paths = [...text(results[2]).matchAll(/^Path: (.+)$/gm)].map(m => m[1]);
		const rolePath = paths.length === 1 && paths[0] === join(canonical, "agents/how-explorer.md") && existsSync(paths[0]) ? realpathSync(paths[0]) : undefined;
		assert(!rolePath || rolePath === join(canonical, "agents/how-explorer.md") && tracked.has("agents/how-explorer.md"), "role escaped canonical checkout");
		const role = { paths: rolePath ? [rolePath] : paths, hash: rolePath ? hash(readFileSync(rolePath)) : null, modelDeclared: /^model\s*:/m.test(rolePath ? boundedRead(rolePath) : "") };
		const skills = loader.getSkills().skills.filter(s => s.filePath.startsWith(`${canonical}/`)).map(s => {
			const path = realpathSync(s.filePath); assert(path.startsWith(`${canonical}/`) && tracked.has(path.slice(canonical.length + 1)), "skill escaped canonical checkout");
			return { path, hash: hash(readFileSync(path)), sourceInfo: s.sourceInfo };
		});
		let preflight;
		if (sha === CANONICAL && status === "" && rolePath === join(canonical, "agents/how-explorer.md") && role.hash === ROLE_HASH) {
			const preflightModule = await import(pathToFileURL(join(agentDir, "npm/node_modules/pi-subagents/bundle/preflight.js")).href);
			preflight = await preflightModule.resolveSubagentLaunchContract({ agent: "how-explorer", task: `Read ${canaryPath} with read exactly once, then finish.`, context: "fresh", cwd, parentModel: context.model, availableModels: context.modelRegistry.getAvailable(), parentSessionId: context.sessionManager.getSessionId(), parentSessionFile: context.sessionManager.getSessionFile(), parentLeafId: context.sessionManager.getLeafId(), projectTrusted: context.isProjectTrusted(), runtimeSnapshotHost: api, artifacts: true });
		}
		receipt("preflight", preflight ?? { ok: false, reason: "origin not established" });
		const c = preflight?.ok ? preflight.contract : undefined;
		const available = context.modelRegistry.getAvailable(); assert(available.every(m => m.provider === PROVIDER), "unexpected authenticated provider");
		const discovery = { sha, tree, treeClean: status === "", root: canonical, role, skills, extensions: extensionOrigins.filter(e => e.hash), schemas: Object.fromEntries(tools.map(t => [t.name, t.parameters])),
			policy: { model: c?.model, provider: model.provider, api: model.api, baseUrl: model.baseUrl, inheritSkills: c?.inheritSkills, shadowed: c?.agent.shadowedCandidates.length, diagnostics: c?.diagnostics ?? ["preflight unavailable"], digest: c?.launchContractDigest, tools: c?.tools.effectiveAllowlist, extensions: [...(c?.tools.runtimeExtensions ?? []), ...(c?.tools.configuredExtensions ?? [])] },
			parentSessionId: context.sessionManager.getSessionId(), parentSessionFile: context.sessionManager.getSessionFile() };
		process.send({ name: "discovery", data: discovery });
		process.on("message", async message => {
			try {
				if (message.name === "shutdown") { await finish(); return; }
				assert(message.name === "child" && dispatches === 0, "additional child or unsupported command");
				validateDiscovery(discovery); assert(!failed, failed); provider.child(); dispatches++;
				const delegation = await import(pathToFileURL(join(agentDir, "npm/node_modules/pi-subagents/bundle/delegation.js")).href);
				const id = message.data;
				const response = new Promise((resolve, reject) => {
					const matches = value => value.requestId === id.requestId && value.ownerRunId === id.ownerRunId && value.nodeId === id.nodeId;
					const off = api.events.on(delegation.SUBAGENT_DELEGATION_RESPONSE_EVENT, value => { receipt("delegation-response", value); if (matches(value)) { off(); resolve(value); } });
					api.events.on(delegation.SUBAGENT_DELEGATION_STARTED_EVENT, value => receipt("delegation-started", value));
					api.events.on(delegation.SUBAGENT_DELEGATION_UPDATE_EVENT, value => {
						receipt("delegation-update", value);
						if (matches(value) && value.providerDiagnostics?.retry) {
							failed = "unexpected child retry";
							api.events.emit(delegation.SUBAGENT_DELEGATION_CANCEL_EVENT, id);
							reject(new Error(failed));
						}
					});
				});
				const request = { ...id, agent: "how-explorer", task: `Read ${canaryPath} with read exactly once, then finish.`, context: "fresh", cwd, timeoutMs: 60000, artifacts: true, result: { kind: "text" } };
				receipt("delegation-request", request); api.events.emit(delegation.SUBAGENT_DELEGATION_REQUEST_EVENT, request);
				const terminal = await response; provider.check(); assert(!failed, failed);
				assert(typeof terminal.runId === "string" && /^[A-Za-z0-9_-]+$/.test(terminal.runId), "unsupported run identity");
				const inventory = [...files(join(agentDir, "sessions")), ...files(join(root, "tmp"))];
				const metas = inventory.filter(p => p.endsWith(`/${terminal.runId}_how-explorer_0_meta.json`)); assert(metas.length === 1, "missing or duplicate child metadata");
				const metadata = JSON.parse(boundedRead(metas[0]));
				const eventPath = metas[0].replace(/_meta\.json$/, ".jsonl");
				const events = boundedRead(eventPath).trim().split("\n").map(line => JSON.parse(line));
				const sessions = inventory.filter(p => p.endsWith(".jsonl") && !p.includes("subagent-artifacts")).map(p => { const header = JSON.parse(boundedRead(p).split("\n")[0]); return { path: p, header }; }).filter(s => s.header.type === "session" && s.header.parentSession === discovery.parentSessionFile);
				assert(sessions.length === 1, "missing or duplicate child session");
				receipt("child-artifacts", { paths: [metas[0], eventPath, sessions[0].path], metadata, events, session: sessions[0].header });
				const evidence = { ...terminal, metadata, events, session: sessions[0].header };
				validateChild(evidence, discovery, { identity: id, canary: boundedRead(canaryPath), canaryPath });
				process.send({ name: "child", data: evidence });
			} catch (error) { receipt("negative", { reason: error.message }); process.exitCode = 1; await finish(); }
		});
	} catch (error) { receipt("negative", { reason: error.message }); process.exitCode = 1; await finish(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	if (process.argv.length === 3 && process.argv[2] === "--help") process.stdout.write("Probe-owned native observer. --controller ROOT SDK_ROOT CANARY is an IPC-only internal entry point, never a local verification command.\n");
	else if (process.argv.length === 6 && process.argv[2] === "--controller") controller(...process.argv.slice(3)).catch(error => { receipt("negative", { reason: error.message }); process.exitCode = 1; });
	else { process.stderr.write("Use --help for this internal probe entry point.\n"); process.exitCode = 2; }
}
