## ADDED Requirements

### Requirement: provenance denylist scanning
The system MUST scan generated agent surfaces, templates, user-facing source
strings, documentation, and generated HTML for external tool and source names,
and MUST fail continuous integration on any occurrence outside an explicit
per-path allowlist.

#### Scenario: continuous integration lint
- **WHEN** the provenance lint runs in CI
- **THEN** it MUST exit non-zero on any denylisted name outside the allowlist

#### Scenario: scan after generation
- **WHEN** init, update, or a full render completes
- **THEN** the system MUST scan the affected output and warn on any denylisted
  name

#### Scenario: allowlist requires justification
- **WHEN** a literal must remain (for example a directory name used only for
  detection)
- **THEN** it MUST be allowlisted per path with a required justification comment

#### Scenario: user content is never rewritten
- **WHEN** a denylisted name is found in user-authored content
- **THEN** the system MUST flag it with a file and line and a suggested
  rewording, and MUST NOT modify the content

### Requirement: brand guard agent skill
The system MUST install an agent skill that enforces Iris-native naming at
authoring time and treats the design language as Iris's own native system.

#### Scenario: agent authors an artifact
- **WHEN** an agent writes content into the workspace
- **THEN** the skill MUST require Iris's own voice with no external tool or
  source names, and MUST direct the agent to self-check against the denylist
  before rendering

### Requirement: native design language naming
The design language MUST be presented as Iris Electric, Iris's native design
system, across user-facing copy and generated output.

#### Scenario: generated output uses native naming
- **WHEN** pages are rendered
- **THEN** the design-system attribute and user-facing copy MUST use the Iris
  Electric name and MUST NOT reference an upstream source by name
