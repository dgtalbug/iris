## Why

Iris can render intentional work pages, but its dashboard does not expose the repository's actual OpenSpec workspace. Agents and maintainers need an offline, deterministic view of canonical specs and change progress without running OpenSpec, ingesting general documentation, or introducing background synchronization.

## What Changes

- Add a top-level dashboard tab labelled `Spec` that summarizes canonical specs, active changes, archived changes, project/config context, artifact availability, delta specs, and real Markdown task progress.
- Parse the `openspec/` filesystem directly during `iris init` and `iris render --all`; keep single-page renders focused on page output and avoid a new refresh command because the existing explicit full-render flow has a clear user-facing purpose.
- Support the repository's structured active/archive layouts and legacy archived Markdown while preserving nested capability paths and representing invalid, incomplete, or unknown layouts with escaped source and path-specific warnings.
- Extend the Aperture dashboard hierarchy with accessible Work/Spec top-level navigation that remains deterministic, token-only, keyboard-operable, theme-safe, reduced-motion-safe, responsive at 360 px, and functional from `file://` without network requests or runtime modules.
- Add bounded, symlink-safe filesystem traversal and fixture coverage for every observed layout plus nested capabilities and all delta-operation headings.
- Regenerate Iris dogfood only through the CLI and update the user/technical/design documentation for the new surface and refresh contract.

## Capabilities

### New Capabilities

- `openspec-spec-browser`: Deterministic parsing, normalization, refresh, fallback, and offline visualization of a repository's complete OpenSpec workspace.

### Modified Capabilities

- `aperture-design-system`: Extend the dashboard interaction and responsive hierarchy with a top-level accessible `Spec` tab while retaining the existing Work experience.

## Impact

- Affects initialization and full-render orchestration, dashboard view data, generated HTML/CSS/classic-script behavior, tests/fixtures, dogfood output, and project documentation.
- Adds no runtime dependency on OpenSpec, no server, no framework, no network request, no watcher, and no new content-ingestion command.
- OpenSpec files remain repository-owned inputs; Iris writes only its generated `iris/` output.
