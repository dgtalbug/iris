## MODIFIED Requirements

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
