## 1. Lifecycle scaffold and setup

- [x] 1.1 Define the baseline `iris` project structure created by `init`.
- [x] 1.2 Ensure the scaffold includes the page registry, dashboard surfaces, and lifecycle metadata needed for future commands.
- [x] 1.3 Add a minimal validation pass for a fresh project init.

## 2. Sync and stale-state detection

- [x] 2.1 Implement the project sync rule set for incremental updates and stale marks.
- [x] 2.2 Decide when a page should be refreshed versus left alone.
- [x] 2.3 Add CLI output to make the state transitions discoverable.

## 3. Document adoption and mirroring

- [x] 3.1 Define the docs-to-page adoption contract for README and markdown assets.
- [x] 3.2 Add the `adopt` flow so generated pages are created from repo documentation.
- [x] 3.3 Ensure adopted content remains traceable back to the source document.

## 4. Archive and update management

- [x] 4.1 Add the archive flow for stale or superseded pages.
- [x] 4.2 Implement the update flow for managed blocks without clobbering user content.
- [x] 4.3 Keep dashboard and registry state consistent after lifecycle actions.

## 5. Validation and rollout

- [x] 5.1 Add smoke tests covering init, sync, adopt, archive, and update.
- [x] 5.2 Document the command usage and expected lifecycle behavior.
- [x] 5.3 Review the change against the project roadmap to confirm it stays scoped to lifecycle automation.
