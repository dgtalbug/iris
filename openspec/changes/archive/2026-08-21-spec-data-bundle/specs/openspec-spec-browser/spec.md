## ADDED Requirements

### Requirement: safe generated data bundle

The Spec section MUST carry its record detail in one generated classic-script data file that assigns a single global, and that file MUST be encoded so no record content can terminate the script element, close an HTML comment, or introduce executable or network-loading markup.

#### Scenario: a record contains a script-like sequence

- **WHEN** an artifact legitimately contains the characters that would close a script element or an HTML comment
- **THEN** the generated bundle MUST encode them so the browser still parses one complete script and the characters appear as inert text when the record is displayed

#### Scenario: the bundle is loaded

- **WHEN** a generated Spec page loads from `file://`
- **THEN** the bundle MUST load as a classic script without a network request and MUST expose every listed record

## MODIFIED Requirements

### Requirement: spec index and detail pages

The generated Spec section MUST provide one index page listing every canonical spec, active change, and archived change with its real counts, health, and task progress, and MUST make each record's artifact bodies available from that page through a local hash address backed by the generated data bundle. The index listing MUST remain complete and MUST name each record's on-disk source path whether or not scripts run.

#### Scenario: user opens the Spec index

- **WHEN** a user activates the `Spec` navigation entry
- **THEN** the index MUST show overview counts and compact canonical, active-change, and archive listings, each row naming its source path and addressing that record

#### Scenario: user opens a canonical spec detail page

- **WHEN** a user follows a canonical spec row from the index
- **THEN** the page MUST show the capability name, source path, requirement and scenario counts, health, the rendered specification, and its exact escaped source without a full page load

#### Scenario: user opens a change detail page

- **WHEN** a user follows a change row from the index
- **THEN** the page MUST show the change lifecycle, completeness, task progress, and every available artifact including delta specs, each with its exact escaped source

#### Scenario: a record has no readable artifacts

- **WHEN** a listed change or capability has missing or unreadable artifacts
- **THEN** its detail view MUST state which artifacts are missing and MUST render the readable ones

#### Scenario: scripts are unavailable

- **WHEN** the Spec index is opened without executing JavaScript
- **THEN** the index listings, counts, source paths, and warnings MUST remain readable and the page MUST state that opening a record requires scripts rather than presenting an empty region

#### Scenario: an unknown record is addressed

- **WHEN** the page is opened with a hash that names no record in the bundle
- **THEN** the index MUST remain displayed unchanged rather than showing an empty or partial record

### Requirement: deep-linkable specification headings

A rendered record MUST give every heading in a rendered document a stable identifier derived from its text, MUST provide a table of contents for a document with two or more section headings, and MUST keep identifiers unique when one record renders several documents.

#### Scenario: a specification with several requirements is rendered

- **WHEN** a canonical spec containing multiple requirements is displayed
- **THEN** each requirement heading MUST carry an identifier derived from its text and the table of contents MUST link to it

#### Scenario: one page renders several documents

- **WHEN** a change record on one page renders a proposal, a design, and a delta spec that share a heading name
- **THEN** each rendered heading MUST receive a distinct identifier and each table-of-contents entry MUST resolve to its own document's heading
