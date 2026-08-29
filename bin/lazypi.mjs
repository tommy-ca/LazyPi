#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join, posix, resolve, win32 } from "node:path";
import { spawnSync } from "node:child_process";
import { argv, cwd, exit, stdout, stderr } from "node:process";
import { pathToFileURL } from "node:url";
import {
	cancel as clackCancel,
	confirm as clackConfirm,
	groupMultiselect,
	intro,
	isCancel,
	log,
	note,
	outro,
	select,
} from "@clack/prompts";

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
// Categories. LazyPi installs the core catalog by default — "lazy" means you
// get the harness without thinking. The optional category holds evaluated
// packages worth managing but not part of the default; include them via the
// interactive picker or --only / --except.
const CATEGORIES = ["core", "optional"];

export const PACKAGES = [
	{ id: "subagents", category: "core", source: "npm:pi-subagents", description: "Sub-agent execution", hint: "Run isolated sub-agents for parallel work." },
	{ id: "pi-ask-user", category: "core", source: "npm:pi-ask-user", description: "Ask-user prompts", hint: "Interactive user questions for agent workflows." },
	{ id: "pi-skillful", category: "core", source: "npm:pi-skillful", description: "Skill visibility", hint: "Discover skills above the git root, hide unused skills, and expand /skill:name inline." },
	{ id: "mention-skill", category: "core", source: "npm:@zigai/pi-mention-skill", description: "$ skill mention", hint: "Fuzzy-search skills with $ and expand them into the prompt; hidden skills stay reachable." },
	{ id: "goal", category: "core", source: "npm:@narumitw/pi-goal", description: "Long-objective gate", hint: "Stop on done, blocked, or external wait for long tasks." },
	{
		id: "btw",
		category: "core",
		source: "npm:@narumitw/pi-btw",
		legacySources: ["npm:pi-btw"],
		description: "Side-chat popover",
		hint: "Ask quick questions without polluting your conversation history.",
	},
	{ id: "context-usage", category: "core", source: "npm:pi-context-usage", description: "Context budget", hint: "See what is burning the context window before it fills." },
	{ id: "simplify", category: "core", source: "npm:pi-simplify", description: "Code simplify review", hint: "Reviews recently changed code for clarity, consistency, and maintainability." },
	{ id: "web-access", category: "core", source: "npm:pi-web-access", description: "Web search and page fetch", hint: "Built-in web search and URL fetching." },
	{ id: "fff", category: "core", source: "npm:@ff-labs/pi-fff", description: "FFF fuzzy search", hint: "Additive fffind / ffgrep / fff-multi-grep beside the built-in tools; /fff-health checks the index." },
	{ id: "dynamic-workflows", category: "core", source: "npm:@quintinshaw/pi-dynamic-workflows", description: "Workflow engine", hint: "Fan work out across subagents: /workflows TUI, deep-research, resume, token accounting." },
	{ id: "ponytail", category: "core", source: "npm:@dietrichgebert/ponytail", description: "Lazy senior dev mode", hint: "Enforces minimal, stdlib-first code; /ponytail review, audit, and a debt ledger." },
	{ id: "lsp", category: "optional", source: "npm:@narumitw/pi-lsp", description: "Targeted LSP diagnostics and fixes", hint: "lsp_diagnostics / lsp_fix with configurable language servers, started per call." },
	{ id: "interactive-shell", category: "optional", source: "npm:pi-interactive-shell", description: "Interactive shell overlays", hint: "Run CLIs and agents in TUI overlays: interactive, hands-free, dispatch supervision." },
	{ id: "autoresearch", category: "optional", source: "npm:pi-autoresearch", legacySources: ["git:github.com/davebcn87/pi-autoresearch"], description: "Autonomous experiment loops", hint: "Iterative optimization runs with hooks, finalize, and convergence tracking." },
	{ id: "todos", category: "optional", source: "npm:pi-manage-todo-list", legacySources: ["git:github.com/tintinweb/pi-manage-todo-list"], description: "Structured todo tracking", hint: "Track multi-step work with live progress widgets and session persistence." },
];

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------
const isTTY = Boolean(stdout.isTTY);
const c = (code) => (s) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = c("1");
const dim = c("2");
const red = c("31");
const green = c("32");
const yellow = c("33");
const cyan = c("36");
const blue = c("94");
const white = c("1;97");

