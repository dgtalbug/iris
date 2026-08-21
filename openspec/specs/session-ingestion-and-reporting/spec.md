# Session Ingestion and Reporting Specification

## Purpose

Provide a reliable local-first path for converting session history into a visual, versioned report page. The system must preserve evidence from the user session, translate it into the project report schema, and render it in a way that remains useful for later review and sharing.

## Requirements

### Requirement: session discovery and normalization
The system MUST support ingesting session data from a local directory or exported session bundle and MUST normalize the relevant files into a single report dataset.

#### Scenario: user points the CLI at a session directory
WHEN a user runs the report workflow with a session source
THEN the CLI MUST discover session metadata, turns, checkpoints, references, and file activity and MUST ignore irrelevant files unless they are part of the session dataset.

#### Scenario: session data is partial or noisy
WHEN session data is incomplete or contains extra non-session artifacts
THEN the system MUST still build a usable report while preserving only the evidence that can be mapped to the report contract.

### Requirement: report content derived from session evidence
The system MUST turn session metadata into a report summary that includes the workstream, branch, status, changed files, and notable references.

#### Scenario: session shows completed work
WHEN a session contains concrete work, notes, or checkpoints
THEN the generated report MUST summarize the outcome in a concise, reviewable form and MUST keep the underlying evidence attached to the page.

#### Scenario: a session includes PR or issue references
WHEN evidence contains a linked PR, issue, or commit reference
THEN the report MUST surface the reference in a way that is searchable and visible in the generated contract.

### Requirement: rendered page output
The system MUST create or update a page record and render the resulting report so it appears in the local dashboard or page registry.

#### Scenario: report is generated from session input
WHEN the report pipeline succeeds
THEN the CLI MUST emit a rendered page artifact and the page SHOULD be discoverable through the same dashboard workflow as other iris pages.

#### Scenario: generation fails for invalid input
WHEN the source input does not contain valid session evidence
THEN the system MUST stop with a clear validation error and MUST describe the missing or unsupported input format.

### Requirement: local-first, offline-safe operation
The ingestion and reporting flow MUST require no external service call to generate the page and MUST operate purely from local files or a local session export.

#### Scenario: offline usage
WHEN a user runs the tool without network access
THEN the session ingestion workflow MUST still create a report contract and rendered output from local data.
