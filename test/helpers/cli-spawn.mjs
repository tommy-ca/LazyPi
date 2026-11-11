// The one place a test may build a child environment for bin/lazypi.mjs.
//
// Every fixture child gets stub `pi`, `npm`, `git` and `which` executables in a
// single private bin directory, and PATH holds that directory alone: no inherited PATH,
// no /usr/bin or /bin, and not the running Node install directory, which also
// contains a real `npm`. A stub that is missing breaks the caller with a clear
// message, so absence can never fall back to a real tool.
//
// Each stub starts through an absolute Node shebang, so running it needs no PATH
// lookup, and each invocation is recorded as one JSON line with its argv and its
// exit status. The CLI resolves commands by walking this PATH itself, so a
// command with no stub directory entry fails as not-found in the child and can
// never reach a real tool.
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const CLI_PATH = fileURLToPath(new URL("../../bin/lazypi.mjs", import.meta.url));
const RECORD_PREFIX = `import { appendFileSync as __lazypiRecord } from "node:fs";
const __lazypiEntry = { command: %NAME%, argv: process.argv.slice(2) };
process.on("exit", (status) => __lazypiRecord(%CALLS%, JSON.stringify({ ...__lazypiEntry, status: status ?? null }) + "\\n"));
`;

function whichStub(bin) {
	return `import { existsSync } from "node:fs";
const __lazypiBin = ${JSON.stringify(bin)};
const name = process.argv[2];
if (!name) process.exit(1);
const path = __lazypiBin + "/" + name;
if (!existsSync(path) && !existsSync(path + ".cmd") && !existsSync(path + ".mjs")) process.exit(1);
process.stdout.write(path + "\\n");
`;
}

const DEFAULT_STUBS = {
	pi: `if (process.argv[2] === "--version") process.stdout.write("pi test\\n");\n`,
	npm: `console.error("unexpected npm bootstrap");\nprocess.exit(99);\n`,
	// `doctor` asks whether git exists; the stub answers the lookup and never runs.
	git: `\n`,
};

