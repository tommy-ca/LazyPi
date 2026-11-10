## ADDED Requirements

### Requirement: Bounded native discovery probe

The native proof SHALL be a separately authorized diagnostic, not catalog activation or a readiness waiver.

#### Scenario: Exact hosted route

- **WHEN** test.yml is manually dispatched in tommy-ca/LazyPi on refs/heads/feat/strict-native-pstack-proof
- **THEN** only the native job SHALL run on ubuntu-24.04 with contents read permission and checkout credential persistence disabled
- **AND** every other existing event, repository, and ref combination SHALL retain the ordinary test job and its unchanged steps
- **AND** the driver SHALL require attempt 1, Node 22.19.0, matching workflow and checkout identities, and parent verification of the reviewed run head

#### Scenario: Private pinned installation

- **WHEN** the authorized hosted driver installs native packages
- **THEN** all installation and native execution subprocesses SHALL receive an explicit allowlisted environment and private HOME, agent, npm prefix, cache, distinct configs, work, and temporary paths
- **AND** no ambient job, model, npm, SSH, or operator credentials SHALL enter those subprocesses
- **AND** Pi 1.5.0, Subagents 0.86.0, Sandbox 0.14.1, Verdict 0.16.0, Ask User 0.17.2, and canonical f1571b8431034dcd195f4ea055ccf1c84fc14fc8 SHALL be required without Web Access
- **AND** engine or version incompatibility SHALL stop execution without upgrade or retry
- **AND** actual versions, dependency graphs, package identities, and retained installation evidence SHALL be reported
- **AND** before discovery every resolved global graph node SHALL bind to exactly one actual private cache archive receipt, independently verified SRI, matching archived name/version, and retained archive bytes
- **AND** missing, corrupt, ambiguous, wrong-identity, or unsupported alias/bundled/resolution evidence SHALL stop rather than skip nodes or fetch replacement evidence

#### Scenario: Discovery before one child

- **WHEN** the same-session public loader, explicit extension binding, tool schemas, and public Subagents list/get and preflight APIs are inspected
- **THEN** missing, duplicate, unparseable, or unsupported canonical role origins, file hashes, schemas, effective model policy, or provider routing SHALL stop before any child
- **AND** the probe SHALL NOT copy roles, synthesize canonical manifests, inject canonical skill paths, remap production models, change permission hooks, or approve UI prompts
- **AND** only an unchanged origin-verified how-explorer role inheriting the private dummy provider MAY receive one foreground delegation

#### Scenario: Correlated child evidence

- **WHEN** the conditional foreground child completes
- **THEN** success SHALL require the request, owner, node, run, and parent-child session identities, an actual successful read-tool result containing the private canary, agent_settled, normal package terminal status, and actual controller exit
- **AND** final text, progress hints, wrong canaries, mismatched identities, extra tools, additional children, unsupported routing, or missing artifacts SHALL NOT satisfy proof
- **AND** foreground metadata SHALL use the pinned index-0 artifact naming, rejecting wrong indices and duplicate metadata

#### Scenario: Deadlines and retained negatives

- **WHEN** installation, discovery, child execution, or shutdown exceeds its deadline
- **THEN** the probe SHALL fail, terminate only its owned processes, preserve bounded raw diagnostic evidence, and never retry, restart, select a second role, or fall back
- **AND** the workflow SHALL have a 20-minute bound, installation 10 minutes, discovery and child 60 seconds each, and shutdown 15 seconds
- **AND** structured chunked stdout SHALL retain hashes and byte counts rather than silently truncate evidence
- **AND** command-leader exit SHALL NOT cancel owned-group escalation or discard ownership while descendants can continue
- **AND** delayed group signals SHALL retain a live owned group keeper to avoid targeting reused process identities
- **AND** private settings SHALL disable agent retries and provider HTTP retries through the pinned supported schema, and unexpected retry events SHALL trigger immediate failure/cancellation before continuation

#### Scenario: Explicit internal entry points

- **WHEN** observer or provider receives unsupported standalone arguments
- **THEN** it SHALL exit 2 with empty stdout and stderr "Use --help for this internal probe entry point." followed by a newline
- **AND** importing either module SHALL NOT process caller arguments or print help

#### Scenario: Diagnostic limits

- **WHEN** offline fixtures or a hosted probe pass
- **THEN** offline fixtures SHALL remain explicitly non-native evidence
- **AND** hosted proof SHALL be limited to observed discovery, one foreground child read, settlement, and normal exit
- **AND** independent child enforcement, headless denial, sandbox policy, arbitrary egress confinement, crash recovery, Windows, model diversity, archive delivery, production models, and promotion SHALL remain separate unverified gates
