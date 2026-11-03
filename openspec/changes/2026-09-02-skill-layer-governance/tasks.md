# Tasks — Skill Layer Governance

Evidence gate: `npm run spec:validate` green before archive; every env action
verified with the listed commands before its checkbox closes.

## 1. Official gh skill (audit-driven, applied)

- [x] 1.1 Install official `cli/cli` gh skill via the skills manager; record
      locked in `~/.agents/.skill-lock.json` (evidence: `npx skills list`
      shows `gh` ← `cli/cli`)
- [x] 1.2 Remove third-party `cli-gh` (paulrberg) and the four accidental
      `cli/cli` bulk-add leftovers (`agentic-workflows`, `code-review`,
      `dependabot-triager`, `tech-debt-burndown`) and the manual `gh-skill`
      duplicate (evidence: `npx skills remove` reported 6 removed;
      `~/.agents/skills/` == lock == 18 entries)

## 2. Framework singularity: prune the duplicate superpowers set

- [ ] 2.1 Remove the 11 obra/superpowers skills that duplicate
      compound-engineering: `brainstorming`, `writing-plans`,
      `executing-plans`, `subagent-driven-development`,
      `systematic-debugging`, `requesting-code-review`,
      `receiving-code-review`, `using-git-worktrees`,
      `dispatching-parallel-agents`, `verification-before-completion`,
      `finishing-a-development-branch`
      (evidence: `npx skills remove <list> -g -y` → dir + lock drop to 7)
- [ ] 2.2 Keep the 3 non-duplicative superpowers skills — `test-driven-development`,
      `writing-skills`, `using-superpowers` — and hide them (hidden, not
      deleted; reachable via explicit invocation)
- [ ] 2.3 Verify resident descriptions drop toward the small visible set:
      visible user-layer ≈ 4 (evidence: `npx skills list` + system-prompt
      description count)

## 3. Visibility preference without forking the plugin

- [ ] 3.1 Configure `hiddenSkills` in `~/.pi/agent/settings.json` for the
      coldest compound-engineering skills (`ce-ideate`, `ce-session-inventory`,
      `ce-session-extract`, `ce-slack-research`, `ce-doc-review`, `ce-proof`,
      `ce-compound`, `ce-compound-refresh`, `ce-optimize`,
      `ce-gemini-imagegen`)
- [ ] 3.2 Verify the skills manager hiding respects manifest-owned skills; if
      it does not, fall back to an idempotent profile script that stamps
      `disable-model-invocation` and SHALL be re-run after every plugin
      update (record the mechanism in the harness docs)

## 4. Registry consistency invariant

- [ ] 4.1 After 2.x, confirm on-disk `~/.agents/skills/` equals lock entries
      (evidence: `npx skills list` vs `ls ~/.agents/skills/` diff-empty)
- [ ] 4.2 Document the failed-install cleanup rule from this audit
      (PromptScript copies files then fails registration) in the harness
      guidance so partial residue is removed going forward

## 5. Package hygiene (no catalog change)

- [ ] 5.1 Prune the 13 dormant dropped packages from
      `~/.pi/agent/npm/package.json` so the npm tree matches the 17 loaded
      packages (30 → 17)
- [ ] 5.2 `lazypi update` to close the 9/17 version drift
      (dynamic-workflows, subagents, web-access, btw, goal, mention-skill,
      fff, autoresearch)

## 6. MCP stays zero

- [ ] 6.1 Confirm no MCP server configs exist
      (`~/.config/mcp/mcp.json`, `~/.agents/mcp.json`, project `.mcp.json`,
      `~/.pi/agent/mcp.json` empty); record the on-demand-only policy

## 7. Docs

- [ ] 7.1 Add the two-registry layout + framework-singularity rule to the
      harness documentation (README/docs overview): which manager owns which
      skills, why compound-engineering stays on pi, official-source rule for
      gh, dead-entry check
- [ ] 7.2 Note the `gh skill` self-management path as the recommended
      centralized manager for user-layer skills

## 8. Ship

- [ ] 8.1 `npm run spec:validate` green (both `--all` and `--changes`
      passes)
- [ ] 8.2 Archive the change; commit under a Conventional Commit message
      (e.g. `spec: skill layer governance — one methodology, two registries`)