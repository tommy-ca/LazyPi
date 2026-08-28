# Lock audited installer behaviors into the spec

## Why

The e2e install audit (real pi, sandboxed `PI_CODING_AGENT_DIR`) and the
follow-up refactor changed and verified installer behavior beyond the spec
contract in three places: legacy sources are now converged even when the
replacement is already installed, `doctor` warns on unpinned git heads among
out-of-catalog sources (kept when the Git Sources requirement was removed),
and the Node >= 20 baseline is enforced by `doctor` and `package.json`
engines. Docs (10 package pages == 10 catalog ids), CI (packed smoke, real
install, self-deriving assertion), npm publishing (`publishConfig.access:
public`) and the control-plane spec were all audited and found aligned — no
deltas needed there.

## What Changes

Spec-only; behavior is already shipped and e2e-verified.

- `lazypi/installer` Idempotent Install: add the legacy-convergence scenario
  (remove legacy alongside replacement, no reinstall, failure fails the
  entry, counted as a migration).
- `lazypi/installer` Commands: add the doctor-environment scenario (Node < 20
  fails the run; unpinned git heads among out-of-catalog sources warn
  non-fatally).

## Capabilities

### Modified Capabilities

- `lazypi/installer`: two requirements gain a scenario each

## Impact

- `openspec/specs/lazypi/installer/spec.md` — delta applied at archive
- No code, docs, or CI changes