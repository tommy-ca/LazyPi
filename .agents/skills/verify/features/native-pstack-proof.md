# Native PStack proof

This is a bounded diagnostic, not an installation or readiness gate waiver. Do not run native Pi or extensions locally under this recipe. Local checks execute only LazyPi-owned Node fixtures.

## Offline commands

Run from the checkout with cached dependencies:

```sh
node scripts/native-pstack-proof.mjs --help
node --test test/native-pstack-proof.test.mjs
node --test test/ci-workflows.test.mjs
npm test
npm run spec:validate
node --check scripts/native-pstack-proof.mjs
node --check scripts/native-pstack-observer.mjs
node --check scripts/native-pstack-provider.mjs
```

The tests use fake phase transports, owned Node subprocesses, an owned HTTP server, gzip/ustar archive fixtures, and a locally authored fake SDK entry point. They do not import Pi, execute the passive reference corpus, install packages, or contact a model service. Fixture evidence lives in a fresh system temporary directory (`mkdtemp` under `os.tmpdir()`), never inside the checkout, and the test process removes that directory when it exits. Retention is therefore a run, not a tree: copy anything you need from the temporary directory while the run is alive, or reassemble it from the structured stdout records. Fixture success means only that the diagnostic accepts or rejects the supplied evidence correctly.

`runProof(transport, options)` is the shared lifecycle entry point for owned fixture transports and the hosted adapter. Its phases are `install`, `discover`, `child`, `shutdown`, and `terminate`. `validateDiscovery` and `validateChild` reject unsupported evidence. These library functions are not hosted acceptance switches. The CLI has only `--help` and `--hosted`; unknown arguments exit 2. Observer and provider `--help` describe their internal roles. Their unsupported standalone arguments exit 2 with empty stdout and exact stderr `Use --help for this internal probe entry point.\n`. Imports are inert: they do not inspect caller arguments or print help. The observer accepts only the IPC-only `--controller ROOT SDK_ROOT CANARY` form with exactly those three arguments.

## Hosted command and prerequisites

`node scripts/native-pstack-proof.mjs --hosted` is for the single separately authorized fresh GitHub-hosted VM only. Do not invoke it locally to test native behavior. The registered `.github/workflows/test.yml` has no new inputs. Its native job requires all three conditions:

- Event `workflow_dispatch`.
- Repository `tommy-ca/LazyPi`.
- Ref `refs/heads/feat/strict-native-pstack-proof`.

Every other combination keeps the ordinary job and its original steps. The native job uses Ubuntu 24.04, Node 22.19.0, contents-read permission, and checkout of `github.sha` without persisted credentials. The driver requires attempt 1 and matching checkout/workflow SHA and workflow ref. Parent must precheck the independently reviewed feature tip and postcheck the returned run head. Drift invalidates the attempt, not authorization to retry. No dispatch is part of offline verification.

The driver creates a private root under job `RUNNER_TEMP`. Installation and native-controller processes receive only its explicit environment, not a filtered copy of the job environment. HOME, Pi state, npm prefix/cache/config, Git config, XDG state, temporary files, work, and canary are private. npm user and global configs are distinct. Job tokens and production credentials do not enter npm, Pi, extensions, or child state.

The exact matrix is Pi 1.5.0, pi-subagents 0.86.0, pi-better-sandbox 0.14.1, pi-verdict 0.16.0, and pi-ask-user 0.17.2. Canonical PStack is f1571b8431034dcd195f4ea055ccf1c84fc14fc8. Web Access is omitted. Engine-strict installation and actual version checks fail rather than upgrade or retry. This proposed matrix is not a runtime compatibility claim.

Before discovery, the driver binds every node in the actual `npm ls --global --all --long --json` graph to one private download-cache entry with the exact resolved registry tarball URL. npm documents `_cacache` as opaque and directs programmatic readers to `cacache`; the driver uses the API bundled with the actual npm executable, without installing a dependency or fetching missing data. It records that reader's path, retrieves bytes through `cacache.ls`/`cacache.get`, independently verifies SRI and tar identity, and retains selected archive chunks and per-node path/name/version/resolution/integrity receipts. Missing, ambiguous, corrupt, or wrong-identity evidence stops before discovery and child dispatch. Aliases, bundled nodes without independent resolution/identity receipts, non-registry URLs, and unsupported extended tar headers stop explicitly; they are never silently omitted or synthesized. The support graph and support lockfile remain separate evidence. Archives are limited to 16 MiB each, 32 MiB total, and 64 MiB decompressed each. Receipt bounds are fail-closed, not permission for a second attempt.

