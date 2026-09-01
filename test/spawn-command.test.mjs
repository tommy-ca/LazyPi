import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { buildSpawnOptions, resolveEntrypointUrl, windowsSpawnArgv } from "../bin/lazypi.mjs";

test("buildSpawnOptions does not force shell on Windows by default", () => {
	assert.deepEqual(buildSpawnOptions({ stdio: "inherit" }, "win32"), {
		stdio: "inherit",
	});
});

test("buildSpawnOptions preserves an explicit shell override on Windows", () => {
	assert.deepEqual(buildSpawnOptions({ stdio: "inherit", shell: true }, "win32"), {
		stdio: "inherit",
		shell: true,
	});
	assert.deepEqual(buildSpawnOptions({ stdio: "inherit", shell: false }, "win32"), {
		stdio: "inherit",
		shell: false,
	});
});

test("buildSpawnOptions leaves Unix options unchanged", () => {
	assert.deepEqual(buildSpawnOptions({ stdio: "inherit" }, "linux"), {
		stdio: "inherit",
	});
});

test("windowsSpawnArgv wraps .cmd as ComSpec argv", () => {
	const previous = process.env.ComSpec;
	process.env.ComSpec = "C:\\Windows\\system32\\cmd.exe";
	try {
		assert.deepEqual(windowsSpawnArgv("C:\\npm.cmd", ["install", "-g", "pkg"], "win32"), {
			command: "C:\\Windows\\system32\\cmd.exe",
			args: ["/d", "/s", "/c", "C:\\npm.cmd", "install", "-g", "pkg"],
		});
	} finally {
		if (previous == null) delete process.env.ComSpec;
		else process.env.ComSpec = previous;
	}
});

test("windowsSpawnArgv wraps .bat as ComSpec argv", () => {
	assert.deepEqual(windowsSpawnArgv("C:\\pi.bat", ["install", "npm:pkg"], "win32"), {
		command: process.env.ComSpec || "cmd.exe",
		args: ["/d", "/s", "/c", "C:\\pi.bat", "install", "npm:pkg"],
	});
});

test("windowsSpawnArgv leaves a non-cmd path as file plus args", () => {
	assert.deepEqual(windowsSpawnArgv("C:\\npm.exe", ["install", "-g", "pkg"], "win32"), {
		command: "C:\\npm.exe",
		args: ["install", "-g", "pkg"],
	});
});

test("windowsSpawnArgv leaves Unix paths unchanged", () => {
	assert.deepEqual(windowsSpawnArgv("/usr/bin/npm", ["install", "-g", "pkg"], "linux"), {
		command: "/usr/bin/npm",
		args: ["install", "-g", "pkg"],
	});
});

test("resolveEntrypointUrl resolves symlinked bin paths to the module url", () => {
	const tmp = mkdtempSync(join(tmpdir(), "lazypi-entrypoint-"));
	const targetPath = fileURLToPath(new URL("../bin/lazypi.mjs", import.meta.url));
	const symlinkPath = join(tmp, "lazypi");
	symlinkSync(targetPath, symlinkPath);

	assert.equal(resolveEntrypointUrl(targetPath), new URL("../bin/lazypi.mjs", import.meta.url).href);
	assert.equal(resolveEntrypointUrl(symlinkPath), new URL("../bin/lazypi.mjs", import.meta.url).href);
});

test("resolveEntrypointUrl falls back to a resolved path when realpath lookup fails", () => {
	const tmp = mkdtempSync(join(tmpdir(), "lazypi-entrypoint-fallback-"));
	const missingPath = join(tmp, "missing.mjs");
	assert.equal(resolveEntrypointUrl(missingPath), pathToFileURL(missingPath).href);
});

