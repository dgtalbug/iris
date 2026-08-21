## Why

The CLI contract already includes lifecycle operations such as `sync`, `adopt`, `archive`, `update`, `vendor`, and `open`, but the project still treats most of these as planned work rather than a connected operational flow. Without an explicit lifecycle layer, the generated dashboard and page set can drift from the repo, the docs, and the user’s real working state.

## What Changes

- Implement the project lifecycle commands that keep the generated `iris` structure aligned with the repository.
- Add a sync path for incremental updates and stale-state detection.
- Add a doc-adoption flow for mirroring README and related markdown artifacts into managed pages.
- Add archive and update steps for keeping the dashboard clean while preserving historical context.

## Capabilities

### New Capabilities
- project-lifecycle-automation: manage the local project surface, dashboard state, and page lifecycle without manual drift.

### Modified Capabilities
- init: expand the bootstrap flow to set up a more complete lifecycle-aware project skeleton.
- sync: formalize the incremental update behavior for feed, stale marks, and re-render decisions.
- adopt: add a concrete doc-mirroring workflow for markdown assets.
- archive: define when a page is archived and how the registry is updated.

## Impact

- The project gains a coherent operational loop rather than isolated one-off commands.
- Local documentation and generated pages stay closer to the actual repo state.
- Users can manage the dashboard and generated artifact set without manually editing page metadata.
