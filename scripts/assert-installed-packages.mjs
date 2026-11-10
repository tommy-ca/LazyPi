#!/usr/bin/env node
// Post-install assertion for a LazyPi profile. It derives the expected source
// set from PACKAGES, so a catalog edit propagates here without a second
// manifest, and it fails closed on a selection the caller cannot express
// exactly: a category name means "one tier", not "one package id".
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { PACKAGES, parseList } from "../bin/lazypi.mjs";
import { resolveAgentConfigDir } from "../bin/pi-host.mjs";

const TIERS = ["core", "optional", "all"];

export function packageSourcesFromSettings(settings) {
	return new Set(
		(settings?.packages ?? [])
			.map((entry) => typeof entry === "string" ? entry : entry?.source)
			.filter(Boolean),
	);
}

// The CLI's config directory honors PI_CODING_AGENT_DIR through the same host
// helper, so a custom agent dir cannot move the CLI's settings out from under
// this assertion.
export function defaultSettingsPath(env = process.env, home) {
	return join(resolveAgentConfigDir(env.PI_CODING_AGENT_DIR, home), "settings.json");
}

export function expectedPackageSources({ except = [], tier = "all" } = {}) {
	if (!TIERS.includes(tier)) {
		throw new Error(`Unknown tier: ${tier}\nValid tiers: ${TIERS.join(", ")}`);
	}

	// A category selector here would exclude every package in that category
	// while the caller believes it excluded a package, which is how a full-core
	// profile passed an "--except core" run with six expected sources.
	const categoriesInIds = except.filter((id) => TIERS.includes(id) && !PACKAGES.some((pkg) => pkg.id === id));
	if (categoriesInIds.length > 0) {
		throw new Error(`--except takes package ids, not categories: ${categoriesInIds.join(", ")}\nUse --tier ${categoriesInIds[0]} to assert one tier`);
	}

	const excluded = new Set(except);
	return PACKAGES
		.filter((pkg) => tier === "all" || pkg.category === tier)
		.filter((pkg) => !excluded.has(pkg.id))
		.map((pkg) => pkg.installSource ?? pkg.source);
}

function parseArgs(args) {
	const flags = {
		except: [],
		tier: "all",
		checkStatus: false,
		settingsPath: null,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--check-status") flags.checkStatus = true;
		else if (arg === "--except") flags.except = parseList(args[++i]);
		else if (arg.startsWith("--except=")) flags.except = parseList(arg.slice("--except=".length));
		else if (arg === "--tier") flags.tier = args[++i];
		else if (arg.startsWith("--tier=")) flags.tier = arg.slice("--tier=".length);
		else if (arg === "--settings") flags.settingsPath = args[++i];
		else if (arg.startsWith("--settings=")) flags.settingsPath = arg.slice("--settings=".length);
		else throw new Error(`Unknown argument: ${arg}`);
	}

	return flags;
}

function assertStatusCount(expectedCount) {
	const statusOutput = execFileSync("node", ["bin/lazypi.mjs", "status"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	const expectedLine = `Installed from LazyPi catalog (${expectedCount}/${PACKAGES.length}):`;
	assert.match(statusOutput, new RegExp(expectedLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

export function main() {
	const flags = parseArgs(process.argv.slice(2));
	const settingsPath = flags.settingsPath ?? defaultSettingsPath();
	if (!existsSync(settingsPath)) {
		throw new Error(`settings.json was not created at ${settingsPath}`);
	}

	const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
	const actualSources = packageSourcesFromSettings(settings);
	const expectedSources = expectedPackageSources({ except: flags.except, tier: flags.tier });
	const expectedSourceSet = new Set(expectedSources);
	const missing = expectedSources.filter((source) => !actualSources.has(source));
	const unexpected = [...actualSources].filter((source) => !expectedSourceSet.has(source));

	assert.deepEqual(missing, [], `Missing package sources in settings.json: ${missing.join(", ")}`);
	assert.deepEqual(unexpected, [], `Unexpected package sources in settings.json: ${unexpected.join(", ")}`);

	if (flags.checkStatus) assertStatusCount(expectedSources.length);

	console.log(`Verified ${expectedSources.length} expected package source(s) in ${settingsPath}.`);
}

const entrypoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;

if (entrypoint === import.meta.url) main();
