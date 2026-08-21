# Aperture Design System Specification

## Purpose

Define the deterministic visual language and dashboard hierarchy that lets a newcomer understand an iris-enabled repository from a single offline HTML entry point.

## Requirements

### Requirement: Aperture token contract

The system MUST generate dark and light themes from the Aperture token contract, MUST keep style literals confined to the generated token stylesheet, MUST validate text contrast at 4.5:1 or better, and MUST define navigation-shell surface, text, and selection tokens alongside the surface, text, accent, type, status, and priority tokens so that every generated page and the shell render from one token set.

#### Scenario: generated styles are validated

- **WHEN** a contributor runs the token validation command
- **THEN** the validator MUST reject undeclared token names, forbidden style literals outside the token stylesheet, and configured foreground/background pairs below 4.5:1 in either theme, including navigation-shell pairs

#### Scenario: theme is switched

- **WHEN** the user toggles the theme on any generated page
- **THEN** that page and its navigation shell MUST render in the selected theme from the same tokens, and the preference MUST be restored on other generated pages in that browser when local storage is available

### Requirement: Aperture component language

The system MUST provide generated component styles and semantic markup for aperture marks, the navigation shell, page headers, summary strip tiles, progress bars, command cards, restrained status/type/priority indicators, compact work rows, structured tables, Kanban columns and cards, detail drawers, callouts, timelines, keyboard hints, and command-specific empty states.

#### Scenario: meaning is communicated accessibly

- **WHEN** a generated page uses type, status, or priority color, interactive controls, selection, current-section marking, or motion
- **THEN** the page MUST provide a non-color signal, visible keyboard focus, semantic state, and a static reduced-motion presentation

### Requirement: newcomer-first dashboard hierarchy

The generated workspace MUST consist of an Overview page at `iris/index.html`, a Work page with the dense List/Table/Kanban browser and detail drawer, a Spec page presenting an index of canonical specs, active changes, and the archive with each record addressable in place, a Research page, a Commands page, and the project docs, all reachable through the shared navigation shell; the Overview MUST preserve the briefing hero, per-section summary, architecture pane, and project-docs strip.

#### Scenario: repository has no generated work pages

- **WHEN** a newcomer opens the Overview from `file://`
- **THEN** it MUST remain useful by naming the commands that populate the briefing, architecture, and work areas without making a network request

#### Scenario: repository has generated work pages

- **WHEN** a newcomer opens the Work page with one or more page contracts
- **THEN** the page MUST provide compact List, Table, and Kanban representations plus a detail drawer without requiring navigation away from that page

#### Scenario: user opens the Spec view

- **WHEN** a user activates the `Spec` navigation entry
- **THEN** the Spec index MUST show OpenSpec overview counts and navigable canonical, active-change, and archive listings while the shell keeps every other section reachable

#### Scenario: state is communicated in the Spec view

- **WHEN** canonical, active, archived, legacy, incomplete, or invalid records are displayed
- **THEN** each state MUST have a textual or structural indicator in addition to any color encoding

#### Scenario: a spec detail page is opened

- **WHEN** a user opens a canonical spec, change, or legacy record from the index
- **THEN** the page MUST keep the navigation shell and the Spec section current, present that record's content, and provide a way back to the index

### Requirement: deterministic responsive interaction

The generated workspace MUST retain classic deferred-script interactions for navigation-shell collapse, Work layout selection, shared filtering, theme switching, detail-drawer behavior, and keyboard navigation, MUST keep every page usable without JavaScript, and MUST remain operable at a 360 px viewport.

#### Scenario: keyboard navigation is used

- **WHEN** the user presses `/`, `t`, or `b` outside an editable field
- **THEN** `/` MUST focus the relevant visible filter, `t` MUST toggle the theme, and `b` MUST toggle the navigation shell, none of which loads external assets

#### Scenario: top-level tabs are keyboard operated

- **WHEN** focus is on a navigation-shell entry and the user presses Tab or Enter, or focus is on the List/Table/Kanban tablist and the user presses supported arrow, Home, or End keys
- **THEN** section navigation MUST follow standard link behavior with visible focus, and the layout tablist MUST move focus and selection according to the tab pattern with correct tab/panel semantics

#### Scenario: work items are keyboard operated

- **WHEN** focus is on a work-item link and the user presses Enter or Space
- **THEN** the corresponding detail drawer MUST open without navigating away

#### Scenario: JavaScript is unavailable

- **WHEN** a generated page opens without executing JavaScript
- **THEN** the navigation shell MUST remain expanded and fully linked, the default Work List MUST remain readable, and every work item MUST keep its full-page link

#### Scenario: narrow viewport is used

- **WHEN** any generated page viewport is 360 px wide
- **THEN** the shell menu, Work List rows, prioritized Table columns, stacked Kanban columns, full-screen drawer, Spec content, Commands cards, warnings, and source fallbacks MUST remain readable without horizontal page overflow

