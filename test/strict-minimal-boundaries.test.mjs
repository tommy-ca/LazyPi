import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCliSandbox } from './helpers/cli-spawn.mjs';
const oracles = { head: JSON.parse(readFileSync(new URL('./fixtures/strict-minimal-head-oracles.json', import.meta.url))) };
const fixture = JSON.parse(readFileSync(new URL('./fixtures/strict-minimal-mixed.json', import.meta.url)));
function create(t, local = false) {
  const sandbox = createCliSandbox(t, { prefix: 'pr25-own-' });
  const dir = sandbox.root;
  const settings = sandbox.settingsPath(local);
  const opposite = local ? sandbox.settingsPath() : join(sandbox.work, '.pi', 'settings.json');
  // No `pi` and no `npm` at all: every case below must fail or no-op before any
  // package command, as the fixture with an always-failing `which` did before.
  sandbox.removeStub('pi');
  sandbox.removeStub('npm');
  mkdirSync(join(dir, 'compile'), { recursive: true });
  const env = { NODE_COMPILE_CACHE: join(dir, 'compile') };
  writeFileSync(settings, JSON.stringify(fixture, null, 2) + '\n');
  writeFileSync(opposite, '{"packages":["npm:opposite@1"],"keep":true}\n');
  writeFileSync(settings + '.lazypi.fixture.bak', 'owned existing backup\n');
  const snapshot = () => Object.fromEntries(['agent', 'work/.pi'].flatMap(d => readdirSync(join(dir, d)).sort().map(n => [d + '/' + n, readFileSync(join(dir, d, n), 'utf8')])));
  const before = snapshot();
  function run(args, code, stdout, stderr) {
    const r = sandbox.run([...args, ...(local ? ['--local'] : [])], { env });
    assert.equal(r.error, undefined); assert.equal(r.signal, null); assert.equal(r.status, code);
    assert.equal(r.stdout, stdout); assert.equal(r.stderr, stderr); assert.deepEqual(snapshot(), before);
  }
  return { run, settings };
}
for (const side of ['head']) {
  test(`${side}: non-install selectors reject exactly and preserve both scopes and backups`, (t) => {
    for (const local of [false, true]) for (const command of ['status', 'update', 'remove', 'doctor']) {
      const f = create(t, local);
      f.run([command, '--only', 'web-access'], 2, oracles[side].help, '--only and --except are only supported by install\n');
    }
  });
  test(`${side}: mutually exclusive and missing selectors preserve all bytes`, (t) => {
    for (const [args, error] of [[['--only', 'core', '--except', 'optional'], 'Use either --only or --except, not both\n'], [['--only='], '--only requires a non-empty list\n'], [['--except'], '--except requires a non-empty list\n']]) {
      const f = create(t); f.run(['install', ...args], 2, oracles[side].help, error);
    }
  });
  test(`${side}: local mixed status preserves pins, metadata, opposite scope and backups`, (t) => {
    const f = create(t, true); f.run(['status'], 0, oracles[side]['mixed-status'].replace('{settings}', f.settings), '');
  });
}
test('head: every retired selector rejects exactly before setup and preserves state', (t) => {
  const retired = ['pi-skillful', 'mention-skill', 'goal', 'btw', 'context-usage', 'simplify', 'fff', 'dynamic-workflows', 'ponytail', 'lsp', 'interactive-shell', 'autoresearch', 'todos', 'memory'];
  for (const id of retired) for (const flag of ['--only', '--except']) {
    const f = create(t); f.run(['install', '--yes', flag, id], 2, '', `Unknown ${flag}: ${id}\nValid categories: core, optional\nValid package ids: pstack, subagents, sandbox, verdict, pi-ask-user, web-access\n`);
  }
});
test('head: empty categories and duplicate optional selectors are no-ops before setup', (t) => {
  for (const args of [['--only', 'optional'], ['--except', 'core'], ['--only', 'optional,optional'], ['--except', 'core,optional']]) {
    const f = create(t); f.run(['install', '--yes', ...args], 0, 'Nothing selected — nothing to install.\n', '');
  }
});
