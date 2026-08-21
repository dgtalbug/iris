## MODIFIED Requirements

### Requirement: lifecycle-aware project bootstrap
The system MUST provide one project bootstrap flow that creates or refreshes the local structure needed for page generation, dashboard rendering, managed updates, and supported agent skill use without ingesting general repository documentation.

#### Scenario: user initializes the project
WHEN a user runs `iris init` in a repository
THEN the system MUST create or safely refresh the required `iris/` structure, scaffold managed task metadata, install supported agent skills, and render the dashboard.

#### Scenario: repository contains README or docs markdown
WHEN a user runs `iris init` in a repository containing `README.md` or `docs/**/*.md`
THEN the system MUST NOT automatically copy, mirror, hash, monitor, or create Iris page records from those files.

### Requirement: archival and cleanup
The system MUST provide a clear archiving path that removes a user-selected page from the active feed while preserving its historical generated artifact and registry navigation.

#### Scenario: a page becomes outdated
WHEN a user runs the archive command for an existing active page
THEN the archive command MUST move that exact page into the archive state and update the page registry and dashboard consistently.

## REMOVED Requirements

### Requirement: incremental sync and stale-state awareness
**Reason**: Explicit `iris init` and `iris render --all` operations replace product synchronization; adopted-source monitoring and stale-source state no longer belong in the agent-first workspace.

**Migration**: Run `iris init` once to migrate legacy state and then use `iris render --all` when page contracts or repository-backed explicit views need regeneration.

### Requirement: doc adoption and mirroring
**Reason**: Iris no longer ingests general project documentation, and agents use installed skills plus explicit content commands instead of README/docs mirrors.

**Migration**: Preserve user-owned pages, allow `iris init` to remove only positively proven unmodified generated mirrors, and create intentional Iris content with the existing report, feature, bug, idea, or plan commands.
