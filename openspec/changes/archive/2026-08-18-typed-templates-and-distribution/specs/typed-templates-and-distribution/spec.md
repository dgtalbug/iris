## Purpose

Provide a consistent, contract-driven rendering and distribution workflow for iris pages so agent output is deterministic, inspectable, and shareable without requiring a remote service.

## ADDED Requirements

### Requirement: typed template registry
The system MUST resolve each supported contract type to a single canonical template definition.

#### Scenario: contract renders via the correct template
WHEN a valid report, feature, bug, idea, or plan contract is passed to the render pipeline
THEN the system MUST select the matching template and render the page using the contract's declared sections.

#### Scenario: unsupported contract type rejects cleanly
WHEN a contract type is not recognized by the registry
THEN the system MUST stop with a clear validation or render error and MUST NOT emit a partial page.

### Requirement: schema-first render failures
The system MUST validate each contract before writing any page output.

#### Scenario: invalid contract blocks render
WHEN required fields or section structure are missing
THEN the system MUST fail before writing output and MUST surface schema errors.

#### Scenario: valid contract renders deterministically
WHEN the same valid contract is rendered twice
THEN the output MUST be stable and use the same template structure and tokenized styling.

### Requirement: local distribution artifact output
The system MUST support producing a portable local artifact that can be shared without a live server.

#### Scenario: publish creates a single artifact
WHEN a user runs the publish flow for a page
THEN the system MUST generate a standalone artifact from the rendered HTML or packaged output.

#### Scenario: publish remains offline-safe
WHEN the user runs a publish/export flow
THEN the system MUST not depend on remote services or live network access to generate the artifact.

### Requirement: session-derived report extraction
The system MUST support turning local agent session content into a contract-ready report page.

#### Scenario: report extraction uses structured inputs
WHEN a user imports session data for a report
THEN the system MUST normalize it into the report contract and pass it through the existing validation/render pipeline.

#### Scenario: report extraction without valid session data rejects
WHEN session content is missing or malformed
THEN the system MUST fail clearly and MUST NOT create a page with incomplete metadata.