function quotePosix(value) {
	return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function createCliSandbox(t, { prefix = "lazypi-cli-", stubs = {} } = {}) {
	const root = mkdtempSync(join(tmpdir(), prefix));
	t.after(() => rmSync(root, { recursive: true, force: true }));
	const names = ["bin", "home", "agent", "work", "tmp", "config", "cache", "data", "state", "npm-cache"];
	const dirs = Object.fromEntries(names.map((name) => [name, join(root, name)]));
	for (const dir of Object.values(dirs)) mkdirSync(dir, { recursive: true });
	mkdirSync(join(dirs.work, ".pi"), { recursive: true });
	const npmrc = join(root, "npmrc");
	writeFileSync(npmrc, "");
	const callsPath = join(root, "calls.jsonl");
	writeFileSync(callsPath, "");

	const bin = dirs.bin;
	const env = Object.freeze({
		PATH: bin,
		HOME: dirs.home,
		USERPROFILE: dirs.home,
		PI_CODING_AGENT_DIR: dirs.agent,
		TMPDIR: dirs.tmp,
		TMP: dirs.tmp,
		TEMP: dirs.tmp,
		XDG_CONFIG_HOME: dirs.config,
		XDG_CACHE_HOME: dirs.cache,
		XDG_DATA_HOME: dirs.data,
		XDG_STATE_HOME: dirs.state,
		npm_config_cache: dirs["npm-cache"],
		npm_config_userconfig: npmrc,
		npm_config_globalconfig: npmrc,
		TERM: "dumb",
		NO_COLOR: "1",
		NO_UPDATE_NOTIFIER: "1",
	});

	// Names a test deliberately removed are the only ones allowed to be absent.
	const expectedMissing = new Set();
	let consumed = 0;

	function writeStub(name, body) {
		const wrapper = RECORD_PREFIX.replace("%NAME%", JSON.stringify(name)).replace("%CALLS%", JSON.stringify(callsPath));
		const source = `${wrapper}${body}\n`;
		const target = join(bin, name);
		if (process.platform === "win32") {
			writeFileSync(join(bin, `${name}.mjs`), source);
			writeFileSync(join(bin, `${name}.cmd`), `@echo off\r\n"${process.execPath}" "%~dp0${name}.mjs" %*\r\n`);
			return;
		}
		writeFileSync(target, `#!${process.execPath}\n${source}`);
		chmodSync(target, 0o755);
		expectedMissing.delete(name);
	}

	function hasStub(name) {
		return existsSync(join(bin, name)) || existsSync(join(bin, `${name}.mjs`)) || existsSync(join(bin, `${name}.cmd`));
	}

	function records() {
		return readFileSync(callsPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line));
	}

	function note(command, args, status) {
		writeFileSync(callsPath, `${readFileSync(callsPath, "utf8")}${JSON.stringify({ command, argv: args, status: status ?? null })}\n`);
	}

	function settle() {
		const all = records();
		const fresh = all.slice(consumed);
		consumed = all.length;
		const missing = fresh.filter((record) => record.command === "which" && record.status !== 0 && !expectedMissing.has(record.argv[0]));
		if (missing.length === 0) return;
		const name = missing[0].argv[0];
		throw new Error(
			`the child requested the command "${name}", but the isolated fixture PATH has no stub for it.\n` +
				`  isolated stub directory: ${bin}\n` +
				`  PATH: ${env.PATH}\n` +
				`Add one with sandbox.stub("${name}", "<node body>"), or remove it on purpose with sandbox.removeStub("${name}").`,
		);
	}

	// A command name is looked up in the stub directory; a path is launched as
	// given. Windows absolute paths use backslashes and a drive letter, so testing
	// for a forward slash alone would mistake the Node executable for a stub name.
	function isPathCommand(command) {
		return isAbsolute(command) || command.includes("/") || command.includes("\\");
	}

	function spawn(command, args = [], options = {}) {
		const { cwd = dirs.work, env: extraEnv = {}, timeout = 30_000 } = options;
		if (!isPathCommand(command) && !hasStub(command)) {
			throw new Error(`the test asked for "${command}", but the isolated fixture PATH has no stub for it.\n  isolated stub directory: ${bin}\nAdd one with sandbox.stub("${command}", "<node body>").`);
		}
		const result = spawnSync(command, args, { cwd, env: { ...env, ...extraEnv }, encoding: "utf8", timeout });
		settle();
		return result;
	}

	function run(args, options = {}) {
		const { wrapper, ...rest } = options;
		const plan = wrapper ? wrapper([process.execPath, CLI_PATH, ...args]) : { command: process.execPath, args: [CLI_PATH, ...args] };
		const result = spawn(plan.command, plan.args, rest);
		note("lazypi", args, result.status);
		return result;
	}

	const sandbox = {
		root,
		dirs,
		bin,
		home: dirs.home,
		agent: dirs.agent,
		work: dirs.work,
		env,
		hasStub,
		stub(name, body) {
			writeStub(name, body);
			return sandbox;
		},
		removeStub(name) {
			expectedMissing.add(name);
			for (const suffix of ["", ".mjs", ".cmd"]) rmSync(join(bin, `${name}${suffix}`), { force: true });
			return sandbox;
		},
		// A fixture that models a tool becoming available declares the name here:
		// only declared absences may answer `which` with not-found.
		mayBeAbsent(name) {
			expectedMissing.add(name);
			return sandbox;
		},
		calls: records,
		external() {
			return records().filter((record) => record.command !== "which" && record.command !== "lazypi");
		},
		queries() {
			return records().filter((record) => record.command === "which");
		},
		run,
		spawn,
		// A tty runner needs one shell string, so the CLI is quoted here instead.
		shellCommand(args = [], { prefix: lead = "" } = {}) {
			return `${lead}${[process.execPath, CLI_PATH, ...args].map(quotePosix).join(" ")}`;
		},
		settingsPath(local = false) {
			return local ? join(dirs.work, ".pi", "settings.json") : join(dirs.agent, "settings.json");
		},
		authPath() {
			return join(dirs.agent, "auth.json");
		},
		entries(dir) {
			return readdirSync(dir).sort();
		},
		backups(dir) {
			return readdirSync(dir).filter((name) => name.endsWith(".bak")).sort();
		},
	};

	writeStub("which", whichStub(bin));
	for (const [name, body] of Object.entries({ ...DEFAULT_STUBS, ...stubs })) writeStub(name, body);
	return sandbox;
}
