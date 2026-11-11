// Host plumbing: spawning, Windows argv quoting, agent-dir and settings path
// math, settings reads and writes, and auth probing.
//
// This module never prompts and never prints: it returns values, and messages
// stay in the command layer where the rendering mode lives. Importing it has no
// side effects and starts no entrypoint.
import { closeSync, existsSync, fchmodSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, renameSync, statSync, unlinkSync, writeSync } from "node:fs";
import { homedir, platform } from "node:os";
import { basename, delimiter, dirname, join, posix, win32 } from "node:path";
import { spawnSync } from "node:child_process";
import { cwd } from "node:process";

// ---------------------------------------------------------------------------
// Spawning
// ---------------------------------------------------------------------------
function isWindowsCmdOrBat(resolved, platformName = platform()) {
	return platformName === "win32" && /\.(cmd|bat)$/i.test(String(resolved));
}

const CMD_QUOTE_RE = /[\s&|<>^%!"()]/;

export function quoteCmdArg(value, { always = false } = {}) {
	const text = String(value);
	if (!always && text !== "" && !CMD_QUOTE_RE.test(text)) return text;
	return `"${text.replaceAll("%", "%%").replaceAll('"', '""')}"`;
}

export function windowsComSpec(env = process.env) {
	const comspec = env.ComSpec;
	if (comspec && /(^|[\\/])cmd\.exe$/i.test(comspec)) return comspec;
	const root = env.SystemRoot || "C:\\Windows";
	return `${root}\\System32\\cmd.exe`;
}

export function pickWindowsWhereHit(whereOutput) {
	const lines = String(whereOutput ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	return lines.find((line) => /\.(cmd|bat|exe|com)$/i.test(line)) ?? lines[0] ?? null;
}

export function windowsSpawnArgv(resolved, args = [], platformName = platform()) {
	if (isWindowsCmdOrBat(resolved, platformName)) {
		return {
			command: windowsComSpec(),
			args: ["/d", "/s", "/c", "call", quoteCmdArg(resolved, { always: true }), ...args.map((arg) => quoteCmdArg(arg))],
		};
	}
	return { command: resolved, args: [...args] };
}

// `options` is the caller's spawnSync option object; the ComSpec plan is the
// only case that adds keys to it.
function spawnCommand(command, args = [], options = {}) {
	const resolved = command === "pi" || command === "npm" ? commandPath(command) ?? command : command;
	const spawned = windowsSpawnArgv(resolved, args);
	const spawnOptions = isWindowsCmdOrBat(resolved)
		? { ...options, shell: false, windowsVerbatimArguments: true }
		: options;
	return spawnSync(spawned.command, spawned.args, spawnOptions);
}

// Resolution walks PATH itself: asking `which` means asking another external
// command, and on a machine without `which` a present `pi` looked absent, which
// then offered a global npm install. `statSync` follows a symlink to the file it
// names, and a regular file without an execute bit is not a command.
function isExecutableFile(candidate) {
	try {
		const info = statSync(candidate);
		return info.isFile() && (info.mode & 0o111) !== 0;
	} catch {
		return false;
	}
}

function posixCommandPath(name, env = process.env) {
	for (const entry of String(env.PATH ?? "").split(delimiter)) {
		if (!entry) continue;
		const candidate = join(entry, name);
		if (isExecutableFile(candidate)) return candidate;
	}
	return null;
}

// The Windows branch still asks `where`, where a `.cmd` shim needs its own
// preference order, and native Windows resolution was never observed here.
function commandPath(name) {
	if (platform() !== "win32") return posixCommandPath(name);
	const probe = spawnSync("where", [name], { encoding: "utf8" });
	if (probe.status !== 0) return null;
	return pickWindowsWhereHit(probe.stdout);
}

function hasCmd(name) {
	return commandPath(name) !== null;
}

// ---------------------------------------------------------------------------
// Agent config dir and settings paths
// ---------------------------------------------------------------------------
export function resolveAgentConfigDir(configured, home = homedir(), platformName = platform()) {
	const joinPath = platformName === "win32" ? win32.join : posix.join;
	if (!configured) return joinPath(home, ".pi", "agent");
	if (configured === "~") return home;
	if (configured.startsWith("~/") || (platformName === "win32" && configured.startsWith("~\\"))) {
		return joinPath(home, configured.slice(2));
	}
	return configured;
}

function agentConfigDir() {
	return resolveAgentConfigDir(process.env.PI_CODING_AGENT_DIR);
}

function settingsPath(local) {
	return local ? join(cwd(), ".pi", "settings.json") : join(agentConfigDir(), "settings.json");
}

// ---------------------------------------------------------------------------
// Settings read and write
// ---------------------------------------------------------------------------
// Builtin pi-subagents agents that hardcode a specific model — blank them out
// so they fall back to the user's active session model instead.
const SUBAGENT_BUILTIN_MODELS = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];

function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describeJsonValue(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return "an array";
	if (typeof value === "object") return "an object";
	return `a ${typeof value}`;
}

// A document LazyPi cannot round-trip safely is rejected whole: a non-object
// top level silently drops the mutation, and a wrong-typed packages or
// subagents block either throws from iteration or is re-keyed by spread.
function settingsShapeProblem(parsed) {
	if (!isPlainObject(parsed)) return `the top-level JSON value is ${describeJsonValue(parsed)}, but LazyPi needs an object`;
	if (parsed.packages !== undefined && !Array.isArray(parsed.packages)) {
		return `"packages" must be an array, but it is ${describeJsonValue(parsed.packages)}`;
	}
	if (parsed.subagents !== undefined && !isPlainObject(parsed.subagents)) {
		return `"subagents" must be an object, but it is ${describeJsonValue(parsed.subagents)}`;
	}
	if (parsed.subagents?.agentOverrides !== undefined && !isPlainObject(parsed.subagents.agentOverrides)) {
		return `"subagents.agentOverrides" must be an object, but it is ${describeJsonValue(parsed.subagents.agentOverrides)}`;
	}
	return null;
}

function readSettings(local) {
	const path = settingsPath(local);
	let info;
	try {
		info = statSync(path);
	} catch (err) {
		if (err?.code === "ENOENT") return { path, exists: false, parsed: null, problem: null, mode: null };
		return { path, exists: true, parsed: null, problem: { kind: "unreadable", detail: err?.code ?? String(err) }, mode: null };
	}
	if (!info.isFile()) return { path, exists: true, parsed: null, problem: { kind: "not-regular" }, mode: null };
	const mode = info.mode & 0o777;
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		const shape = settingsShapeProblem(parsed);
		if (shape) return { path, exists: true, parsed: null, problem: { kind: "shape", detail: shape }, mode };
		return { path, exists: true, parsed, problem: null, mode };
	} catch (err) {
		return { path, exists: true, parsed: null, problem: { kind: "parse", detail: err instanceof Error ? err.message : String(err) }, mode };
	}
}

