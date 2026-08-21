# openspec-spec-browser

## MODIFIED Requirements

### Requirement: graceful unknown and empty states
The system MUST render readable fallback states for absent, empty, malformed, unsupported, or partially complete OpenSpec workspaces, and MUST keep a detected workspace visually distinguishable from an absent one wherever it is summarized.

#### Scenario: repository has no OpenSpec directory
- **WHEN** the dashboard snapshot is generated without an `openspec/` directory
- **THEN** the Spec tab MUST explain that no OpenSpec workspace was detected without suggesting general-document ingestion

#### Scenario: OpenSpec workspace is empty
- **WHEN** `openspec/` exists but contains no supported project, spec, or change records
- **THEN** the Spec tab MUST show a distinct empty-workspace state

#### Scenario: artifact is malformed or unknown
- **WHEN** a recognized path contains malformed Markdown or an unsupported layout
- **THEN** the Spec tab MUST render escaped readable source when available, identify the affected path, and show an actionable warning without hiding other valid records

#### Scenario: a detected workspace has no active changes
- **WHEN** the snapshot records a detected OpenSpec workspace that holds canonical specs or archived changes but no active change
- **THEN** every summary of it MUST report the canonical and archived totals it holds, and MUST NOT reduce to a message whose only content is the absence of active changes
