## ADDED Requirements

### Requirement: user-global state home
The system MUST provide a user-global home at `~/.iris` holding machine
configuration, a project registry, and per-project machine state, separate from
any committed repository content.

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

### Requirement: stable project identity
The system MUST derive a stable project identity of the form `<slug>-<hash8>`
keyed primarily on the normalized git remote with an absolute-realpath fallback.

#### Scenario: identity from git remote
- **WHEN** a project has a git remote
- **THEN** the system MUST derive the identity hash from the normalized remote
  so a moved checkout retains its state

#### Scenario: identity fallback without a remote
- **WHEN** a project has no git remote
- **THEN** the system MUST derive the identity hash from the absolute real path

### Requirement: machine configuration command
The system MUST provide an `iris config` command that reads and writes
user-global configuration and project-level workspace configuration.

#### Scenario: read and set global config
- **WHEN** a user runs `iris config <key>` or `iris config --global <key> <value>`
- **THEN** the system MUST read or update the corresponding `~/.iris/config.json`
  value