function printHeader(text) {
	console.log(`\n${bold(text)}`);
}

// ASCII "Pi" logo: capital P + lowercase i, with a blue "zzz" cascade
// rising from where the dot of the "i" would be. Letters in bold white,
// sleep trail in blue.
function renderLogo() {
	const Z = (s) => blue(s);
	const P = (s) => white(s);
	return [
		"",
		"                 " + Z("z Z z"),
		"                " + Z("z Z"),
		"               " + Z("z"),
		"        " + P("____   "),
		"       " + P("|  _ \\(_)"),
		"       " + P("| |_) | |"),
		"       " + P("|  __/| |"),
		"       " + P("|_|   |_|"),
		"",
	].join("\n");
}

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
const KNOWN_COMMANDS = new Set(["install", "status", "update", "doctor", "remove"]);

function parseArgs(args) {
	const flags = {
		command: "install",
		local: false,
		yes: false,
		help: false,
		badArg: false,
		version: false,
		only: null,
		except: null,
		targets: [],
	};

	let i = 0;
	if (args[0] && KNOWN_COMMANDS.has(args[0])) {
		flags.command = args[0];
		i = 1;
	}

	for (; i < args.length; i++) {
		const arg = args[i];
		if (arg === "-l" || arg === "--local") flags.local = true;
		else if (arg === "-y" || arg === "--yes") flags.yes = true;
		else if (arg === "-V" || arg === "--version") flags.version = true;
		else if (arg === "-h" || arg === "--help") flags.help = true;
		else if (arg === "--only") flags.only = parseList(args[++i]);
		else if (arg.startsWith("--only=")) flags.only = parseList(arg.slice("--only=".length));
		else if (arg === "--except") flags.except = parseList(args[++i]);
		else if (arg.startsWith("--except=")) flags.except = parseList(arg.slice("--except=".length));
		else if (flags.command === "remove" && !arg.startsWith("-")) flags.targets.push(arg);
		else {
			console.error(red(`Unknown argument: ${arg}`));
			flags.help = true;
			flags.badArg = true;
			break;
		}
	}

	return flags;
}

