## ADDED Requirements

### Requirement: spec index and detail pages

The generated Spec section MUST consist of an index page listing every canonical spec, active change, and archived change with its real counts, health, and task progress, and one generated detail page per canonical spec and per change holding that record's artifact bodies. The index MUST link every listed record to its detail page and MUST NOT embed artifact bodies itself.

#### Scenario: user opens the Spec index

- **WHEN** a user activates the `Spec` navigation entry
- **THEN** the index MUST show overview counts and compact canonical, active-change, and archive listings, each row naming its source path and linking to that record's detail page

#### Scenario: user opens a canonical spec detail page

- **WHEN** a user follows a canonical spec link from the index
- **THEN** the detail page MUST show the capability name, source path, requirement and scenario counts, health, the rendered specification, and its exact escaped source

#### Scenario: user opens a change detail page

- **WHEN** a user follows a change link from the index
- **THEN** the detail page MUST show the change lifecycle, completeness, task progress, and every available artifact including delta specs, each with its exact escaped source

#### Scenario: a record has no readable artifacts

- **WHEN** a listed change or capability has missing or unreadable artifacts
- **THEN** its detail page MUST state which artifacts are missing and MUST render the readable ones

### Requirement: deep-linkable specification headings

A generated detail page MUST give every heading in a rendered document a stable identifier derived from its text, MUST provide a table of contents for a document with two or more section headings, and MUST keep identifiers unique when one page renders several documents.

#### Scenario: a specification with several requirements is rendered

- **WHEN** a canonical spec containing multiple requirements is rendered to its detail page
- **THEN** each requirement heading MUST carry an identifier derived from its text and the table of contents MUST link to it

#### Scenario: one page renders several documents

- **WHEN** a change detail page renders a proposal, a design, and a delta spec that share a heading name
- **THEN** each rendered heading MUST receive a distinct identifier and each table-of-contents entry MUST resolve to its own document's heading

## MODIFIED Requirements

### Requirement: safe semantic Markdown presentation

The system MUST present Markdown OpenSpec documents as semantic HTML for reading, MUST progressively render fenced blocks labeled exactly `mermaid` as safe offline diagrams with escaped-source fallback, MUST keep the exact escaped document source available as a secondary disclosure, MUST give each rendered heading on a detail page an identifier derived from its text, and MUST keep non-Markdown configuration artifacts in a literal code presentation.

#### Scenario: supported Markdown structures are present

- **WHEN** an OpenSpec Markdown artifact contains headings, paragraphs, emphasis, links, lists, task lists, blockquotes, tables, inline code, fenced code, or Mermaid fences
- **THEN** the Spec section MUST render those structures with readable semantic markup, progressively enhance Mermaid fences when the local runtime is available, and preserve escaped fallback source rather than displaying Markdown punctuation as the primary presentation

#### Scenario: user needs exact source evidence

- **WHEN** a rendered Markdown artifact is displayed on its detail page
- **THEN** the user MUST be able to reveal the exact escaped source without leaving that page

#### Scenario: configuration artifact is displayed

- **WHEN** the Spec section presents an OpenSpec YAML manifest or workspace configuration
- **THEN** the artifact MUST remain escaped literal code and MUST NOT be interpreted as Markdown or submitted to the diagram runtime

#### Scenario: rendered Markdown is navigable

- **WHEN** a rendered artifact contains section headings on a detail page
- **THEN** those headings MUST be individually addressable so a reader can link to a requirement or section rather than only to the whole document