function settingsProblemMessage(current) {
	if (!current.problem) return null;
	if (current.problem.kind === "parse") return `Could not parse ${current.path} — ${current.problem.detail}`;
	if (current.problem.kind === "not-regular") return `Invalid settings file ${current.path} — it is not a regular file.`;
	if (current.problem.kind === "unreadable") return `Could not read ${current.path} — ${current.problem.detail}.`;
	return `Invalid settings file ${current.path} — ${current.problem.detail}.`;
}

// Milliseconds keep two backups in the same second apart, and the counter
// guarantees a distinct path even when the clock cannot.
function backupPath(path) {
	const timestamp = new Date().toISOString().replace(/[-:]/g, "");
	let candidate = `${path}.lazypi.${timestamp}.bak`;
	for (let n = 1; existsSync(candidate); n++) candidate = `${path}.lazypi.${timestamp}-${n}.bak`;
	return candidate;
}

// A temp file in the target directory, renamed over the target, so a failure
// after the file is opened leaves the previous bytes untouched. `writeSync`
// reports short writes without failing, so the loop is what turns a partially
// written temp file into an error instead of a silently truncated document.
function writeFileAtomic(path, data, mode) {
	const temp = join(dirname(path), `.${basename(path)}.lazypi-${process.pid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
	const bytes = Buffer.isBuffer(data) ? data : Buffer.from(String(data), "utf8");
	let fd = null;
	try {
		fd = openSync(temp, "wx", mode);
		fchmodSync(fd, mode);
		let offset = 0;
		while (offset < bytes.length) {
			const written = writeSync(fd, bytes, offset, bytes.length - offset);
			if (written <= 0) throw new Error("short write");
			offset += written;
		}
		fsyncSync(fd);
		closeSync(fd);
		fd = null;
		renameSync(temp, path);
	} catch (err) {
		if (fd !== null) {
			try {
				closeSync(fd);
			} catch {
				// already closed
			}
		}
		try {
			unlinkSync(temp);
		} catch {
			// nothing to clean up
		}
		throw err;
	}
}

// Refuse to write any non-regular target: following a symlinked settings file
// copies a link target into the tree and then overwrites that target.
function settingsWriteRefusal(path) {
	let info;
	try {
		info = lstatSync(path);
	} catch (err) {
		if (err?.code === "ENOENT") return null;
		return `Refusing to write ${path} — ${err?.code ?? String(err)}.`;
	}
	if (info.isSymbolicLink()) return `Refusing to write ${path} — it is a symbolic link.`;
	if (!info.isFile()) return `Refusing to write ${path} — it is not a regular file.`;
	return null;
}

function writeSettings(local, mutate) {
	const path = settingsPath(local);
	const refusal = settingsWriteRefusal(path);
	if (refusal) return { ok: false, path, message: refusal };
	const current = readSettings(local);
	const problem = settingsProblemMessage(current);
	if (problem) return { ok: false, path, message: problem };
	const settings = current.parsed ?? {};
	const changed = mutate(settings);
	if (!changed) return { ok: true, path, backup: null, changed: false };
	const document = JSON.stringify(settings, null, 2) + "\n";
	const mode = current.mode ?? 0o644;
	let backup = null;
	try {
		mkdirSync(dirname(path), { recursive: true });
		if (current.exists) {
			backup = backupPath(path);
			writeFileAtomic(backup, readFileSync(path), mode);
		}
		writeFileAtomic(path, document, mode);
	} catch (err) {
		if (backup) {
			try {
				unlinkSync(backup);
			} catch {
				// nothing to clean up
			}
		}
		return { ok: false, path, message: `Could not write ${path} — ${err?.code ?? err?.message ?? String(err)}. The file was left unchanged.` };
	}
	return { ok: true, path, backup, changed: true };
}

export function writeSubagentOverrides(local) {
	return writeSettings(local, (settings) => {
		const existing = settings.subagents?.agentOverrides ?? {};
		const overrides = { ...existing };
		let changed = false;
		for (const name of SUBAGENT_BUILTIN_MODELS) {
			const current = overrides[name];
			if (current && typeof current === "object" && !Array.isArray(current) && current.model === "") continue;
			overrides[name] = { ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}), model: "" };
			changed = true;
		}
		if (!changed) return false;
		settings.subagents = { ...(settings.subagents ?? {}), agentOverrides: overrides };
		return true;
	});
}

function packageEntrySource(entry) {
	if (typeof entry === "string") return entry;
	if (entry && typeof entry === "object" && typeof entry.source === "string") return entry.source;
	return null;
}

function readInstalledSources(local) {
	const current = readSettings(local);
	const sources = new Set();
	if (current.exists && !current.problem) {
		for (const entry of current.parsed.packages ?? []) {
			const source = packageEntrySource(entry);
			if (source) sources.add(source);
		}
	}
	return { ...current, sources };
}

// ---------------------------------------------------------------------------
// Auth probing (read-only)
// ---------------------------------------------------------------------------
function readJsonSafe(path) {
	try {
		if (!existsSync(path)) return null;
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return null;
	}
}

// Pi reads credentials from auth.json in its agent config directory and also
// honors provider env vars. LazyPi reports the available credentials so users
// know whether to run `pi /login` first.
const AUTH_ENV_VARS = [
	["ANTHROPIC_API_KEY", "anthropic"],
	["OPENAI_API_KEY", "openai"],
	["GOOGLE_API_KEY", "google"],
	["GEMINI_API_KEY", "google"],
	["OPENROUTER_API_KEY", "openrouter"],
	["TOGETHER_API_KEY", "together"],
	["GROQ_API_KEY", "groq"],
	["MISTRAL_API_KEY", "mistral"],
];

function authJsonPath() {
	return join(agentConfigDir(), "auth.json");
}

function detectAuth() {
	const envProviders = new Map(); // provider -> env var name
	for (const [name, provider] of AUTH_ENV_VARS) {
		if (process.env[name] && !envProviders.has(provider)) envProviders.set(provider, name);
	}
	const document = readJsonSafe(authJsonPath());
	const auth = isPlainObject(document) ? document : {};
	const fileProviders = Object.keys(auth);
	return {
		envProviders: [...envProviders.entries()].map(([provider, envVar]) => ({ provider, envVar })),
		fileProviders,
		path: authJsonPath(),
		authed: envProviders.size > 0 || fileProviders.length > 0,
	};
}

export {
	detectAuth,
	hasCmd,
	readInstalledSources,
	readSettings,
	settingsPath,
	settingsProblemMessage,
	spawnCommand,
};