export function parseList(value) {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function validateSelectors(list, label) {
	const ids = new Set(PACKAGES.map((p) => p.id));
	const bad = list.filter((name) => !CATEGORIES.includes(name) && !ids.has(name));
	if (bad.length > 0) {
		console.error(red(`Unknown ${label}: ${bad.join(", ")}`));
		console.error(`Valid categories: ${CATEGORIES.join(", ")}`);
		console.error(`Valid package ids:  ${[...ids].join(", ")}`);
		exit(2);
	}
}

function matchesSelector(pkg, selectors) {
	return selectors.some((name) => name === pkg.category || name === pkg.id);
}

function resolveSelection(flags) {
	if (flags.only) {
		validateSelectors(flags.only, "--only");
		return new Set(PACKAGES.filter((p) => matchesSelector(p, flags.only)).map((p) => p.id));
	}
	if (flags.except) {
		validateSelectors(flags.except, "--except");
		return new Set(PACKAGES.filter((p) => !matchesSelector(p, flags.except)).map((p) => p.id));
	}
	return new Set(PACKAGES.filter((p) => p.category === "core").map((p) => p.id));
}

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------
function printHelp() {
	console.log(`${bold("lazypi")} — opinionated installer for Pi extensions

${bold("Usage:")}
  npx @tommy-ca/lazypi [command] [options]

${bold("Commands:")}
  install   Install the selected LazyPi catalog (default)
  remove    Remove a catalog package by id (or pass a raw pi source)
  status    Show which catalog packages are installed
  update    Run \`pi update\` for installed Pi packages
  doctor    Check your environment for common problems

${bold("Install options:")}
  --only <list>       Install only the given categories or package ids
  --except <list>     Install everything except the given categories or ids
  -l, --local         Install into the current project (.pi/settings.json)
  -y, --yes           Skip the picker and any confirmation prompt
  -h, --help          Show this help
  -V, --version       Show the installed version

${bold("Default behaviour:")}
  - Every core catalog package is installed (lazy on purpose); optional
    category packages are installed only when selected.
  - On a TTY, an interactive picker appears with core pre-ticked;
    untick categories or packages before confirming.
  - With --yes, --only, or --except the picker is skipped.

${bold("Categories:")}
  core         the harness control plane: sub-agents, workflows, ask gate, skill visibility, $ mention, goal, side chat, context budget, simplify, web research, fff search, ponytail discipline
  optional     only when selected (--only optional, picker, or the everything flow): lsp diagnostics, interactive-shell overlays, autoresearch loops, todo tracking
  Non-catalog extras (pi install npm:<source>): skill-args, memory, mcp,
  ralph-wiggum, curated-themes (65 dark themes)

${bold("Examples:")}
  npx @tommy-ca/lazypi                              # core catalog (interactive picker on a TTY)
  npx @tommy-ca/lazypi --yes                        # core catalog, no prompt
  npx @tommy-ca/lazypi --only core,optional         # install optional tier too
  npx @tommy-ca/lazypi --only optional              # just the optional tier
  npx @tommy-ca/lazypi --only subagents,fff         # individual package ids also work
  npx @tommy-ca/lazypi --only core --local          # core into the current project
  npx @tommy-ca/lazypi status
  npx @tommy-ca/lazypi doctor`);
}

// ---------------------------------------------------------------------------
// Pi / settings plumbing
// ---------------------------------------------------------------------------
const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
// On Windows, package-manager CLIs and global Node bins are usually `.cmd`
// shims. Node's child_process docs note that those need to be launched via a
// shell, so we route spawned commands through the platform shell there while
// keeping direct execution on Unix.
export function buildSpawnOptions(options = {}, platformName = platform()) {
	const resolved = { ...options };
	if (platformName === "win32" && resolved.shell == null) resolved.shell = true;
	return resolved;
}

function spawnCommand(command, args = [], options = {}) {
	return spawnSync(command, args, buildSpawnOptions(options));
}

function hasCmd(name) {
	return commandPath(name) !== null;
}

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

// Builtin pi-subagents agents that hardcode a specific model — blank them out
// so they fall back to the user's active session model instead.
const SUBAGENT_BUILTIN_MODELS = ["context-builder", "planner", "researcher", "reviewer", "scout", "worker"];


function readSettings(local) {
	const path = settingsPath(local);
	if (!existsSync(path)) return { path, exists: false, parsed: null, error: null };
	try {
		return { path, exists: true, parsed: JSON.parse(readFileSync(path, "utf8")), error: null };
	} catch (err) {
		return { path, exists: true, parsed: null, error: err instanceof Error ? err.message : String(err) };
	}
}

function backupPath(path) {
	const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
	return `${path}.lazypi.${timestamp}.bak`;
}

function writeSettings(local, mutate) {
	const current = readSettings(local);
	if (current.error) return { ok: false, path: current.path, error: current.error };
	const settings = current.parsed ?? {};
	const changed = mutate(settings);
	if (!changed) return { ok: true, path: current.path, backup: null, changed: false };
	mkdirSync(dirname(current.path), { recursive: true });
	let backup = null;
	if (current.exists) {
		backup = backupPath(current.path);
		copyFileSync(current.path, backup);
	}
	writeFileSync(current.path, JSON.stringify(settings, null, 2) + "\n", "utf8");
	return { ok: true, path: current.path, backup, changed: true };
}

function writeSubagentOverrides(local) {
	return writeSettings(local, (settings) => {
		const overrides = {};
		for (const name of SUBAGENT_BUILTIN_MODELS) overrides[name] = { model: "" };
		settings.subagents = { ...(settings.subagents ?? {}), agentOverrides: { ...(settings.subagents?.agentOverrides ?? {}), ...overrides } };
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
	if (!current.exists) return { sources: new Set(), path: current.path, exists: false };
	if (current.error) return { sources: new Set(), path: current.path, exists: true, error: current.error };
	const sources = new Set();
	for (const entry of current.parsed?.packages ?? []) {
		const source = packageEntrySource(entry);
		if (source) sources.add(source);
	}
	return { sources, path: current.path, exists: true };
}

function commandPath(name) {
	const command = platform() === "win32" ? "where" : "which";
	const probe = spawnCommand(command, [name], { encoding: "utf8" });
	if (probe.status !== 0) return null;
	const first = String(probe.stdout ?? "").split(/\r?\n/).map((line) => line.trim()).find(Boolean);
	return first || null;
}

function legacySourcesForPackage(pkg) {
	return Array.isArray(pkg.legacySources) ? pkg.legacySources : [];
}

// An installed source matches a catalog source when equal or when it is the
// same source with a version/pin suffix (npm:pkg vs npm:pkg@x.y.z,
// git:... vs git:...@sha).
export function sourcesMatch(catalogSource, installedSource) {
	return catalogSource === installedSource || installedSource.startsWith(`${catalogSource}@`);
}

function isLegacySourceForPackage(pkg, source) {
	return legacySourcesForPackage(pkg).some((legacy) => sourcesMatch(legacy, source));
}

function findLegacyInstalledSources(pkg, installedPiSources) {
	return [...installedPiSources].filter((source) => isLegacySourceForPackage(pkg, source));
}

function removeLegacy(pkg, installedPiSources, local, interactive) {
	let status = 0;
	for (const legacySource of findLegacyInstalledSources(pkg, installedPiSources)) {
		const action = `pi remove ${legacySource}`;
		if (interactive) log.step(action);
		else console.log(`\n→ ${action}`);
		status = spawnCommand("pi", local ? ["remove", "-l", "--approve", legacySource] : ["remove", legacySource], { stdio: "inherit" }).status ?? 1;
		if (status !== 0) break;
	}
	return status;
}

function packageInstallStatus(pkg, installedPiSources) {
	const legacySources = findLegacyInstalledSources(pkg, installedPiSources);
	const installed = [...installedPiSources].some((src) => sourcesMatch(pkg.source, src));
	return {
		installed,
		legacy: legacySources.length > 0,
		present: installed || legacySources.length > 0,
	};
}

function isPackageInstalled(pkg, installedPiSources) {
	return packageInstallStatus(pkg, installedPiSources).installed;
}

function isPackagePresent(pkg, installedPiSources) {
	return packageInstallStatus(pkg, installedPiSources).present;
}

// ---------------------------------------------------------------------------
// Pi / settings plumbing (shared helpers)
// ---------------------------------------------------------------------------
function readJsonSafe(path) {
	try {
		if (!existsSync(path)) return null;
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// Auth detection (read-only)
// ---------------------------------------------------------------------------
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
	const auth = readJsonSafe(authJsonPath()) ?? {};
	const fileProviders = Object.keys(auth);
	return {
		envProviders: [...envProviders.entries()].map(([provider, envVar]) => ({ provider, envVar })),
		fileProviders,
		path: authJsonPath(),
		authed: envProviders.size > 0 || fileProviders.length > 0,
	};
}

function formatAuthSummary(state) {
	const bits = [];
	for (const { provider, envVar } of state.envProviders) bits.push(`${provider} (${envVar})`);
	for (const provider of state.fileProviders) bits.push(`${provider} (auth.json)`);
	return bits.length > 0 ? bits.join(", ") : "none detected";
}

// ---------------------------------------------------------------------------
// Interactive prompts (powered by @clack/prompts)
// ---------------------------------------------------------------------------
function isInteractive() {
	return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function abortIfCancelled(value) {
	if (isCancel(value)) {
		clackCancel("Aborted.");
		exit(0);
	}
	return value;
}

async function confirm(message, initial = false) {
	const answer = await clackConfirm({ message, initialValue: initial });
	return abortIfCancelled(answer);
}

async function askLazyOrPick(totalCount) {
	const options = [
		{ value: "lazy", label: `Install everything`, hint: `all ${totalCount} packages` },
		{ value: "pick", label: "Pick packages", hint: "open a checklist" },
	];

	const choice = await select({
		message: `Install all ${totalCount} Pi packages the lazy way, or pick them yourself?`,
		options,
		initialValue: "lazy",
	});
	return abortIfCancelled(choice);
}

async function runPicker(initialSelected) {
	const idWidth = Math.max(...PACKAGES.map((p) => p.id.length));
	const options = {};
	for (const cat of CATEGORIES) {
		const pkgs = PACKAGES.filter((p) => p.category === cat);
		if (pkgs.length === 0) continue;
		options[cat] = pkgs.map((pkg) => ({
			value: pkg.id,
			label: `${pkg.id.padEnd(idWidth + 2)}${pkg.description}`,
		}));
	}

	const picked = await groupMultiselect({
		message: "Pick packages to install",
		options,
		initialValues: [...initialSelected],
		required: false,
		selectableGroups: true,
	});
	abortIfCancelled(picked);
	return new Set(picked);
}

// ---------------------------------------------------------------------------
// Ensure Pi is present (offer to install)
// ---------------------------------------------------------------------------
async function ensurePi(flags) {
	if (hasCmd("pi")) return true;

	log.warn("Could not find the `pi` command on PATH.");
	const ok = flags.yes || (await confirm("Install Pi now with `npm install -g @earendil-works/pi-coding-agent`?", true));
	if (!ok) {
		log.error("Install Pi first, then re-run `npx @tommy-ca/lazypi`.");
		return false;
	}

	log.step("Installing Pi via `npm install -g @earendil-works/pi-coding-agent`");
	const code = spawnCommand("npm", ["install", "-g", "@earendil-works/pi-coding-agent"], { stdio: "inherit" }).status;
	if (code !== 0) {
		log.error("Failed to install Pi. On some systems a global npm install needs sudo:\n  sudo npm install -g @earendil-works/pi-coding-agent");
		return false;
	}

	if (!hasCmd("pi")) {
		log.error("Installed Pi, but `pi` is still not on PATH. Open a new shell and re-run `npx @tommy-ca/lazypi`.");
		return false;
	}
	return true;
}

// ---------------------------------------------------------------------------
// install
// ---------------------------------------------------------------------------
async function cmdInstall(flags) {
	let selectedIds = resolveSelection(flags);

	const usedSelectionFlag = Boolean(flags.only || flags.except);
	const interactive = !flags.yes && !usedSelectionFlag && isInteractive();

	if (interactive) {
		console.log(renderLogo());
		intro(bold("LazyPi"));
	}
	if (!(await ensurePi(flags))) return 127;

	if (interactive) {
		const choice = await askLazyOrPick(PACKAGES.length);
		if (choice === "pick") {
			selectedIds = await runPicker(selectedIds);
		} else {
			selectedIds = new Set(PACKAGES.map((p) => p.id));
		}
	}

	const selected = PACKAGES.filter((p) => selectedIds.has(p.id));
	if (selected.length === 0) {
		if (interactive) outro("Nothing selected — nothing to install.");
		else console.log(yellow("Nothing selected — nothing to install."));
		return 0;
	}

	const { sources: installedSources, error: settingsError } = readInstalledSources(flags.local);
	if (settingsError) log.warn(`Could not parse ${settingsPath(flags.local)} — ${settingsError}`);

	const toInstall = selected.filter((pkg) => {
		return !isPackageInstalled(pkg, installedSources);
	});
	const alreadyInstalled = selected.filter((pkg) => {
		return isPackageInstalled(pkg, installedSources);
	});
	const legacyInstalled = selected.filter((pkg) => {
		return !isPackageInstalled(pkg, installedSources) && isPackagePresent(pkg, installedSources);
	});
	const migrateOnly = alreadyInstalled.filter((pkg) => findLegacyInstalledSources(pkg, installedSources).length > 0);
	const migrations = legacyInstalled.length + migrateOnly.length;
	const installLabel = migrations > 0 ? `${toInstall.length} (${migrations} migration${migrations === 1 ? "" : "s"})` : String(toInstall.length);
	const scope = flags.local ? "project (.pi/settings.json)" : `global (${settingsPath(false)})`;

	const preInstallAuth = detectAuth();
	const summary = [
		`Target:            ${scope}`,
		`Selected:          ${selected.length}/${PACKAGES.length}`,
		`Already installed: ${alreadyInstalled.length}`,
		`Will install:      ${installLabel}`,
		`Pi credentials:    ${formatAuthSummary(preInstallAuth)}`,
	].join("\n");
	if (interactive) note(summary, "Plan");
	else console.log(summary);

	if (selected.some((p) => p.id === "subagents")) {
		const overrideResult = writeSubagentOverrides(flags.local);
		if (!overrideResult.ok) {
			const message = `Refusing to update ${overrideResult.path} because it is not valid JSON (${overrideResult.error}). Fix the file first, then rerun lazypi.`;
			if (interactive) {
				log.error(message);
				outro(red("Aborted."));
			} else {
				console.error(red(message));
			}
			return 2;
		}
	}

	const failed = [];

	// Remove stale legacy sources even when the replacement is already installed.
	for (const pkg of migrateOnly) {
		const status = removeLegacy(pkg, installedSources, flags.local, interactive);
		if (status !== 0) {
			failed.push(pkg);
			if (interactive) log.error(`failed to migrate ${pkg.id}`);
			else console.error(red(`  ✗ failed to migrate ${pkg.id}`));
		}
	}

	if (toInstall.length === 0 && failed.length === 0) {
		printCheatsheet(selected, interactive);
		const done = migrations === 0
			? "Nothing to do — every selected package is already installed."
			: "Nothing new to install — stale legacy sources removed.";
		if (interactive) log.success(green(done));
		else console.log(green(done));
		const authState = detectAuth();
		printNextSteps(authState, 0, interactive);
		return 0;
	}

	const piArgs = flags.local ? ["install", "-l", "--approve"] : ["install"];

	for (const pkg of toInstall) {
		const migrationStatus = removeLegacy(pkg, installedSources, flags.local, interactive);
		if (migrationStatus !== 0) {
			failed.push(pkg);
			if (interactive) log.error(`failed to migrate ${pkg.id}`);
			else console.error(red(`  ✗ failed to migrate ${pkg.id}`));
			continue;
		}

		const action = `pi install ${pkg.source}`;
		if (interactive) log.step(action);
		else console.log(`\n→ ${action}`);
		const status = spawnCommand("pi", [...piArgs, pkg.source], { stdio: "inherit" }).status;
		if (status !== 0) {
			failed.push(pkg);
			if (interactive) log.error(`failed to install ${pkg.id}`);
			else console.error(red(`  ✗ failed to install ${pkg.id}`));
		}
	}

	const installedCount = toInstall.length - failed.length;
	if (failed.length === 0) {
		printCheatsheet(selected, interactive);
		const authState = detectAuth();
		printNextSteps(authState, installedCount, interactive);
		return 0;
	}

	const failureList = failed.map((p) => `- ${p.id} (${p.source})`).join("\n");
	if (interactive) {
		note(failureList, "Failures");
		outro(red(`Finished with ${failed.length} failure(s).`));
	} else {
		console.error(red(`\nLazyPi finished with ${failed.length} failure(s):`));
		console.error(failureList);
	}
	return 1;
}

function printNextSteps(state, installedCount, interactive) {
	const lines = [];
	if (state.authed) {
		lines.push(`Pi credentials: ${formatAuthSummary(state)}`);
		lines.push("");
		lines.push("You're all set. Run `pi` to get started.");
	} else {
		lines.push("Pi credentials: none detected.");
		lines.push("");
		lines.push("Run `pi`, then type `/login` inside Pi to sign in with a");
		lines.push("subscription (Claude Pro/Max, ChatGPT Plus/Pro, Copilot, Gemini)");
		lines.push("or set a provider env var (ANTHROPIC_API_KEY, OPENAI_API_KEY, …)");
		lines.push("before launching pi.");
	}

	const title = installedCount > 0
		? `Installed ${installedCount} package(s) — next steps`
		: "Next steps";
	const body = lines.join("\n");
	if (interactive) {
		note(body, title);
		outro(green("Done."));
	} else {
		printHeader(title + ":");
		console.log(body);
	}
}

function printCheatsheet(selected, interactive) {
	if (selected.length === 0) return;
	const lines = selected.map((p) => `${p.id.padEnd(20)} ${p.hint}`);
	if (interactive) note(lines.join("\n"), "What you've got");
	else {
		printHeader("What you've got:");
		for (const line of lines) console.log(`  ${line}`);
		console.log(dim("\nRemove pi packages with `pi remove <source>`."));
	}
}

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------
function cmdStatus(flags) {
	const { sources, path, exists, error } = readInstalledSources(flags.local);
	console.log(`Settings file: ${bold(path)}`);
	if (!exists) {
		console.log(yellow("  (not found — Pi has not written settings yet)"));
	} else if (error) {
		console.error(red(`  could not parse: ${error}`));
		return 1;
	}

	const installed = PACKAGES.filter((pkg) => packageInstallStatus(pkg, sources).installed);
	const legacy = PACKAGES.filter((pkg) => packageInstallStatus(pkg, sources).legacy);
	const missing = PACKAGES.filter((pkg) => !packageInstallStatus(pkg, sources).present);
	const others = [...sources].filter(
		(src) => !PACKAGES.some((pkg) => sourcesMatch(pkg.source, src) || isLegacySourceForPackage(pkg, src)),
	);

	printHeader(`Installed from LazyPi catalog (${installed.length}/${PACKAGES.length}):`);
	if (installed.length === 0) console.log(dim("  none"));
	for (const pkg of installed) {
		console.log(`  ${green("✓")} [${pkg.category}] ${pkg.id.padEnd(20)} ${dim(pkg.source)}`);
	}

	printHeader(`Installed with legacy catalog sources (${legacy.length}):`);
	if (legacy.length === 0) console.log(dim("  none"));
	for (const pkg of legacy) {
		const detail = findLegacyInstalledSources(pkg, sources).map((src) => dim(src)).join(", ");
		console.log(`  ${yellow("!")} [${pkg.category}] ${pkg.id.padEnd(20)} ${detail}`);
	}

	printHeader(`Missing from LazyPi catalog (${missing.length}):`);
	if (missing.length === 0) console.log(dim("  none — full catalog is installed"));
	for (const pkg of missing) {
		console.log(`  ${dim("·")} [${pkg.category}] ${pkg.id.padEnd(20)} ${dim(pkg.source)}`);
	}

	printHeader(`Other Pi packages outside the LazyPi catalog (${others.length}):`);
	if (others.length === 0) console.log(dim("  none"));
	for (const src of others) console.log(`  ${cyan("·")} ${src}`);

	return 0;
}

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------
async function cmdUpdate(flags) {
	if (!(await ensurePi(flags))) return 127;

	const settings = readSettings(flags.local);
	if (settings.error) {
		console.error(red(`Could not parse ${settingsPath(flags.local)} — ${settings.error}`));
		return 1;
	}

	console.log(bold("pi update"));

	return spawnCommand("pi", flags.local ? ["update", "--extensions"] : ["update"], { stdio: "inherit" }).status ?? 1;
}

// ---------------------------------------------------------------------------
// doctor
// ---------------------------------------------------------------------------
function cmdDoctor(flags) {
	let problems = 0;
	let warnings = 0;
	const pass = (msg) => console.log(`  ${green("✓")} ${msg}`);
	const warn = (msg, { fatal = true } = {}) => {
		console.log(`  ${yellow("!")} ${msg}`);
		if (fatal) problems++;
		else warnings++;
	};
	const fail = (msg) => {
		console.log(`  ${red("✗")} ${msg}`);
		problems++;
	};

	printHeader("Environment");
	const nodeMajor = Number(process.versions.node.split(".")[0]);
	if (Number.isFinite(nodeMajor) && nodeMajor >= 20) pass(`Node ${process.versions.node}`);
	else fail(`Node ${process.versions.node} — LazyPi requires Node >= 20`);

	if (hasCmd("npm")) pass("npm is on PATH");
	else fail("npm is not on PATH — LazyPi can't install Pi for you");

	if (hasCmd("git")) pass("git is on PATH");
	else warn("git is not on PATH — required by git-based catalog packages");

	printHeader("Pi");
	if (hasCmd("pi")) {
		pass("`pi` is on PATH");
		const v = spawnCommand("pi", ["--version"], { encoding: "utf8" });
		const vout = (v.stdout ?? "").trim() || (v.stderr ?? "").trim();
		if (vout) pass(`pi --version: ${vout}`);
		else warn("Could not read `pi --version` output");
	} else {
		fail("`pi` is not on PATH — run `npx @tommy-ca/lazypi` to install it");
	}

	printHeader("Settings");
	const { sources, path, exists, error } = readInstalledSources(flags.local);
	if (!exists) warn(`${path} does not exist yet (Pi has not been run)`);
	else if (error) fail(`${path} is not valid JSON — ${error}`);
	else {
		pass(`${path} is readable`);
		const unpinnedGit = [...sources].filter((src) => /^git:github\.com\/[^/@]+\/[^@\s]+$/.test(src));
		for (const src of unpinnedGit) warn(`${src} is an unpinned git head — pin it to a commit for reproducible installs`, { fatal: false });
	}

	printHeader("Auth");
	const auth = detectAuth();
	for (const { provider, envVar } of auth.envProviders) pass(`env var ${envVar} → ${provider}`);
	if (auth.fileProviders.length > 0) pass(`${auth.path} → ${auth.fileProviders.join(", ")}`);
	if (!auth.authed) warn("No credentials detected — run `pi` then `/login`, or export a provider API key", { fatal: false });

	console.log("");
	if (problems === 0 && warnings === 0) {
		console.log(green("All checks passed."));
		return 0;
	}
	if (problems === 0) {
		console.log(yellow(`${warnings} warning(s) found.`));
		return 0;
	}
	console.log(yellow(`${problems} problem(s) found${warnings ? `, ${warnings} warning(s)` : ""}.`));
	return 1;
}

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------
async function cmdRemove(flags, targets) {
	if (targets.length === 0) {
		if (!isInteractive()) {
			console.error(red("Usage: npx @tommy-ca/lazypi remove <id|source> [...]"));
			return 2;
		}
		const { sources } = readInstalledSources(flags.local);
		const installedPkgs = PACKAGES.filter((p) => isPackagePresent(p, sources));
		if (installedPkgs.length === 0) {
			console.log(yellow("No catalog packages are installed."));
			return 0;
		}
		const idWidth = Math.max(...installedPkgs.map((p) => p.id.length));
		const { multiselect } = await import("@clack/prompts");
		const picked = await multiselect({
			message: "Select packages to remove",
			options: installedPkgs.map((p) => ({
				value: p.id,
				label: `${p.id.padEnd(idWidth + 2)}${p.description}`,
			})),
			required: false,
		});
		abortIfCancelled(picked);
		if (!picked.length) {
			console.log(yellow("Nothing selected."));
			return 0;
		}
		targets = picked;
	}

	const { sources: installedSources } = readInstalledSources(flags.local);
	let exitCode = 0;
	for (const target of targets) {
		// Resolve a catalog id to its source string, or pass through raw sources
		const pkg = PACKAGES.find((p) => p.id === target);
		const source = pkg ? pkg.source : target;

		const sourcesToRemove = pkg
			? [
				...[...installedSources].filter((src) => sourcesMatch(pkg.source, src)),
				...findLegacyInstalledSources(pkg, installedSources),
			]
			: [source];
		const uniqueSources = [...new Set(sourcesToRemove.length > 0 ? sourcesToRemove : [source])];
		for (const resolvedSource of uniqueSources) {
			const piArgs = flags.local ? ["remove", "-l", "--approve", resolvedSource] : ["remove", resolvedSource];
			const result = spawnCommand("pi", piArgs, { stdio: "inherit" });
			if (result.status !== 0) {
				console.error(red(`Failed to remove ${target}`));
				exitCode = 1;
				break;
			}
		}
	}
	return exitCode;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
	const flags = parseArgs(argv.slice(2));
	if (flags.version) {
		console.log(`@tommy-ca/lazypi ${VERSION}`);
		return 0;
	}
	if (flags.help) {
		printHelp();
		return flags.badArg ? 2 : 0;
	}
	switch (flags.command) {
		case "install":
			return cmdInstall(flags);
		case "status":
			return cmdStatus(flags);
		case "update":
			return cmdUpdate(flags);
		case "doctor":
			return cmdDoctor(flags);
		case "remove":
			return cmdRemove(flags, flags.targets);
		default:
			printHelp();
			return 2;
	}
}

export function resolveEntrypointUrl(scriptPath) {
	if (!scriptPath) return null;
	try {
		return pathToFileURL(realpathSync(scriptPath)).href;
	} catch {
		return pathToFileURL(resolve(scriptPath)).href;
	}
}

const entrypoint = resolveEntrypointUrl(argv[1]);

if (entrypoint === import.meta.url) {
	main().then((code) => exit(code ?? 0)).catch((err) => {
		stderr.write(`${err?.stack || err}\n`);
		exit(1);
	});
}
