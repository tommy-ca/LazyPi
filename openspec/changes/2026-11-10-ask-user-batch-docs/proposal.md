# Document ask-user batches and settings

## Why

Upstream `pi-ask-user@0.17.2` asks batches of 2-4 questions and reads defaults from `ask-user.json`, but the package page and the catalog hint still describe a single question with no configuration surface. The page also omits that `emitFullEvents` shares answers with other extensions, which matters on a page that tells readers Ask User is not an approval boundary.

## What changes

Refresh the Ask User page to describe batches, the settings file and its precedence, and the `emitFullEvents` privacy default. Extend the catalog hint to mention batches while keeping the existing "not hard approval" clause.

## Impact

Documentation and catalog metadata only. The catalog stays at six core entries in the same order with the same sources. No installer behavior, selection semantics, release mechanics, or runtime guarantee changes. Structural readback plus the existing test and spec suites is the proportional check; there is no behavior for a RED test to describe.
