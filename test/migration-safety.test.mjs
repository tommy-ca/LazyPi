import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve("bin/lazypi.mjs");

for (const local of [false, true]) {
	test(`${local ? "local" : "global"} failed retained install preserves retired legacy registration`, { skip: process.platform === "win32" }, () => {
		const root = mkdtempSync(join(tmpdir(), "retired-migration-"));
		for (const dir of ["home", "agent", "work", "bin", "work/.pi"]) {
			mkdirSync(join(root, dir), { recursive: true });
		}
		const settings = join(root, local ? "work/.pi/settings.json" : "agent/settings.json");
		const before = '{"packages":[{"source":"npm:pi-btw@0.1.0","metadata":true}],"keep":true}\n';
		writeFileSync(settings, before);
		const calls = join(root, "calls.jsonl");
		writeFileSync(calls, "");
		for (const [name, body] of [
			["which", `console.log(${JSON.stringify(join(root, "bin"))}+'/'+process.argv[2]);`],
			["pi", `import { appendFileSync } from 'node:fs';
appendFileSync(${JSON.stringify(calls)}, JSON.stringify(process.argv.slice(2))+'\\n');
process.exit(1);`],
			["npm", "process.exit(99);"],
		]) {
			const path = join(root, "bin", name);
			writeFileSync(path, `#!${process.execPath}\n${body}`);
			chmodSync(path, 0o755);
		}
		const r = spawnSync(process.execPath, [cli, "install", "--yes", "--only", "verdict", ...(local ? ["--local"] : [])], {
			cwd: join(root, "work"),
			env: {
				PATH: join(root, "bin"), HOME: join(root, "home"), USERPROFILE: join(root, "home"),
				PI_CODING_AGENT_DIR: join(root, "agent"), TMPDIR: root,
			},
			encoding: "utf8",
		});
		assert.equal(r.error, undefined);
		assert.equal(r.status, 1);
		assert.match(r.stdout, /Will install:      1\n/);
		assert.equal(r.stderr, "  ✗ failed to install verdict\n\nLazyPi finished with 1 failure(s):\n- verdict (npm:pi-verdict)\n");
		assert.deepEqual(readFileSync(calls, "utf8").trim().split("\n").map(JSON.parse), [
			["install", ...(local ? ["-l", "--approve"] : []), "npm:pi-verdict"],
		]);
		assert.equal(readFileSync(settings, "utf8"), before);
	});
}
