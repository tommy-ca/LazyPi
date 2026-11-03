# Check executable CI commands and portable fixtures

## Why

Substring assertions accept commented or disabled workflow commands. The update test's Unix-only launcher cannot run in the Windows suite and can inherit real Pi configuration.

## What changes

Consolidate workflow policy in one test file. Check ordered, uncommented, single-line run commands and reject unsupported conditional or multiline forms. Test mutations prove the checker rejects disabled commands. Reuse the existing Windows `.cmd` fixture pattern and isolate all settings paths.

## Impact

No dependency or workflow runtime change. The checker deliberately supports only the repository's existing unconditional single-line step format. Richer workflows require explicit contract coverage rather than silently passing.
