## Context

See proposal.md for the measurements. `src/templates/pages/spec.ts` renders every capability and change as a `spec-card` in a grid, and `sourceDetails()` emits both the rendered Markdown and an escaped `<pre>` of the same document inside a `<details>`. Nothing is lazy: a collapsed `<details>` still ships its whole body. `renderDocument()` already exists for research pages and produces heading ids plus a heading list, but it keys uniqueness off a per-call `Set`, so two documents rendered onto one page can collide.

## Goals / Non-Goals

**Goals:**

- Make the Spec index cheap to open and cheap for an agent to read.
- Give every requirement a stable anchor so a reviewer can link to one.
- Keep exact-source fidelity, bounded parsing, and inert hostile content exactly as they are.
- Reuse the research document template's shape rather than inventing a second one.

**Non-Goals:**

- Search or filtering across specs, and cross-linking requirements to the code that implements them.
- Rendering archived changes differently from active ones beyond their listing.
- Changing the parser, the snapshot format, or `iris/spec.json`.

## Decisions

### Two detail namespaces under `iris/spec/`

Capabilities render to `iris/spec/capabilities/<capability-path>/page.html` and changes to `iris/spec/changes/<change-name>/page.html`. Separate namespaces mean a capability named `changes` cannot collide with the change namespace, and nested capability paths (`platform/identity/access`) keep working because the path becomes directories. Page depth is derived from the path segment count, so `renderShell`'s existing `assetPrefix(depth)` resolves assets and navigation at any nesting level without special cases.

Alternative: one flat directory with slugified names. Rejected because slugging a nested capability path throws away the structure the parser deliberately preserves.

### Heading ids get an optional prefix

`renderDocument(value, { idPrefix })` prefixes every generated id and returns headings carrying the prefixed id. A change page renders proposal, design, tasks, and each delta spec with distinct prefixes, so two artifacts that both contain `## Why` produce `proposal-why` and `design-why`. Without a prefix the behavior is unchanged, so research pages and the existing tests are unaffected.

Alternative: render each artifact into a separate document fragment and rewrite ids afterwards. Rejected as string surgery over generated HTML when the renderer can simply be told the namespace.

### The index becomes tables, not cards

Canonical specs, active changes, and archives are uniform records, so each becomes a table row: capability or change name, source path, counts, health, and for changes a task progress bar. Tables scroll inside their own container and drop the least important columns first at narrow widths, matching the Work table's existing behavior. The index keeps the summary strip, project-context disclosures (both small), and the warnings list, because those are page-level facts rather than per-record bodies.

### Exact source stays, but only on detail pages

Every artifact keeps its escaped exact source in a disclosure on its detail page. The index carries none. This preserves the source-fidelity contract while removing the duplicate copy from the page that everyone opens first.

## Risks / Trade-offs

- [Many more generated files] → `html-check` already walks the tree and every link is generated from the same model; a test asserts every index row resolves to a file that exists.
- [Detail pages could drift from the index counts] → Both read one `OpenSpecSnapshot`; counts are computed once and passed to both.
- [Existing tests assert artifact bodies live in `spec.html`] → Move those assertions to the detail pages; the parser contract they cover is unchanged.
- [A capability path could contain unsafe segments] → Paths come from the existing bounded, confined walker; page paths are built from the already-validated capability path and rejected if a segment is not a safe slug.

## Migration Plan

1. Add the id prefix to `renderDocument` with tests, changing no existing output.
2. Add the detail templates and emit them from the render pipeline.
3. Replace the index body with tables and remove inline artifact bodies.
4. Update tests, regenerate the dogfood output, and run the release gate.

Rollback: revert; stale `iris/spec/` files are inert static HTML and the next render no longer links them.
