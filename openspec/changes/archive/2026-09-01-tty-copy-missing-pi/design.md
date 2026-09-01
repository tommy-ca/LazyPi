# Design: Missing pi qualifier and TTY option copy

## Context

`ensurePi` already matches the intended contract:

```
if (!flags.yes && !isInteractive()) {
  log.error("Install Pi first …");
  return false; // callers exit 127
}
const ok = flags.yes || (await confirm(…));
```

The live spec dropped `without --yes` on the 127 AND. Restore it. Do
not change `ensurePi`.

`askLazyOrPick` has two strings. The option label is `Install
everything`. The prompt is `Install all ${totalCount} Pi packages the
lazy way, or pick them yourself?`. Docs must name the option, not
invent `Install all (recommended)`.

## Data shape

Missing-pi 127 is `!hasCmd("pi") && !flags.yes && !isInteractive()`.
`--yes` remains auto-install. TTY remains confirm.

TTY copy is two names: option label `Install everything`, prompt
`Install all N`. Catalog documentation binds the option label and
forbids `(recommended)` on `docs/docs/installation.html` and
`docs/index.html`.

## Synthesis

Spec delta plus docs plus a catalog-docs pin. No CLI edit.

Rejected: changing `ensurePi` so non-TTY `--yes` also exits 127.
Rejected: rewriting help Default behaviour. Rejected: renaming the
prompt to Install everything.

## Docs modes

Installation and Overview Quick start are how-to. FAQ is reference.
Landing mock is a picture of the option label.
