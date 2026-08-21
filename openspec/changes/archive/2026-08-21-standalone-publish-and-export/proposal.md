## Why

A local-first tool becomes far more useful when it can hand off a page as a portable artifact without depending on the active repo or a remote viewer. The current roadmap already defines `publish` and `export` commands, but they still need a clear path to generate shareable, standalone outputs that remain offline-safe and easy to inspect.

## What Changes

- Implement the publish flow for standalone, portable HTML output.
- Implement the single-file export mode and make every deferred mode fail explicitly instead of emitting a mislabeled artifact.
- Keep generated artifacts self-contained and stable enough to share outside the repo.
- Preserve the local-first design by avoiding any required cloud or remote dependency.

## Capabilities

### New Capabilities
- standalone-publish-and-export: create portable, standalone artifacts from project pages while keeping them offline-safe and easy to share.

### Modified Capabilities
- publish: formalize the output contract for single-file static artifacts.
- export: add the proper export modes and file handling logic.

## Impact

- Users can share a rendered artifact without requiring a live local project checkout.
- Design handoff and review becomes easier because a page can be exported to a portable artifact.
- The project remains faithful to its local-first positioning while still supporting distribution and offline shareability.
