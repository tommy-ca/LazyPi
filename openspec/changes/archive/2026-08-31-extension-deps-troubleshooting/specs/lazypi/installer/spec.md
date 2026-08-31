# Installer Specification (lazypi)

## ADDED Requirements

### Requirement: Troubleshooting

The docs SHALL explain how to repair a catalog package whose runtime
dependency installation is missing or broken, so the operator can recover
without reinstalling Pi or LazyPi.

#### Scenario: Broken dependency footprint

- **WHEN** a catalog package fails at runtime with a missing dependency —
  for example pi-subagents and `Cannot find module 'acorn'`
- **THEN** the FAQ SHALL explain that the installed footprint is
  incomplete even though the package is present in settings
- **AND** the updating docs SHALL tell the operator to run `pi update` (or
  `npx @tommy-ca/lazypi update`) or reinstall the package
- **AND** the docs SHALL mention removing a stale
  `~/.pi/agent/extensions/<name>` checkout that shadows the package in
  the npm store