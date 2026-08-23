## MODIFIED Requirements

### Requirement: user-global state home
The system MUST provide a user-global home at `~/.iris` holding machine
configuration, a project registry, per-project machine state, and a generated
global dashboard aggregating every registered project, separate from any
committed repository content.

#### Scenario: first run writes machine config
- **WHEN** `iris init` runs on a machine for the first time
- **THEN** the system MUST write `~/.iris/config.json` with theme, agent
  identity, tool defaults, and indexing preference

#### Scenario: project registry is maintained
- **WHEN** a project is initialized
- **THEN** the system MUST add or refresh an entry in `~/.iris/registry.json`
  mapping the project identity to its root, remote, and last-seen time

#### Scenario: machine state is per project
- **WHEN** machine-local state is written
- **THEN** it MUST live under `~/.iris/projects/<id>/` and MUST NOT be written
  into the committed workspace

#### Scenario: global dashboard is generated under the home
- **WHEN** the global dashboard is rendered
- **THEN** it MUST be written to `~/.iris/dashboard.html` and MUST aggregate
  every project in `~/.iris/registry.json` using each project's per-project
  state under `~/.iris/projects/<id>/`

## ADDED Requirements

### Requirement: registry as aggregation source
The system MUST treat `~/.iris/registry.json` as the source of truth for
cross-project aggregation on the global dashboard, reading each registered
project's per-project state rather than walking any project's page tree.

#### Scenario: dashboard reads the registry
- **WHEN** the global dashboard is rendered
- **THEN** the system MUST enumerate projects from `~/.iris/registry.json` and
  MUST NOT scan arbitrary directories on disk to discover projects

#### Scenario: aggregation is bounded by registry size
- **WHEN** the global dashboard is rendered
- **THEN** the aggregation cost MUST be bounded by the number of registered
  projects, not the size of any one project
