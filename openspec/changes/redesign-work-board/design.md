## Context

The Work surface currently projects each page into a minimal `DashboardPage` containing ID, type, title, status, and link, then duplicates a spacious card in List and Board views. The validated envelope also supplies agent, timestamps, and tags, while type-specific sections contain bounded description and evidence fields. The static output must remain deterministic, open from `file://`, use classic scripts, and preserve full-page links when JavaScript is unavailable.

Public Jira guidance supports the transferable interaction model: list views prioritize type/key/summary/status/priority/updated/assignee fields; boards map status to columns and expose selected fields on compact cards; compact density helps busy backlogs; and preview panels keep users in context with a full-page escape hatch. Iris will implement those principles through Aperture tokens and its own component language rather than copy Atlassian branding, fonts, icons, or exact styling.

## Goals / Non-Goals

**Goals:**

- Make 20–100 Iris records scannable without decorative card padding dominating the viewport.
- Provide one data projection shared by List, Table, Kanban, filtering, and drawer detail.
- Preserve navigation and source honesty when scripts fail or metadata is absent.
- Meet keyboard, focus, reduced-motion, light/dark, print, and 360 px requirements.

**Non-Goals:**

- Drag-and-drop, inline editing, persistence, sorting, saved filters, pagination, or invented workflow transitions.
- New contract fields, schema changes, user accounts, remote fonts, Jira assets, or a frontend framework.
- Replacing the Spec view or redesigning full contract pages.

## Decisions

### Derive a bounded Work projection during generation

`refreshDashboard` will derive updated date, agent, tags, description, evidence, and priority from validated contract payloads. Bug severity maps directly to display priority (`p0` urgent through `p3` low); other types report priority as unavailable because effort, impact, status, and type are not interchangeable with priority. Description and evidence strings are bounded before entering generated attributes.

Archived state currently retains only ID/type/title/status/link, so optional fields remain unavailable instead of reading moved source opportunistically or inventing values.

Alternative: expand the schema with owner and priority. Rejected because this redesign is a read-only presentation change and schema semantics require a separate capability decision.

### Keep all three views in static semantic HTML

List uses compact linked rows with a strong ID/title pair and one-line metadata. Table uses a real table with type, ID, title, status, priority, updated, and agent columns; responsive CSS hides agent, updated, priority, then type in that order before allowing page overflow. Kanban uses four fixed columns matching Iris's actual statuses: Draft, Active, Done, Archived. Cards stay compact and are not draggable.

All representations use full-page anchors. JavaScript intercepts activation for the detail drawer, while no-JS users follow the existing page link. A single filter hides matching representations across all views and computes unique results from the List representation.

Alternative: render only the active layout and rebuild on tab changes. Rejected because it complicates no-JS behavior and introduces client-side templating into a deterministic static artifact.

### Use one reusable modal side drawer

The dashboard emits one drawer after the main content. Activating any work anchor copies escaped data attributes into text-only drawer slots, updates `#work=<id>`, marks the dashboard main content inert, locks body scrolling, focuses Close, and traps Tab within the drawer. Escape, backdrop, Close, or hash removal closes it and restores the opener focus.

The drawer is `min(38rem, 52vw)` on wide screens and the full viewport below 40rem. Its content order is ID/type, title, status, metadata, description, evidence/tags, then actions. “Open full page” uses the original static link.

Alternative: CSS `:target` only. Rejected because it cannot reliably trap/restore focus, populate one reusable drawer, or provide Escape behavior.

### Evolve Aperture toward neutral compact density

The existing system stack remains. Work UI uses 0.75–0.875rem metadata/body text, 1.25rem section headings, 32–40 px interactive row targets, 4–8 px radii for compact elements, hairline separators, and neutral surfaces. Spectrum colors appear only in aperture/type, status, and priority signals, always paired with text. Hover, selected, and focus states use existing accent/border semantics.

### Keep deep links local and deterministic

The drawer hash contains only the encoded work ID. On load or `hashchange`, the script opens a matching item; unknown IDs leave the dashboard unchanged. Closing uses history replacement for direct closes, while browser Back naturally removes a pushed hash. The full page remains the authoritative deep link and no data is serialized into the URL.

## Risks / Trade-offs

- [Three DOM representations increase generated HTML size] → Keep markup compact, reuse one drawer, and avoid client-side templates or duplicated descriptions.
- [Data attributes can become large or unsafe] → Bound derived text and HTML-escape every attribute; populate drawer fields with `textContent` only.
- [A modal drawer can create focus bugs] → Test initial focus, Tab boundaries, Escape, backdrop, hash navigation, focus return, and inert cleanup in a real browser.
- [Responsive tables can hide useful context] → Preserve ID, title, and status longest; every row opens the drawer where all available metadata remains visible.
- [The checked-in repository has no work pages] → Use temporary validated fixture contracts for visual/runtime proof; do not add demo records to user-owned `iris/pages/`.

## Migration Plan

1. Extend the dashboard projection and add focused generator tests for real and unavailable metadata.
2. Replace Work markup and styles while preserving existing full-page links and empty state.
3. Add shared filtering, drawer, hash, focus, and keyboard behavior in the classic base script.
4. Regenerate managed output, validate at desktop and 360 px with temporary populated fixtures, and run the full release gate.

Rollback restores the prior projection and List/Board markup; contracts and state require no migration.
