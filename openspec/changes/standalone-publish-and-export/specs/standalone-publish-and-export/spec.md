## Purpose

Provide a reliable way to turn a generated page into a standalone artifact that can be shared, inspected, or archived without requiring a live `iris` project to be present. The system must preserve the rendered output, embed or vendor any required assets, and work in an offline-safe local workflow.

## ADDED Requirements

### Requirement: publishing of portable HTML
The system MUST support generating a single-file static HTML artifact from a rendered page while preserving the project’s visual structure and data.

#### Scenario: user publishes a page
WHEN a user runs the publish command for a valid page
THEN the system MUST create a generated artifact that can be opened directly in a browser without needing the rest of the project tree.

#### Scenario: page is missing or invalid
WHEN the selected page does not exist or cannot be rendered
THEN the system MUST fail clearly and MUST explain the missing or invalid page identifier.

### Requirement: export variants
The system MUST support at least the documented single-file export and any additional export modes defined for the project’s portable artifact strategy.

#### Scenario: user requests a different export format
WHEN a user selects a supported export mode such as HTML, PNG, or PDF
THEN the system MUST produce the right artifact type and MUST use the correct output path and naming conventions.

### Requirement: offline-safe asset handling
The system MUST ensure generated artifacts do not depend on a network call to render or display correctly.

#### Scenario: offline export
WHEN a page is generated in an offline environment
THEN the export MUST rely on vendored or bundled assets instead of remote CDN content.

### Requirement: output path control
The system MUST allow the user to choose the destination path for published and exported artifacts and MUST handle output directories consistently.

#### Scenario: user specifies a target path
WHEN the output directory is valid
THEN the CLI MUST write the artifact there and MUST create missing parent directories as needed.