Private `settings.json` uses the pinned schema's `retry.enabled: false` and nested `retry.provider.maxRetries: 0`, preserving package registrations. The SDK SettingsManager getters must confirm those values before prompting; Subagents creates child SettingsManager instances from the same agent directory. These disable agent-level and provider HTTP retries respectively. Unexpected parent retry events immediately mark failure and queue cancellation after Pi creates its backoff controller; the next parent provider hook also rejects. Correlated child retry diagnostics trigger public delegation cancellation and a negative result. These are source-backed configuration and offline transport checks, not observations of the installed SDK.

## Public API bindings

The implementation follows the pinned public npm archives, not host-installed SDKs:

- Pi `DefaultResourceLoader`, `reload`, `getSkills`, `getExtensions`, and the identical `session.resourceLoader` report loaded resources. `session.getAllTools()` reports actual schemas and source metadata.
- Pi `createAgentSession` plus explicit `session.bindExtensions` initializes the extension context. The SDK's `14-codemode-mcp.ts` example demonstrates the binding call. Probe instrumentation is an inline factory, not canonical code.
- The deterministic parent transcript calls public `subagents_enable`, then `subagent` list/get. The 0.86.0 get formatter's `Path:` record supplies origin. Capability rows are not used as origin evidence.
- `pi-subagents/preflight.resolveSubagentLaunchContract` checks effective inherited model, tools, skills, origin candidates, extension requirements, and diagnostics before dispatch. Unsupported or host-required diagnostics fail closed.
- `pi-subagents/delegation` supplies the public foreground request/response event constants and request/owner/node tuple. No private discoverAgents or schedule-management RPC is used.
- Pinned `getArtifactPaths(..., index=0)` produces `<run>_how-explorer_0_meta.json`; the foreground executor supplies index 0. Wrong indices, duplicate metadata, and mismatched terminal/artifact identities fail. Foreground artifact metadata binds run and parent session identity. Raw child JSONL contains actual tool execution and `agent_settled`. A persisted child session header must identify the parent session file.

Only the pinned `agents/how-explorer.md` hash is eligible. Its unchanged definition declares no model and disables inherited skills. The controller neither registers canonical agents nor injects their paths. Standard package discovery may not expose this role. Missing roles are an expected possible negative outcome, never permission to manufacture discovery.

Preflight still omits `sessionRoot`/`sessionDir`. The pinned implementation emits `host_required` without them, and the driver retains and rejects that diagnostic. The parent's public `getSessionDir()` does not establish Subagents' actual child-session-root policy, which the executor obtains from a host dependency. This preparation does not invent that root or relax diagnostics. The fake SDK artifact fixture supplies its own preflight result solely to test the subsequent artifact gate; its positive is not a claim that real preflight succeeds.

The dummy `lazypi-native-proof/canary` provider exists only in private models configuration and speaks OpenAI Chat Completions on loopback. It never redirects a production model ID. Discovery precedes child authorization. The child transcript requests exactly one read, then checks the tool response before returning final text. Final text is not evidence of the read.

## Evidence and failure handling

The workflow limit is 20 minutes. Installation has 10 minutes, startup/discovery 60 seconds, the child 60 seconds, and normal shutdown 15 seconds. Timeout or unsupported evidence fails without a retry, restart, alternative role, or fallback transport. Cleanup signals only the driver's owned process groups. Each subprocess runs under a probe-owned, TERM-resistant group keeper; the keeper reserves its PID/PGID until final SIGKILL. Escalation and ownership survive command-leader exit, and termination waits for owned keepers to close. Normal command exit status is reported separately from group-keeper cleanup, avoiding delayed signals to a reused leader PID/PGID. There is no sandbox or firewall configuration change.

Structured stdout records carry `kind`, SHA256, original byte count, byte offset, encoding, and base64 chunks. Reassemble matching chunks in offset order and verify byte count and hash. A record over the explicit bound fails rather than silently truncates. Platform logs are the readback channel; no upload service or write credential is added. Retained records include exact argv/cwd/allowlisted environment, package versions and graphs, resources and hashes, schemas, provider transcript, delegation identities, child artifacts, negatives, and actual controller close status. Do not share unrelated job environment or real profile contents.

A foreground child is a session inside the controller, not a separate OS process. Its package `exitCode` and settlement are separate from the controller's actual process close. A scoped positive requires both.

## Limits

Private HOME and loopback are not egress confinement. Installed permission extensions remain unchanged; no synthetic approval UI is supplied. Unsupported interaction or routing stops the diagnostic.

Even a successful hosted result proves only observed discovery, one foreground child read, settlement, and normal exit. It does not prove parent LLM selection quality, independent child enforcement, headless denial, sandbox configuration, arbitrary egress confinement, crash recovery, Windows, model diversity, archive delivery, production-model behavior, or promotion. Full native readiness gates stay active.