#### Scenario: reduced motion is requested

- **WHEN** the user enables reduced-motion preferences
- **THEN** collapsing the shell, switching layouts, opening the drawer, and revealing Spec content MUST have an equivalent static presentation without meaning-bearing information loss

### Requirement: dense context-preserving Work browser

The generated Work surface MUST provide peer List, Table, and Kanban views over the same Iris page records, MUST share one text filter across all views, and MUST use only metadata available from validated contracts or explicit unavailable labels.

#### Scenario: user changes Work layout

- **WHEN** a user selects List, Table, or Kanban
- **THEN** the corresponding view MUST present the same matching records with type, ID, title, status, and every supported optional field without changing source data

#### Scenario: user filters work

- **WHEN** a user enters text matching a title, ID, type, status, priority, agent, or tag
- **THEN** every Work view MUST hide nonmatching records and report the matching unique-record count

#### Scenario: optional metadata is unavailable

- **WHEN** a page contract does not define priority or another requested field
- **THEN** List, Table, Kanban, and detail views MUST use a neutral unavailable value and MUST NOT infer or fabricate data

#### Scenario: JavaScript is unavailable

- **WHEN** the generated dashboard opens without executing JavaScript
- **THEN** every work item MUST retain a navigable full-page link and the default List view MUST remain readable

### Requirement: accessible work-item detail drawer

Selecting a work item MUST open one right-side detail drawer that preserves the current Work view, displays available contract metadata, description, evidence, and a full-page link, and provides deterministic close and focus behavior.

#### Scenario: item is activated

- **WHEN** a user clicks a work item or activates its link with Enter or Space
- **THEN** the drawer MUST open with dialog semantics, identify the selected ID and title, move focus to its close control, and update a local hash that can reopen the same item

#### Scenario: drawer is closed

- **WHEN** the user presses Escape, activates the close control, activates the backdrop, or navigates back from the item hash
- **THEN** the drawer MUST close, remove its modal state, and return focus to the item that opened it when that item remains available

#### Scenario: focus moves within the drawer

- **WHEN** the drawer is open and the user presses Tab or Shift+Tab at its focus boundaries
- **THEN** focus MUST remain within the drawer until it is closed

#### Scenario: narrow viewport opens a drawer

- **WHEN** the viewport is 360 px wide and a work item is activated
- **THEN** the drawer MUST occupy the viewport without horizontal page overflow and MUST keep its close and full-page actions reachable

### Requirement: workspace navigation shell

Every generated Iris HTML page MUST share one navigation shell that lists the workspace sections (Overview, Work, Spec, Commands, and the project docs group), marks the current section, links each section with a relative `file://`-safe path, and can be collapsed and restored without any network request.

#### Scenario: user moves between sections

- **WHEN** a user activates a navigation entry on any generated page
- **THEN** the browser MUST open that section's own page and the shell on that page MUST mark it as current

#### Scenario: sidebar is collapsed

- **WHEN** the user activates the collapse control or presses `b` outside an editable field
- **THEN** the shell MUST collapse to a compact rail in which every section remains reachable with an accessible label, and the same collapsed or expanded state MUST be restored on the next generated page opened in that browser when local storage is available

#### Scenario: narrow viewport

- **WHEN** the viewport is 360 px wide
- **THEN** the shell MUST present the sections behind a menu control in the top bar and the page MUST have no horizontal overflow

#### Scenario: artifact is published

- **WHEN** a page is published or exported as a standalone artifact
- **THEN** the navigation shell MUST be omitted and the page content MUST remain readable and self-contained

### Requirement: generated command reference page

The system MUST generate a Commands page that lists every CLI command from one command catalog, grouped by purpose, with synopsis, usage, and an explicit implementation status, and `iris --help` MUST present the same groups and commands from that catalog.

#### Scenario: command surface changes

- **WHEN** a command is added, removed, regrouped, or its status changes in the catalog
- **THEN** the generated Commands page and `iris --help` MUST both reflect the change without a separate edit

#### Scenario: command is not fully implemented

- **WHEN** a catalog entry is partial or stubbed
- **THEN** the Commands page MUST label it with a textual status and MUST NOT present it as fully available

### Requirement: section summary strips

Each section page MUST open with a summary strip of counts derived only from generated data for that section, and the Overview page MUST summarize every section with links to the owning section page rather than embedding that section's full content.

#### Scenario: overview is opened

- **WHEN** a newcomer opens `iris/index.html` from `file://`
- **THEN** it MUST show the repository briefing, per-section counts, the most recently updated work records, active spec changes with task progress, and quick-start commands, each linking to the owning section page

#### Scenario: section has no data

- **WHEN** a section page has no records
- **THEN** it MUST name the exact command that populates it instead of showing an empty area
