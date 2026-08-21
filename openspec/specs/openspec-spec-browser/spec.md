# OpenSpec Spec Browser Specification

## Purpose

Provide a deterministic, offline dashboard view of the repository's complete OpenSpec filesystem so users and agents can inspect specifications, change artifacts, and real task progress without running OpenSpec.

## Requirements

### Requirement: explicit OpenSpec workspace snapshots
The system MUST detect and read the repository's `openspec/` workspace during `iris init` and `iris render --all`, and MUST NOT introduce implicit synchronization, background monitoring, or a separate refresh command for the same operation.

#### Scenario: repository is initialized with OpenSpec
- **WHEN** a user runs `iris init` in a repository containing `openspec/`
- **THEN** the generated dashboard MUST contain a snapshot of that workspace from the files read during initialization

#### Scenario: user explicitly refreshes all output
- **WHEN** a user runs `iris render --all` after OpenSpec files change
- **THEN** the dashboard MUST re-read the current OpenSpec filesystem and replace the previous generated snapshot

#### Scenario: user renders one work page
- **WHEN** a user runs `iris render <id>`
- **THEN** the system MUST render that page without treating the operation as an OpenSpec workspace refresh

### Requirement: complete normalized workspace view
The system MUST represent canonical specs, active changes, structured archived changes, legacy archived Markdown, project/config context, proposal, design, tasks, and change-local delta specs while keeping canonical, active, archived, legacy, invalid, and incomplete states distinct.

#### Scenario: repository contains current structured layouts
- **WHEN** canonical specs and structured active or archived changes are present
- **THEN** the Spec view MUST preserve their repository-relative identities, lifecycle state, artifact availability, requirements, scenarios, and delta-operation labels

#### Scenario: capability path is nested
- **WHEN** a canonical or change-local spec exists below a nested capability path
- **THEN** the Spec view MUST preserve and display the complete capability path without flattening ambiguous names

#### Scenario: archive contains a legacy Markdown record
- **WHEN** `openspec/changes/archive/` contains an archived single Markdown file rather than a structured change directory
- **THEN** the Spec view MUST identify it as legacy archive content and keep it separate from structured archived changes

### Requirement: evidence-based task and artifact status
The system MUST derive task totals only from actual Markdown task checkboxes and MUST keep task progress, artifact completeness, lifecycle state, and parser health as independent dimensions.

#### Scenario: tasks contain checked and unchecked items
- **WHEN** a structured change has task list items using supported Markdown checkbox syntax outside fenced code
- **THEN** the Spec view MUST report completed, open, and total task counts from those items without inferring completion from the directory name or archive location

#### Scenario: change is partially complete
- **WHEN** a change is missing an expected artifact or contains open tasks
- **THEN** the Spec view MUST label the available evidence and incompleteness without presenting the change as invalid or complete by assumption

#### Scenario: checkbox-like text appears in a code fence
- **WHEN** an artifact contains checkbox syntax inside fenced source examples
- **THEN** that text MUST NOT contribute to task progress

### Requirement: safe bounded filesystem parsing
The system MUST parse OpenSpec as untrusted local content using deterministic sorted traversal, repository confinement, bounded input, and symlink refusal, and MUST never execute file content.

#### Scenario: content contains active markup or script text
- **WHEN** an OpenSpec file contains HTML, script text, or other executable-looking content
- **THEN** every rendered representation MUST escape the content so opening the dashboard cannot execute it

#### Scenario: path is unsafe or input exceeds a bound
- **WHEN** traversal encounters a symlink, path escape, unsupported file location, excessive depth, excessive file count, or oversized file
- **THEN** the parser MUST skip the unsafe input, retain the rest of the workspace, and expose a path-specific actionable warning

#### Scenario: filesystem entry cannot be read
- **WHEN** one OpenSpec file or directory produces a filesystem error
- **THEN** the parser MUST preserve successfully read entries and report the isolated failure rather than crashing the entire dashboard refresh

### Requirement: graceful unknown and empty states
The system MUST render readable fallback states for absent, empty, malformed, unsupported, or partially complete OpenSpec workspaces.

#### Scenario: repository has no OpenSpec directory
- **WHEN** the dashboard snapshot is generated without an `openspec/` directory
- **THEN** the Spec tab MUST explain that no OpenSpec workspace was detected without suggesting general-document ingestion

#### Scenario: OpenSpec workspace is empty
- **WHEN** `openspec/` exists but contains no supported project, spec, or change records
- **THEN** the Spec tab MUST show a distinct empty-workspace state

#### Scenario: artifact is malformed or unknown
- **WHEN** a recognized path contains malformed Markdown or an unsupported layout
- **THEN** the Spec tab MUST render escaped readable source when available, identify the affected path, and show an actionable warning without hiding other valid records

### Requirement: offline runtime independence
The system MUST generate and operate the Spec view without requiring the OpenSpec CLI, a server, network access, runtime ES modules, telemetry, or general project-document ingestion.

#### Scenario: dashboard opens directly from disk
- **WHEN** a user opens `iris/index.html` through `file://` after generation
- **THEN** the Spec view MUST remain navigable and readable using only local generated assets and classic deferred scripts with zero network requests

#### Scenario: OpenSpec executable is unavailable
- **WHEN** Iris initializes or renders in a repository whose `openspec/` files exist but no OpenSpec CLI is installed
- **THEN** the filesystem snapshot and Spec view MUST still be generated successfully

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

### Requirement: inert Markdown generation

The system MUST generate Markdown presentation without allowing repository content or Mermaid diagram source to inject active HTML, unsafe URL schemes, executable click behavior, runtime modules, or implicit network requests.

#### Scenario: Markdown contains embedded HTML

- **WHEN** an artifact contains an HTML element, event handler, script, iframe, style, or other executable-looking markup outside or inside a Mermaid fence
- **THEN** the generated document MUST keep that input inert and MUST NOT add it as executable DOM content

#### Scenario: Markdown contains an unsafe link

- **WHEN** a Markdown link or Mermaid interaction uses an unsafe scheme such as `javascript:` or `data:`
- **THEN** the generated document MUST not emit a navigable link or executable interaction for that destination

#### Scenario: dashboard opens offline

- **WHEN** a user opens the generated dashboard through `file://`
- **THEN** rendered Markdown and diagram fallbacks MUST remain readable without loading a Markdown library, module, stylesheet, font, script, or other asset from the network

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

### Requirement: safe generated data bundle

The Spec section MUST carry its record detail in one generated classic-script data file that assigns a single global, and that file MUST be encoded so no record content can terminate the script element, close an HTML comment, or introduce executable or network-loading markup.

#### Scenario: a record contains a script-like sequence

- **WHEN** an artifact legitimately contains the characters that would close a script element or an HTML comment
- **THEN** the generated bundle MUST encode them so the browser still parses one complete script and the characters appear as inert text when the record is displayed

#### Scenario: the bundle is loaded

- **WHEN** a generated Spec page loads from `file://`
- **THEN** the bundle MUST load as a classic script without a network request and MUST expose every listed record
