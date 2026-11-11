#!/usr/bin/env node
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { argv, exit, stderr, stdin, stdout } from "node:process";
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
import { CATEGORIES, PACKAGES, isPackageInstalled, parseList, resolveSelection, sourcesMatch } from "./catalog.mjs";
import {
	detectAuth,
	hasCmd,
	pickWindowsWhereHit,
	quoteCmdArg,
	readInstalledSources,
	readSettings,
	resolveAgentConfigDir,
	settingsPath,
	settingsProblemMessage,
	spawnCommand,
	windowsComSpec,
	windowsSpawnArgv,
	writeSubagentOverrides,
} from "./pi-host.mjs";

// The executable keeps re-exporting every name the test suite and the CI
// scripts import from this specifier, even though the definitions now live in
// bin/catalog.mjs and bin/pi-host.mjs.
export { PACKAGES, parseList, resolveSelection, sourcesMatch } from "./catalog.mjs";
export {
	pickWindowsWhereHit,
	quoteCmdArg,
	resolveAgentConfigDir,
	windowsComSpec,
	windowsSpawnArgv,
	writeSubagentOverrides,
} from "./pi-host.mjs";

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------
// Interactivity decides whether a prompt can run; colour decides whether output
// carries ANSI codes. Both follow a TTY, and one never stands in for the other.
const colourEnabled = () => Boolean(stdout.isTTY);
const interactiveSession = () => Boolean(stdin.isTTY && stdout.isTTY);

const paint = (code) => (text) => (colourEnabled() ? `\x1b[${code}m${text}\x1b[0m` : String(text));
const bold = paint("1");
const dim = paint("2");
const red = paint("31");
const green = paint("32");
const yellow = paint("33");
const cyan = paint("36");
const blue = paint("94");
const white = paint("1;97");

function printHeader(text) {
	console.log(`\n${bold(text)}`);
}

function printSettingsProblem(current) {
	console.error(red(settingsProblemMessage(current)));
}

// Strings read from a settings or auth file are attacker-controlled input in a
// committed project, so C0, DEL, and C1 controls (ESC included) are escaped
// before they reach a terminal or a CI log.
const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f]/g;

