## MODIFIED Requirements

### Requirement: newcomer-first dashboard hierarchy

The generated workspace MUST consist of an Overview page at `iris/index.html`, a Work page with the dense List/Table/Kanban browser and detail drawer, a Spec index page listing canonical specs, active changes, and the archive with links to one generated detail page per record, a Research page, a Commands page, and the project docs, all reachable through the shared navigation shell; the Overview MUST preserve the briefing hero, per-section summary, architecture pane, and project-docs strip.

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

- **WHEN** a user opens a canonical spec or change detail page from the index
- **THEN** it MUST use the same navigation shell, mark Spec as the current section, and provide a path back to the index
