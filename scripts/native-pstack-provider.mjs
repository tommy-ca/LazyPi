import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { PROVIDER, receipt } from "./native-pstack-proof.mjs";

// Probe-owned transport. This does not change any canonical agent definition.
export async function startProvider({ canaryPath, canary, record = receipt }) {
	let phase = "discovery", step = 0, failure, childStarted = false;
	const plan = [
		["subagents_enable", {}],
		["subagent", { action: "list" }],
		["subagent", { action: "get", agent: "how-explorer" }],
	];
	const server = createServer(async (request, response) => {
		try {
			if (failure) throw new Error(failure);
			if (request.method !== "POST" || request.url !== "/v1/chat/completions") throw new Error("unexpected provider route");
			let body = "";
			for await (const chunk of request) { body += chunk; if (Buffer.byteLength(body) > 1024 * 1024) throw new Error("provider request bound"); }
			const value = JSON.parse(body);
			if (value.model !== "canary" || value.stream !== true || !Array.isArray(value.messages)) throw new Error("unexpected provider model or schema");
			record("provider-request", { phase, step, path: request.url, body: value });
			let call;
			if (phase === "discovery") {
				if (step > plan.length) throw new Error("extra discovery request");
				call = plan[step];
			} else {
				if (step > 1) throw new Error("extra child request");
				if (step === 0) call = ["read", { path: canaryPath }];
				else {
					const results = value.messages.filter(m => m.role === "tool");
					if (results.length !== 1 || !JSON.stringify(results[0].content).includes(canary)) throw new Error("provider missing canary tool result");
				}
			}
			if (call && !value.tools?.some(t => t.function?.name === call[0])) throw new Error("requested tool is not in actual provider schema");
			const id = `probe-${phase}-${step++}`;
			const delta = call ? { role: "assistant", tool_calls: [{ index: 0, id, type: "function", function: { name: call[0], arguments: JSON.stringify(call[1]) } }] } : { role: "assistant", content: "Probe transcript complete." };
			response.writeHead(200, { "content-type": "text/event-stream" });
			const chunks = [
				{ id, object: "chat.completion.chunk", created: 1, model: "canary", choices: [{ index: 0, delta, finish_reason: null }] },
				{ id, object: "chat.completion.chunk", created: 1, model: "canary", choices: [{ index: 0, delta: {}, finish_reason: call ? "tool_calls" : "stop" }] },
			];
			for (const chunk of chunks) response.write(`data: ${JSON.stringify(chunk)}\n\n`);
			response.end("data: [DONE]\n\n"); record("provider-response", { phase, chunks });
		} catch (error) {
			failure = error.message; record("provider-negative", { reason: failure });
			response.writeHead(400, { "content-type": "application/json" }); response.end(JSON.stringify({ error: { message: failure } }));
		}
	});
	await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
	return {
		baseUrl: `http://127.0.0.1:${server.address().port}/v1`, provider: PROVIDER,
		child() { if (failure || phase !== "discovery" || step !== 4) throw new Error(failure ?? "discovery transcript incomplete"); phase = "child"; step = 0; childStarted = true; },
		// A recorded canary artifact is not evidence of routing. The child must have
		// completed its own two provider round trips for this to count.
		check() {
			if (failure) throw new Error(failure);
			if (childStarted && step !== 2) throw new Error("child provider transcript incomplete");
		},
		async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); },
	};
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	if (process.argv.length === 3 && process.argv[2] === "--help") process.stdout.write("Probe-owned loopback provider library. Imported only by the native controller or offline HTTP fixtures; no standalone native entry point.\n");
	else { process.stderr.write("Use --help for this internal probe entry point.\n"); process.exitCode = 2; }
}
