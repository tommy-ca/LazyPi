# Registration identity and preservation

`source` remains the input to existing identity matching, status classification,
and exact installed-source removal. Only canonical PStack has `installSource`,
used for fresh install argv and exact clean-install assertions. Public RED tests
require both audited fresh argv and preservation of older pins. Using the pinned
argument as identity would fail old-pin recognition. Using only the unpinned
identity would not freeze fresh argv. General source matching is unchanged.

All current settings and migration helpers remain. Removing catalog rows removes
their selection and legacy-resolution metadata, not installed registrations.
Unknown removal targets keep their previous passthrough behavior. Operators must
use exact sources for retired packages. No retired compatibility list is added.

The packed driver retains its private environment, preflight, packing, and
cleanup boundary. Exact clean-install equality remains separate from seeded
preserved-profile checks. Offline fixtures prove only orchestration. They do not
prove actual archive content, native Pi, Windows behavior, or security.

The canonical manifest is static-only. Required local policy is intentionally
stricter than upstream capability minimum. Native loading, role binding,
model/tool semantics, independent child gates, headless denial, exit/recovery,
and operator promotion need separate evidence. No sandbox settings are changed.
