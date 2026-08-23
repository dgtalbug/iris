## ADDED Requirements

### Requirement: global dashboard output
The system MUST render a global dashboard at `~/.iris/dashboard.html`
aggregating every project registered in `~/.iris/registry.json`, using the same
Electric templates, tokens, and component vocabulary as per-project workspace
pages.

#### Scenario: dashboard lists every registered project
- **WHEN** the global dashboard is rendered
- **THEN** it MUST list every entry from `~/.iris/registry.json` with the
  project's id, name, root, remote, and last-seen time

#### Scenario: dashboard shows per-project page counts and recent activity
- **WHEN** the global dashboard is rendered for a registered project
- **THEN** it MUST show that project's page counts and recent activity derived
  from the project's per-project state under `~/.iris/projects/<id>/`

#### Scenario: dashboard is offline and self-contained
- **WHEN** the global dashboard is opened from `file://`
- **THEN** it MUST render without any network request, CDN, script tag, or
  runtime fetch, with Lucide icons inlined as SVG and Mermaid vendored

#### Scenario: dashboard is machine-local and never committed
- **WHEN** the global dashboard is written
- **THEN** it MUST live at `~/.iris/dashboard.html`, outside every registered
  repository, and MUST NOT appear in `git status` for any project

### Requirement: graceful index status
The global dashboard MUST show per-project index status when an index pointer
is present and MUST degrade gracefully when it is absent.

#### Scenario: index pointer is present
- **WHEN** `~/.iris/projects/<id>/index.json` exists for a registered project
- **THEN** the dashboard MUST show that project's index status

#### Scenario: index pointer is absent
- **WHEN** `~/.iris/projects/<id>/index.json` does not exist for a registered
  project
- **THEN** the dashboard MUST omit the index-status row for that project and
  MUST NOT error

### Requirement: stale project handling
The global dashboard MUST surface a project whose root directory no longer
exists as stale rather than dropping it from the registry.

#### Scenario: registered project root is missing
- **WHEN** a registry entry's root directory does not exist on disk
- **THEN** the dashboard MUST show that project as stale and MUST NOT remove
  it from `~/.iris/registry.json`

### Requirement: open global dashboard
The system MUST provide `iris open --global` to open the global dashboard from
any directory.

#### Scenario: global dashboard has been generated
- **WHEN** a user runs `iris open --global` and `~/.iris/dashboard.html` exists
- **THEN** the system MUST open it in the default browser

#### Scenario: global dashboard has not been generated
- **WHEN** a user runs `iris open --global` and `~/.iris/dashboard.html` does
  not exist
- **THEN** the system MUST exit non-zero with a message telling the user to run
  `iris render --all` first
