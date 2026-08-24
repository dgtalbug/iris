## MODIFIED Requirements

### Requirement: managed updates without user-content loss
The system MUST support update actions that refresh generated shims or managed
file blocks without clobbering user-authored content outside those managed
boundaries, and MUST refresh the global dashboard as part of the standard
render lifecycle when more than one project is registered.

#### Scenario: a project is updated after scaffold generation
- **WHEN** a user runs the update flow
- **THEN** the system MUST preserve user edits outside managed sections and
  refresh only the managed integration points

#### Scenario: render all refreshes the global dashboard
- **WHEN** a user runs `iris render --all` and `~/.iris/registry.json` lists
  more than one project
- **THEN** the system MUST refresh `~/.iris/dashboard.html` as a final step
  after the per-project render completes

#### Scenario: single-project machine skips the global refresh
- **WHEN** a user runs `iris render --all` and `~/.iris/registry.json` lists
  exactly one project
- **THEN** the system MUST skip the global dashboard refresh, because the
  per-project dashboard already shows everything

#### Scenario: global refresh failure does not fail the render
- **WHEN** the global dashboard refresh fails
- **THEN** the system MUST NOT fail the surrounding `iris render --all` and
  MUST leave the prior `~/.iris/dashboard.html` in place if one exists
