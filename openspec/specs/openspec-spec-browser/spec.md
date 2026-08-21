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

The system MUST present Markdown OpenSpec documents as semantic HTML for reading, MUST progressively render fenced blocks labeled exactly `mermaid` as safe offline diagrams with escaped-source fallback, MUST keep the exact escaped document source available as a secondary disclosure, and MUST keep non-Markdown configuration artifacts in a literal code presentation.

#### Scenario: supported Markdown structures are present

- **WHEN** an OpenSpec Markdown artifact contains headings, paragraphs, emphasis, links, lists, task lists, blockquotes, tables, inline code, fenced code, or Mermaid fences
- **THEN** the Spec view MUST render those structures with readable semantic markup, progressively enhance Mermaid fences when the local runtime is available, and preserve escaped fallback source rather than displaying Markdown punctuation as the primary presentation

#### Scenario: user needs exact source evidence

- **WHEN** a rendered Markdown artifact is displayed
- **THEN** the user MUST be able to reveal the exact escaped source without leaving the dashboard

#### Scenario: configuration artifact is displayed

- **WHEN** the Spec view presents an OpenSpec YAML manifest or workspace configuration
- **THEN** the artifact MUST remain escaped literal code and MUST NOT be interpreted as Markdown or submitted to the diagram runtime

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
