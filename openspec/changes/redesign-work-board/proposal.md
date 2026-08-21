## Why

Iris's Work surface is visually spacious, exposes only coarse List/Board layouts, and navigates away from the dashboard before users can inspect an item. A denser, context-preserving work browser is needed so repositories with many agent-authored records remain quickly scannable across desktop and narrow screens.

## What Changes

- Replace the current List/Board switcher with peer List, Table, and Kanban views that share one filter and the same real Iris contract data.
- Introduce compact work-item hierarchy for type, ID, title, status, priority, update time, and owner, while displaying unavailable fields honestly rather than inventing values.
- Open work items in an accessible right-side detail drawer with description/evidence, an explicit full-page action, Escape/backdrop close behavior, focus containment and return, and a full-screen 360 px treatment.
- Evolve Aperture semantic tokens and component styles for neutral density, selected/hover states, status, priority, work type, focus, and responsive column priority.
- Preserve deterministic static HTML, `file://`, classic deferred JavaScript, both themes, reduced motion, no drag-and-drop, no remote assets, and no unsupported data mutation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `aperture-design-system`: Expand the Work surface and responsive interaction requirements to cover dense List/Table/Kanban presentation and an accessible side-detail drawer.

## Impact

- Changes generated dashboard markup, Aperture tokens/components, classic interaction script, navigation behavior, tests, design documentation, and checked-in Iris output.
- Extends the internal dashboard page projection with bounded optional metadata derived from existing contracts; schemas and editable source contracts remain unchanged.
- Adds no framework, dependency, network request, persistence layer, drag-and-drop behavior, or Jira-owned asset.
