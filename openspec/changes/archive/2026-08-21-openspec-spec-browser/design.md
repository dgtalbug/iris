## Context

See `proposal.md` for motivation and the two delta specs for observable behavior. The current renderer rebuilds `iris/index.html` after page operations from page registry data, but it has no durable generated representation of OpenSpec. A single-page render, archive, report, or update may refresh the dashboard even though Phase 2 permits OpenSpec filesystem reads only during explicit workspace refreshes.

The repository currently proves four forms: canonical `specs/**/spec.md`, structured active change directories, structured archive directories, and legacy archived single Markdown files. Current capability paths are flat and current delta files primarily use `ADDED Requirements`; nested paths and the other delta operations need contract fixtures rather than claims of observed use.

## Goals / Non-Goals

**Goals:**

- Define one versioned normalized snapshot shared by parsing, rendering, and tests.
- Keep filesystem reads deterministic, bounded, confined, symlink-safe, and tolerant of isolated failures.
- Preserve the exact repository-relative identity of every supported OpenSpec record.
- Make Work and Spec peer dashboard views without regressing file-based navigation or accessibility.
- Make refresh ownership explicit so unrelated page operations reuse the last generated Spec snapshot.

**Non-Goals:**

- Semantic validation equivalent to `openspec validate` or use of private OpenSpec APIs.
- A full Markdown engine, editable spec UI, search index, watcher, server, or dedicated refresh command.
- Mermaid, charts, browser rendering, or general repository-document ingestion.

## Decisions

### 1. Persist a generated `iris/spec.json` snapshot

Add a versioned derived snapshot below `iris/` rather than re-reading `openspec/` every time the dashboard is regenerated. `iris init` and an explicit full render (`iris render --all`, plus the existing compatible bare `iris render` form) parse and atomically replace the snapshot before rendering the dashboard. Single-page render, report, archive, and update paths load the existing snapshot without touching OpenSpec. A missing snapshot normalizes to an undetected/empty view until the next authorized refresh.

This keeps the refresh contract observable and testable. Re-parsing inside the dashboard renderer was rejected because that renderer is called by operations that are not OpenSpec refresh actions. Extracting state back out of old HTML was rejected because generated markup is an output, not a data store.

The snapshot shape is deliberately UI-neutral:

```ts
type OpenSpecSnapshot = {
  version: 1;
  detected: boolean;
  generated_at: null;
  context: { project?: SourceDocument; config?: SourceDocument };
  canonical_specs: CapabilityRecord[];
  active_changes: ChangeRecord[];
  archived_changes: ChangeRecord[];
  legacy_archives: SourceDocument[];
  warnings: ParseWarning[];
};

type ChangeRecord = {
  name: string;
  path: string;
  lifecycle: 'active' | 'archived';
  layout: 'structured' | 'legacy';
  artifacts: { proposal?: SourceDocument; design?: SourceDocument; tasks?: TaskDocument };
  delta_specs: CapabilityRecord[];
  completeness: 'complete' | 'incomplete' | 'unknown';
  health: 'valid' | 'warning' | 'invalid';
};
```

`generated_at` stays `null`; timestamps would make unchanged renders nondeterministic. Arrays and warnings sort by normalized repository-relative path. Lifecycle, completeness, task progress, and parser health are never collapsed into one status.

### 2. Traverse only a documented allowlist with hard resource bounds

Implement a framework-free parser module that begins at the lexical and real `openspec/` root, uses `lstat`, refuses symlinks at every visited component, and never follows entries outside that root. It recognizes only:

- `config.yaml` and `project.md`;
- `specs/**/spec.md` with the full relative capability path;
- `changes/<name>/.openspec.yaml`, `proposal.md`, `design.md`, `tasks.md`, and `specs/**/spec.md`;
- the same structured files below `changes/archive/<dated-name>/`;
- top-level `changes/archive/*.md` as legacy records.

Traversal is sorted and capped by named constants for depth, supported file count, and bytes per file. The implementation will start with depth 16, 1,000 supported files, and 1 MiB per file; hitting a bound yields a warning and preserves records already read. Unrecognized files remain untouched and are not treated as general documentation.

Recursive convenience APIs and glob libraries were rejected: neither provides the required per-component symlink checks and bounded failure reporting as clearly as a small explicit walker.

### 3. Use a conservative line parser, not a Markdown runtime

Parse only structural evidence Iris needs: headings, requirement/scenario headings, delta section labels, artifact presence, and task list items. A fence state machine excludes checkbox-like lines inside backtick or tilde fences. Supported task markers are Markdown list items with `[ ]`, `[x]`, or `[X]`; directory names and archive location never affect counts.

