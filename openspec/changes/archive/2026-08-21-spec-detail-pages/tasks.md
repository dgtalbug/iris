## 1. Renderer support

- [x] 1.1 Add an optional heading-id prefix to `renderDocument` so several documents can share one page, returning prefixed ids in the heading list and leaving unprefixed output unchanged.
- [x] 1.2 Add tests for prefixed ids, collision handling across documents, and unchanged OpenSpec index output.

## 2. Detail pages

- [x] 2.1 Add a shared spec document section helper that renders one artifact with its heading namespace, table of contents entries, and exact escaped source disclosure.
- [x] 2.2 Generate a canonical spec detail page per capability at `iris/spec/capabilities/<capability-path>/page.html` with header, counts, health, requirement table of contents, rendered body, and source.
- [x] 2.3 Generate a change detail page per change at `iris/spec/changes/<change-name>/page.html` covering manifest, proposal, design, tasks with progress, and each delta spec, stating any missing artifact.
- [x] 2.4 Derive page depth from the path so shell assets and navigation resolve at any nesting level, and refuse a capability path segment that is not a safe slug.

## 3. Index page

- [x] 3.1 Replace the canonical, active-change, and archive card grids with compact tables carrying counts, health, task progress, source path, and a link to each detail page.
- [x] 3.2 Remove inline artifact bodies from the index while keeping the summary strip, project-context disclosures, and the warnings list.
- [x] 3.3 Add responsive column priority and narrow-width behavior for the new tables.

## 4. Verification and documentation

- [x] 4.1 Move artifact-body assertions from the index to the detail pages and add tests for index-to-detail link integrity, per-document id uniqueness, missing-artifact states, and nested capability paths.
- [x] 4.2 Regenerate the checked-in output, confirm `spec.html` is comparable in size to the other section pages, and run `pnpm html-check`.
- [x] 4.3 Update `docs/cmds.md`, `docs/design-system.md`, and `docs/status.md` for the index-plus-detail structure.
- [x] 4.4 Run `openspec validate spec-detail-pages --strict` and the full release gate.