function safeText(value) {
	return String(value).replace(CONTROL_RE, (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`);
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
// Messages
// ---------------------------------------------------------------------------
// clack and plain console rendering differ in prefix, indentation, colour,
// target stream, and whether an outro fires, so a message is a value that
// carries one rendering per mode instead of text handed to a single helper. A
// command picks its mode once, when it decides interactivity, and then only
// names messages.
const CLACK = "clack";
const PLAIN = "plain";

function outputFor(interactive) {
	const mode = interactive ? CLACK : PLAIN;
	return (message) => message[mode]();
}

function failureLines(failed) {
	return failed.map((pkg) => `- ${pkg.id} (${pkg.source})`).join("\n");
}

const messages = {
	welcome: () => ({
		[CLACK]: () => {
			console.log(renderLogo());
			intro(bold("LazyPi"));
		},
		[PLAIN]: () => {},
	}),
	abort: (reason) => ({
		[CLACK]: () => {
			log.error(reason);
			outro(red("Aborted."));
		},
		[PLAIN]: () => console.error(red(reason)),
	}),
	plan: (summary) => ({
		[CLACK]: () => note(summary, "Plan"),
		[PLAIN]: () => console.log(summary),
	}),
	nothingSelected: () => ({
		[CLACK]: () => outro("Nothing selected — nothing to install."),
		[PLAIN]: () => console.log(yellow("Nothing selected — nothing to install.")),
	}),
	step: (action) => ({
		[CLACK]: () => log.step(action),
		[PLAIN]: () => console.log(`\n→ ${action}`),
	}),
	installFailed: (id) => ({
		[CLACK]: () => log.error(`failed to install ${id}`),
		[PLAIN]: () => console.error(red(`  ✗ failed to install ${id}`)),
	}),
	done: (text) => ({
		[CLACK]: () => log.success(green(text)),
		[PLAIN]: () => console.log(green(text)),
	}),
	cheatsheet: (lines) => ({
		[CLACK]: () => note(lines.join("\n"), "What you've got"),
		[PLAIN]: () => {
			printHeader("What you've got:");
			for (const line of lines) console.log(`  ${line}`);
			console.log(dim("\nRemove pi packages with `pi remove <source>`."));
		},
	}),
	nextSteps: (title, body) => ({
		[CLACK]: () => {
			note(body, title);
			outro(green("Done."));
		},
		[PLAIN]: () => {
			printHeader(`${title}:`);
			console.log(body);
		},
	}),
	failures: (failed) => ({
		[CLACK]: () => {
			note(failureLines(failed), "Failures");
			outro(red(`Finished with ${failed.length} failure(s).`));
		},
		[PLAIN]: () => {
			console.error(red(`\nLazyPi finished with ${failed.length} failure(s):`));
			console.error(failureLines(failed));
		},
	}),
};

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
const KNOWN_COMMANDS = new Set(["install", "status", "update", "doctor", "remove"]);

function assignSelector(flags, key, raw) {
	const list = parseList(raw);
	if (list.length === 0) {
		flags.usageError ??= `--${key} requires a non-empty list`;
		return;
	}
	flags[key] = list;
}

function consumeSelector(args, i, flags, key) {
	const value = args[i + 1];
	if (value == null || value.startsWith("-")) {
		flags.usageError ??= `--${key} requires a non-empty list`;
		return i;
	}
	assignSelector(flags, key, value);
	return i + 1;
}

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
		usageError: null,
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
		else if (arg === "--only") i = consumeSelector(args, i, flags, "only");
		else if (arg.startsWith("--only=")) assignSelector(flags, "only", arg.slice("--only=".length));
		else if (arg === "--except") i = consumeSelector(args, i, flags, "except");
		else if (arg.startsWith("--except=")) assignSelector(flags, "except", arg.slice("--except=".length));
		else if (flags.command === "remove" && !arg.startsWith("-")) flags.targets.push(arg);
		else {
			console.error(red(`Unknown argument: ${arg}`));
			flags.help = true;
			flags.badArg = true;
			break;
		}
	}

	if (flags.command !== "install" && (flags.only || flags.except)) {
		flags.usageError ??= "--only and --except are only supported by install";
	}
	if (flags.only && flags.except) {
		flags.usageError ??= "Use either --only or --except, not both";
	}
	// Pi's extension update covers the global scope and trusted projects and
	// rejects `-l`, so no Pi command can update one project alone. Refuse the
	// scope here, before settings are read and before any child process starts.
	if (flags.command === "update" && flags.local) {
		flags.usageError ??= "update does not support --local: pi cannot update project extensions on their own";
	}

	return flags;
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
  update    Update extension packages with \`pi update --extensions\`
  doctor    Check your environment for common problems

${bold("Install options:")}
  --only <list>       Install only the given categories or package ids
  --except <list>     Install everything except the given categories or ids
  -l, --local         Install into the current project (.pi/settings.json)
  -y, --yes           Skip the picker and any confirmation prompt
  -h, --help          Show this help
  -V, --version       Show the installed version

${bold("Default behaviour:")}
  - All 6 catalog packages are core and installed by default, including
    Web Access. The optional category is empty.
  - On a TTY, an interactive picker appears with core pre-ticked;
    untick categories or packages before confirming.
  - With --yes, --only, or --except the picker is skipped.
  - --only and --except are install-only; other commands reject them.
  - Final selection happens before Pi setup. Cancelling or selecting
    nothing does not install Pi or packages or change settings.
  - update always runs \`pi update --extensions\`, which updates extension
    packages in the global scope and in projects Pi already trusts. It never
    self-updates the Pi harness and never changes saved project trust.
  - update rejects --local and exits 2: Pi cannot update one project's
    extensions alone.

${bold("Categories:")}
  core         pstack, subagents, sandbox, verdict, pi-ask-user, web-access (6)
  optional     empty (selector retained for compatibility)

  Unpublished registration candidate, not native integration or readiness.
  PStack fresh installs use audited f1571b8; existing canonical pins stay put.
  Sandbox is disabled until configured; Ask User is not hard approval.
  Retired ids are invalid install selectors. Installed retired sources remain
  Other, active, and eligible for broad update. Removal passthrough remains:
  retired ids no longer resolve catalog/legacy sources; use exact installed
  sources. No automatic uninstall or conflict exclusion is performed.

${bold("Examples:")}
  npx @tommy-ca/lazypi                              # core catalog (interactive picker on a TTY)
  npx @tommy-ca/lazypi --yes                        # core catalog, no prompt
  npx @tommy-ca/lazypi --only core,optional         # all 6 core entries; optional is empty
  npx @tommy-ca/lazypi --only optional              # empty selection; no setup or changes
  npx @tommy-ca/lazypi --only subagents,web-access  # individual package ids also work
  npx @tommy-ca/lazypi --only core --local          # core into the current project
  npx @tommy-ca/lazypi status
  npx @tommy-ca/lazypi doctor`);
}

// ---------------------------------------------------------------------------
// Version and auth summary
// ---------------------------------------------------------------------------
const VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

function formatAuthSummary(state) {
	const bits = [];
	for (const { provider, envVar } of state.envProviders) bits.push(`${provider} (${envVar})`);
	for (const provider of state.fileProviders) bits.push(`${safeText(provider)} (auth.json)`);
	return bits.length > 0 ? bits.join(", ") : "none detected";
}

// ---------------------------------------------------------------------------
// Interactive prompts (powered by @clack/prompts)
// ---------------------------------------------------------------------------
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
	for (const category of CATEGORIES) {
		const pkgs = PACKAGES.filter((p) => p.category === category);
		if (pkgs.length === 0) continue;
		options[category] = pkgs.map((pkg) => ({
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
async function ensurePi(flags, interactive) {
	if (hasCmd("pi")) return true;

	log.warn("Could not find the `pi` command on PATH.");
	if (!flags.yes && !interactive) {
		log.error("Install Pi first (`npm install -g @earendil-works/pi-coding-agent`), then re-run `npx @tommy-ca/lazypi`.");
		return false;
	}

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
	if (!selectedIds) return 2;

	const usedSelectionFlag = Boolean(flags.only || flags.except);
	const interactive = !flags.yes && !usedSelectionFlag && interactiveSession();
	const send = outputFor(interactive);

	send(messages.welcome());

	const settings = readSettings(flags.local);
	if (settings.problem) {
		send(messages.abort(settingsProblemMessage(settings)));
		return 2;
	}

	if (interactive) {
		const choice = await askLazyOrPick(PACKAGES.length);
		selectedIds = choice === "pick" ? await runPicker(selectedIds) : new Set(PACKAGES.map((p) => p.id));
	}

	const selected = PACKAGES.filter((p) => selectedIds.has(p.id));
	if (selected.length === 0) {
		send(messages.nothingSelected());
		return 0;
	}

	if (!(await ensurePi(flags, interactive))) return 127;

	const { sources: installedSources } = readInstalledSources(flags.local);
	const toInstall = selected.filter((pkg) => !isPackageInstalled(pkg, installedSources));
	const alreadyInstalled = selected.filter((pkg) => isPackageInstalled(pkg, installedSources));
	const scope = flags.local ? "project (.pi/settings.json)" : `global (${settingsPath(false)})`;

	send(messages.plan([
		`Target:            ${scope}`,
		`Selected:          ${selected.length}/${PACKAGES.length}`,
		`Already installed: ${alreadyInstalled.length}`,
		`Will install:      ${toInstall.length}`,
		`Pi credentials:    ${formatAuthSummary(detectAuth())}`,
	].join("\n")));

	if (selected.some((p) => p.id === "subagents")) {
		const overrideResult = writeSubagentOverrides(flags.local);
		if (!overrideResult.ok) {
			send(messages.abort(overrideResult.message));
			return 2;
		}
	}

	const failed = [];

	if (toInstall.length === 0) {
		printCheatsheet(selected, send);
		send(messages.done("Nothing to do — every selected package is already installed."));
		printNextSteps(detectAuth(), 0, send);
		return 0;
	}

	const piArgs = flags.local ? ["install", "-l", "--approve"] : ["install"];

	for (const pkg of toInstall) {
		const source = pkg.installSource ?? pkg.source;
		send(messages.step(`pi install ${source}`));
		const status = spawnCommand("pi", [...piArgs, source], { stdio: "inherit" }).status;
		if (status !== 0) {
			failed.push(pkg);
			send(messages.installFailed(pkg.id));
		}
	}

	const installedCount = toInstall.length - failed.length;
	if (failed.length === 0) {
		printCheatsheet(selected, send);
		printNextSteps(detectAuth(), installedCount, send);
		return 0;
	}

	send(messages.failures(failed));
	return 1;
}

function printNextSteps(state, installedCount, send) {
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
	send(messages.nextSteps(title, lines.join("\n")));
}

function printCheatsheet(selected, send) {
	if (selected.length === 0) return;
	send(messages.cheatsheet(selected.map((p) => `${p.id.padEnd(20)} ${p.hint}`)));
}

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------
function cmdStatus(flags) {
	const installedSettings = readInstalledSources(flags.local);
	const { sources, path, exists } = installedSettings;
	console.log(`Settings file: ${bold(path)}`);
	if (!exists) {
		console.log(yellow("  (not found — Pi has not written settings yet)"));
	} else if (installedSettings.problem) {
		// Keep the original diagnostic for the pre-existing failure mode; the
		// shared printer adds a path prefix this branch never had.
		if (installedSettings.problem.kind === "parse") {
			console.error(red(`  could not parse: ${installedSettings.problem.detail}`));
		} else {
			printSettingsProblem(installedSettings);
		}
		return 2;
	}

	const installed = PACKAGES.filter((pkg) => isPackageInstalled(pkg, sources));
	const missing = PACKAGES.filter((pkg) => !isPackageInstalled(pkg, sources));
	const others = [...sources].filter((src) => !PACKAGES.some((pkg) => sourcesMatch(pkg.source, src)));

	printHeader(`Installed from LazyPi catalog (${installed.length}/${PACKAGES.length}):`);
	const coreTotal = PACKAGES.filter((pkg) => pkg.category === "core").length;
	const optionalTotal = PACKAGES.filter((pkg) => pkg.category === "optional").length;
	const coreInstalled = installed.filter((pkg) => pkg.category === "core").length;
	const optionalInstalled = installed.filter((pkg) => pkg.category === "optional").length;
	console.log(dim(`  core ${coreInstalled}/${coreTotal}, optional ${optionalInstalled}/${optionalTotal}`));
	if (installed.length === 0) console.log(dim("  none"));
	for (const pkg of installed) {
		const installedSource = [...sources].find((src) => sourcesMatch(pkg.source, src)) ?? pkg.source;
		console.log(`  ${green("✓")} [${pkg.category}] ${pkg.id.padEnd(20)} ${dim(safeText(installedSource))}`);
	}

	printHeader(`Missing from LazyPi catalog (${missing.length}):`);
	if (missing.length === 0) console.log(dim("  none — full catalog is installed"));
	for (const pkg of missing) {
		console.log(`  ${dim("·")} [${pkg.category}] ${pkg.id.padEnd(20)} ${dim(pkg.source)}`);
	}

	printHeader(`Other Pi packages outside the LazyPi catalog (${others.length}):`);
	if (others.length === 0) console.log(dim("  none"));
	for (const src of others) console.log(`  ${cyan("·")} ${safeText(src)}`);

	return 0;
}

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------
// Bare `pi update` upgrades the Pi harness itself, so extension updates are
// asked for by name. The same argv is printed and spawned, so the header can
// never describe a different command than the one that runs.
const EXTENSION_UPDATE_ARGV = ["update", "--extensions"];

async function cmdUpdate(flags) {
	// parseArgs refuses --local for this command, so the scope is always global.
	const settings = readSettings(false);
	if (settings.problem) {
		printSettingsProblem(settings);
		return 2;
	}

	if (!(await ensurePi(flags, !flags.yes && interactiveSession()))) return 127;

	console.log(bold(`pi ${EXTENSION_UPDATE_ARGV.join(" ")}`));

	return spawnCommand("pi", EXTENSION_UPDATE_ARGV, { stdio: "inherit" }).status ?? 1;
}

// ---------------------------------------------------------------------------
// doctor
// ---------------------------------------------------------------------------
function cmdDoctor(flags) {
	const settings = readSettings(flags.local);
	if (settings.problem) {
		printSettingsProblem(settings);
		return 2;
	}

	let problems = 0;
	let warnings = 0;
	const pass = (msg) => console.log(`  ${green("✓")} ${msg}`);
	const warn = (msg, { fatal = false } = {}) => {
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

	printHeader("Pi");
	if (hasCmd("pi")) {
		pass("`pi` is on PATH");
		const v = spawnCommand("pi", ["--version"], { encoding: "utf8" });
		const vout = (v.stdout ?? "").trim() || (v.stderr ?? "").trim();
		if (v.status === 0 && vout) pass(`pi --version: ${vout}`);
		else warn("Could not read `pi --version` output");
	} else {
		fail("`pi` is not on PATH — run `npx @tommy-ca/lazypi` to install it");
	}

	printHeader("Settings");
	const installedSettings = readInstalledSources(flags.local);
	const { sources, path, exists } = installedSettings;
	if (!exists) warn(`${path} does not exist yet (Pi has not been run)`);
	else if (installedSettings.problem) fail(settingsProblemMessage(installedSettings));
	else {
		pass(`${path} is readable`);
		const unpinnedGit = [...sources].filter((src) => {
			if (!/^git:github\.com\/[^/@]+\/[^@\s]+$/.test(src)) return false;
			return !PACKAGES.some((pkg) => sourcesMatch(pkg.source, src));
		});
		for (const src of unpinnedGit) warn(`${safeText(src)} is an unpinned git head — pin it to a commit for reproducible installs`, { fatal: false });
	}

	printHeader("Auth");
	const auth = detectAuth();
	for (const { provider, envVar } of auth.envProviders) pass(`env var ${envVar} → ${provider}`);
	if (auth.fileProviders.length > 0) pass(`${auth.path} → ${auth.fileProviders.map(safeText).join(", ")}`);
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
	const installed = readInstalledSources(flags.local);
	if (installed.problem) {
		printSettingsProblem(installed);
		return 2;
	}

	if (targets.length === 0) {
		if (!interactiveSession()) {
			console.error(red("Usage: npx @tommy-ca/lazypi remove <id|source> [...]"));
			return 2;
		}
		const { sources } = installed;
		const installedPkgs = PACKAGES.filter((pkg) => isPackageInstalled(pkg, sources));
		if (installedPkgs.length === 0) {
			console.log(yellow("No catalog packages are installed."));
			return 0;
		}
		const idWidth = Math.max(...installedPkgs.map((p) => p.id.length));
		const { multiselect } = await import("@clack/prompts");
		const picked = await multiselect({
			message: "Select packages to remove",
			options: installedPkgs.map((pkg) => ({
				value: pkg.id,
				label: `${pkg.id.padEnd(idWidth + 2)}${pkg.description}`,
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

	const { sources: installedSources } = installed;
	let exitCode = 0;
	for (const target of targets) {
		const pkg = PACKAGES.find((p) => p.id === target);
		const source = pkg ? pkg.source : target;

		const matched = pkg ? [...installedSources].filter((src) => sourcesMatch(pkg.source, src)) : [];
		const uniqueSources = [...new Set(matched.length > 0 ? matched : [source])];
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
	if (flags.version && !flags.usageError && !flags.badArg) {
		console.log(`@tommy-ca/lazypi ${VERSION}`);
		return 0;
	}
	if (flags.usageError) {
		console.error(red(flags.usageError));
		printHelp();
		return 2;
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
