## Purpose

Make the `iris` project lifecycle explicit and reproducible by aligning the generated dashboard and page registry with the repository state and user workflow. The system must provide a safe path for boosting, syncing, archiving, and updating local project artifacts while preserving user-owned content outside managed blocks.

## ADDED Requirements

### Requirement: lifecycle-aware project bootstrap
The system MUST provide a project bootstrap flow that creates the local structure needed for page generation, dashboard rendering, and managed updates.

#### Scenario: user initializes the project
WHEN a user runs the init flow in a repository
THEN the system MUST create the required `iris/` structure, scaffold task metadata, and establish the baseline workflow for later lifecycle commands.

### Requirement: incremental sync and stale-state awareness
The system MUST support a sync workflow that detects drift between repository state and the generated dashboard or page artifacts.

#### Scenario: repo changes after a page was generated
WHEN a project changes or a document is updated
THEN the sync flow MUST decide whether to refresh, flag stale state, or skip re-rendering when the data has not meaningfully changed.

### Requirement: doc adoption and mirroring
The system MUST provide a workflow for adopting repository markdown or docs into managed page records without losing the original source.

#### Scenario: user runs adopt on the project root
WHEN the project contains markdown docs or starter README content
THEN the CLI MUST create or update the corresponding pages and keep them in the dashboard with the right metadata.

### Requirement: archival and cleanup
The system MUST provide a clear archiving path that removes stale pages from the active feed while preserving historical references and generated artifacts.

#### Scenario: a page becomes outdated
WHEN a page is no longer relevant to the active workflow
THEN the archive command MUST move it into an archive state and update the page registry or index consistently.

### Requirement: managed updates without user-content loss
The system MUST support update actions that refresh generated shims or managed file blocks without clobbering user-authored content outside those managed boundaries.

#### Scenario: a project is updated after scaffold generation
WHEN a user runs the update flow
THEN the system MUST preserve user edits outside managed sections and refresh only the managed integration points.
