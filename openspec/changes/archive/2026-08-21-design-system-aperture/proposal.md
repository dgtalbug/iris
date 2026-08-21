## Why

The generated dashboard is functional but visually generic and leads with an empty work list instead of the repository briefing a newcomer needs. Aperture establishes an offline-safe visual identity and information hierarchy while preserving deterministic `file://` rendering.

## What Changes

- Replace the generated token palette and typography/motion values with the Aperture Tokens 2.0 contract, including automated contrast checks for both themes.
- Restyle and extend the generated base component set with aperture marks, stat tiles, pills, callouts, timelines, keyboard hints, and command-specific empty states.
- Reorder the generated dashboard into briefing hero, health strip, architecture placeholder, work surface, and project-docs strip.
- Preserve keyboard shortcuts, visible focus, reduced-motion behavior, 360 px responsiveness, classic deferred scripts, and zero network requests.
- Exclude vendored assets, Mermaid rendering, and chart blocks; those remain later changes.

## Capabilities

### New Capabilities
- `aperture-design-system`: deterministic tokens, components, accessibility behavior, and dashboard information architecture for generated iris HTML.

### Modified Capabilities

None.

## Impact

- Affects `src/templates/design.ts`, `src/commands/init.ts`, token validation, generated `iris/design/*`, generated dashboard/project HTML, and focused tests.
- Adds no runtime dependency or network request and does not change page data contracts.
