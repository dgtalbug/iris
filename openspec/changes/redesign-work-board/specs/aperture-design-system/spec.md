## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Aperture component language
The system MUST provide generated component styles and semantic markup for aperture marks, stat tiles, restrained status/type/priority indicators, compact work rows, structured tables, Kanban columns and cards, detail drawers, callouts, timelines, keyboard hints, and command-specific empty states.

#### Scenario: meaning is communicated accessibly
- **WHEN** a generated page uses type, status, or priority color, interactive controls, selection, or motion
- **THEN** the page MUST provide a non-color signal, visible keyboard focus, semantic state, and a static reduced-motion presentation

### Requirement: newcomer-first dashboard hierarchy
The generated dashboard MUST provide top-level Work and `Spec` views, preserve the Work view's briefing hero, health strip, architecture pane, dense List/Table/Kanban work browser, and project-docs strip, and organize the Spec view as overview, canonical specs, active changes with artifacts and delta specs, and archive.

#### Scenario: repository has no generated work pages
- **WHEN** a newcomer opens the dashboard from `file://`
- **THEN** the dashboard MUST remain useful by naming the commands that populate the briefing, architecture, and work areas without making a network request

#### Scenario: repository has generated work pages
- **WHEN** a newcomer opens the Work view with one or more page contracts
- **THEN** the dashboard MUST provide compact List, Table, and Kanban representations plus a detail drawer without requiring navigation away from the dashboard

#### Scenario: user opens the Spec view
- **WHEN** a user activates the top-level tab labelled `Spec`
- **THEN** the dashboard MUST show OpenSpec overview counts and navigable canonical, active-change, and archive sections while keeping the Work view available

#### Scenario: state is communicated in the Spec view
- **WHEN** canonical, active, archived, legacy, incomplete, or invalid records are displayed
- **THEN** each state MUST have a textual or structural indicator in addition to any color encoding

### Requirement: deterministic responsive interaction
The generated dashboard MUST retain classic deferred-script interactions for top-level view selection, Work layout selection, shared filtering, theme switching, detail-drawer behavior, and keyboard navigation and MUST remain operable at a 360 px viewport.

#### Scenario: keyboard navigation is used
- **WHEN** the user presses `/` or `t` outside an editable field
- **THEN** `/` MUST focus the relevant visible filter and `t` MUST toggle the theme without loading external assets

#### Scenario: top-level tabs are keyboard operated
- **WHEN** focus is on the Work/Spec or List/Table/Kanban tablist and the user presses supported arrow, Home, or End keys
- **THEN** focus and selection MUST move according to the tab pattern with visible focus and correct tab/panel semantics

#### Scenario: work items are keyboard operated
- **WHEN** focus is on a work-item link and the user presses Enter or Space
- **THEN** the corresponding detail drawer MUST open without navigating away

#### Scenario: narrow viewport is used
- **WHEN** the dashboard viewport is 360 px wide
- **THEN** Work List rows, the prioritized Table columns, stacked Kanban columns, full-screen drawer, Spec content, warnings, and source fallbacks MUST remain readable without horizontal page overflow

#### Scenario: reduced motion is requested
- **WHEN** the user enables reduced-motion preferences
- **THEN** switching views, opening the drawer, and revealing Spec content MUST have an equivalent static presentation without meaning-bearing information loss
