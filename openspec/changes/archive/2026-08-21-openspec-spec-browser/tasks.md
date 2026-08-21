## 1. Build the normalized OpenSpec parser

- [x] 1.1 Define the versioned snapshot, source-document, capability, change, task-progress, artifact-completeness, lifecycle, health, and warning types with deterministic empty defaults.
- [x] 1.2 Implement sorted allowlisted discovery for project/config, canonical specs, structured active/archive changes, change-local specs, and legacy archive Markdown while preserving nested capability paths.
- [x] 1.3 Add per-component confinement and symlink refusal plus explicit depth, supported-file-count, per-file-size, and aggregate-output bounds with stable path-specific warnings.
- [x] 1.4 Implement conservative line parsing for headings, requirements, scenarios, delta operations, and Markdown task checkboxes while excluding fenced examples.
- [x] 1.5 Preserve bounded raw source for fallback rendering and isolate malformed, unreadable, unknown, or partial inputs without losing valid sibling records.

## 2. Persist and orchestrate explicit snapshots

- [x] 2.1 Add deterministic atomic write/load handling for the CLI-owned `iris/spec.json` snapshot without timestamps or OpenSpec runtime dependencies.
- [x] 2.2 Refresh the snapshot during `iris init` before dashboard generation and represent missing or empty `openspec/` distinctly.
- [x] 2.3 Refresh the snapshot for explicit full renders, including `iris render --all` and the compatible bare full-render form, before rebuilding the dashboard.
- [x] 2.4 Make single-page render, report, archive, and update paths reuse the stored snapshot without reading `openspec/`.

## 3. Implement the Work and Spec information architecture

- [x] 3.1 Extend dashboard view data and templates with peer Work/`Spec` tab panels and unique nested List/Board control identities.
- [x] 3.2 Render Spec overview counts, canonical specs, active changes with proposal/design/tasks/delta specs, structured archives, and legacy archives in deterministic order.
- [x] 3.3 Render lifecycle, completeness, task progress, and parser health with independent textual/structural indicators and command-specific absent, empty, malformed, and partial states.
- [x] 3.4 Escape every source and attribute value, expose readable fallback source in bounded disclosures, and prove executable-looking content cannot become active markup.
- [x] 3.5 Extend the token-owned Aperture CSS and classic deferred script for tab semantics, roving keyboard focus, visible focus, theme parity, reduced-motion fallback, long-path handling, and 360 px responsiveness.

## 4. Cover real and adversarial filesystem layouts

- [x] 4.1 Add fixtures matching every repository-observed OpenSpec layout: project/config, canonical specs, structured active changes, structured archives, and legacy archived Markdown.
- [x] 4.2 Add synthetic contract fixtures for nested capability paths and ADDED, MODIFIED, REMOVED, and RENAMED delta sections without presenting them as repository-observed formats.
- [x] 4.3 Add parser tests for deterministic ordering, artifact availability, independent status dimensions, real checkbox totals, fenced fake checkboxes, malformed Markdown, and partial changes.
- [x] 4.4 Add safety tests for symlinks, traversal/confinement, depth/count/size bounds, isolated filesystem failures where portable, raw-source escaping, and no content execution.
- [x] 4.5 Add orchestration tests proving init/full render refresh snapshots while single-page render, report, archive, and update preserve the prior snapshot with no implicit OpenSpec read.
- [x] 4.6 Extend generated-HTML tests for Work/Spec navigation, ARIA relationships, keyboard contracts, both themes, reduced motion, classic deferred scripts, zero remote requests, 360 px layout hooks, and `file://` link integrity.

## 5. Document and dogfood the Spec browser

- [x] 5.1 Update `README.md`, `docs/cmds.md`, `docs/tech.md`, `docs/design-system.md`, `docs/status.md`, and the installed `iris-workspace` skill for supported layouts, fallback limits, explicit refresh behavior, and OpenSpec CLI independence.
- [x] 5.2 Build the CLI and regenerate this repository's `iris/spec.json`, managed assets, and dashboard through `iris init` and `iris render --all` without hand-editing generated output.
- [x] 5.3 Inspect the generated diff and run HTML/link integrity checks to confirm readable Spec navigation, retained Work behavior, and no unexpected repository-document ingestion.

## 6. Complete lifecycle verification

- [x] 6.1 Run lint, token lint, typecheck, the full Vitest suite, HTML integrity, and packed-install smoke as the complete repository gate.
- [x] 6.2 Run strict OpenSpec validation and the verification workflow, reconcile every requirement and scenario with code/test evidence, and leave no incomplete task before spec sync and archive.