Every source document retains its bounded raw text for a readable fallback. The renderer escapes text and attribute values before inserting them into templates. It may turn recognized structures into semantic HTML, but it never passes raw source through as HTML and never evaluates YAML, Markdown, scripts, links, or code fences. YAML is displayed as escaped source and used only for simple presence/context labels; OpenSpec semantic validity remains outside Iris's claim.

Adding a Markdown package was rejected because the required view is structural, not a general documentation renderer, and plugin/sanitizer policy would add dependency and execution surface for little benefit.

### 4. Recover per path and make unknowns visible

Parsing returns records plus warnings instead of throwing for content problems. Missing expected artifacts make a structured change incomplete. Malformed headings, unreadable files, unsafe paths, bounds, and unsupported layouts attach stable warning codes and repository-relative paths. If raw text was read safely, the UI exposes it in an escaped `<pre>` disclosure. A failure to read one file cannot remove other valid records.

Only inability to write the CLI-owned snapshot/dashboard remains a command-level error. This separates untrusted input quality from Iris output integrity.

### 5. Add peer Work/Spec tab panels to the generated dashboard

Extend `dashboardHtml` to accept the normalized snapshot and render:

```text
Work | Spec
       Overview: canonical, active, archived, open/completed tasks, warnings
       Canonical specs
       Active changes: proposal, design, tasks, delta specs
       Archive: structured changes, then legacy Markdown
```

Within Spec, native headings, lists, links/anchors, and `<details>` disclosures provide most navigation without JavaScript. The existing classic deferred script owns only tab selection, roving keyboard focus, filter focus, and theme state. Work and Spec use `role="tablist"`, `role="tab"`, and linked `tabpanel` elements; List/Board remains nested inside Work with unique control ids. Color is paired with lifecycle labels, warning text/icons, and section position.

Spec styles extend the existing generated token/component strings and introduce no literal outside `TOKENS_CSS`. Long paths and source blocks wrap or scroll inside their component without causing page-level overflow at 360 px. Reduced motion disables view transitions while retaining immediate state changes.

A separate `iris/spec.html` was rejected because the user contract calls for a top-level dashboard tab and a second entry point would fragment navigation and offline integrity checks.

### 6. Verify with real-layout copies plus synthetic contract fixtures

Create temporary-repository fixtures for every observed layout: project/config, canonical specs, both current structured active states, structured archives, and legacy archive Markdown. Add synthetic fixtures for nested capabilities; ADDED, MODIFIED, REMOVED, and RENAMED sections; fenced fake checkboxes; absent/empty workspaces; partial/malformed changes; unsafe symlinks; oversized/deep/excess entries; unreadable paths where portable; and executable-looking source.

Parser tests assert normalized values and deterministic ordering. Orchestration tests prove only init/full render refresh the snapshot. Template/navigation tests assert escaping, unique ARIA relationships, keyboard behavior contracts, both themes, reduced-motion CSS, 360 px containment hooks, classic deferred scripts, and no remote URL. Dogfood is regenerated through the built CLI and checked by the existing HTML/link gate.

## Risks / Trade-offs

- [OpenSpec formats evolve beyond the recognized subset] → retain escaped source, stable unknown-layout warnings, and path identity so the dashboard degrades honestly.
- [Large workspaces make initialization slow or output huge] → enforce explicit bounds, skip only excess inputs, and report what was omitted.
- [Persisted snapshots become stale after manual spec edits] → label refresh behavior in the UI/docs and refresh only on `init` or a full render as specified.
- [Nested tab behavior creates duplicate ids or confusing focus] → namespace Work/Spec and List/Board controls and cover ARIA/keyboard behavior in generated HTML tests.
- [Platform filesystem permissions differ] → keep portable parser fixtures primary and conditionally test permission-specific failures where the platform supports them.
- [Raw fallback text enlarges `iris/index.html`] → bound every source file and total file count; prefer collapsed disclosures and deterministic truncation warnings if the aggregate render budget is reached.

## Migration Plan

1. Add the parser, normalized model, atomic snapshot writer/loader, and fixtures without changing dashboard output.
2. Wire snapshot refresh to init and full-render entry points while other render callers reuse the stored snapshot.
3. Add Work/Spec information architecture, safe artifact rendering, and classic-script accessibility behavior.
4. Update documentation and regenerate `iris/spec.json` plus `iris/index.html` through the built CLI.
5. Verify the delta requirements, sync canonical specs, archive the change, and run the complete repository/install gate.

Rollback removes the parser/snapshot integration and regenerates `iris/` with the prior CLI. `openspec/` is read-only throughout, so no source migration or recovery is required.
