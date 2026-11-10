import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const oracles = { head: JSON.parse(readFileSync(new URL('./fixtures/strict-minimal-head-oracles.json', import.meta.url))) };
const root = resolve('.');
const fixture = JSON.parse(readFileSync(new URL('./fixtures/strict-minimal-mixed.json', import.meta.url)));
function create(side, local = false) {
  const dir = mkdtempSync(join(tmpdir(), 'pr25-own-'));
  for (const name of ['home','agent','work','bin','tmp','compile']) mkdirSync(join(dir,name));
  mkdirSync(join(dir,'work/.pi'));
  const settings = join(dir,local ? 'work/.pi/settings.json' : 'agent/settings.json');
  const opposite = join(dir,local ? 'agent/settings.json' : 'work/.pi/settings.json');
  writeFileSync(settings, JSON.stringify(fixture, null, 2)+'\n');
  writeFileSync(opposite, '{"packages":["npm:opposite@1"],"keep":true}\n');
  writeFileSync(settings+'.lazypi.fixture.bak','owned existing backup\n');
  // A private which stub makes accidental bootstrap fail before any host tool.
  writeFileSync(join(dir,'bin/which'), '#!'+process.execPath+'\nprocess.exit(1);\n', {mode:0o755});
  const env = {PATH:join(dir,'bin'),HOME:join(dir,'home'),USERPROFILE:join(dir,'home'),PI_CODING_AGENT_DIR:join(dir,'agent'),TMPDIR:join(dir,'tmp'),NODE_COMPILE_CACHE:join(dir,'compile'),NO_UPDATE_NOTIFIER:'1',NO_COLOR:'1'};
  const snapshot = () => Object.fromEntries(['agent','work/.pi'].flatMap(d=>readdirSync(join(dir,d)).sort().map(n=>[d+'/'+n,readFileSync(join(dir,d,n),'utf8')])));
  const before = snapshot();
  function run(args, code, stdout, stderr) {
    const argv = [join(root,'bin/lazypi.mjs'),...args,...(local?['--local']:[])];
    const r = spawnSync(process.execPath,argv,{cwd:join(dir,'work'),env,encoding:'utf8',timeout:5000});
    assert.equal(r.error,undefined);assert.equal(r.signal,null);assert.equal(r.status,code);
    assert.equal(r.stdout,stdout);assert.equal(r.stderr,stderr);assert.deepEqual(snapshot(),before);
  }
  return {run,settings};
}
for (const side of ['head']) {
  test(`${side}: non-install selectors reject exactly and preserve both scopes and backups`,()=>{
    for (const local of [false,true]) for (const command of ['status','update','remove','doctor']) {
      const f=create(side,local);
      f.run([command,'--only','web-access'],2,oracles[side].help,'--only and --except are only supported by install\n');
    }
  });
  test(`${side}: mutually exclusive and missing selectors preserve all bytes`,()=>{
    for (const [args,error] of [[['--only','core','--except','optional'],'Use either --only or --except, not both\n'],[['--only='],'--only requires a non-empty list\n'],[['--except'],'--except requires a non-empty list\n']]) {
      const f=create(side);f.run(['install',...args],2,oracles[side].help,error);
    }
  });
  test(`${side}: local mixed status preserves pins, metadata, opposite scope and backups`,()=>{
    const f=create(side,true);f.run(['status'],0,oracles[side]['mixed-status'].replace('{settings}',f.settings),'');
  });
}
test('head: every retired selector rejects exactly before setup and preserves state',()=>{
  const retired=['pi-skillful','mention-skill','goal','btw','context-usage','simplify','fff','dynamic-workflows','ponytail','lsp','interactive-shell','autoresearch','todos','memory'];
  for (const id of retired) for (const flag of ['--only','--except']) {
    const f=create('head');f.run(['install','--yes',flag,id],2,'',`Unknown ${flag}: ${id}\nValid categories: core, optional\nValid package ids: pstack, subagents, sandbox, verdict, pi-ask-user, web-access\n`);
  }
});
test('head: empty categories and duplicate optional selectors are no-ops before setup',()=>{
  for (const args of [['--only','optional'],['--except','core'],['--only','optional,optional'],['--except','core,optional']]) {
    const f=create('head');f.run(['install','--yes',...args],0,'Nothing selected — nothing to install.\n','');
  }
});
