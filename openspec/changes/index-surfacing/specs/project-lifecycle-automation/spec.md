## MODIFIED Requirements

### Requirement: lifecycle-aware project bootstrap
The system MUST provide one project bootstrap flow that creates or refreshes the local structure needed for page generation, dashboard rendering, managed updates, and supported agent skill use without ingesting general repository documentation. Machine-local bookkeeping MUST live in the user-global state home rather than the committed workspace, leaving the repository tree to authored sources and generated output. Indexing state is machine-local; the dashboard MUST render an Index card from a status pointer under `~/.iris/projects/<id>/` and MUST degrade gracefully when the pointer is absent, so a fresh clone with no indexer still renders.

#### Scenario: user initializes the project
- **WHEN** a user runs `iris init` in a repository
- **THEN** the system MUST create or safely refresh the required `iris/` structure, scaffold managed task metadata, install supported agent skills, render the dashboard, and place machine-local state in the user-global home

#### Scenario: repository contains README or docs markdown
- **WHEN** a user runs `iris init` in a repository containing `README.md` or `docs/**/*.md`
- **THEN** the system MUST NOT automatically copy, mirror, hash, monitor, or create Iris page records from those files

#### Scenario: dashboard shows an Index card when indexed
- **WHEN** the project's status pointer at `~/.iris/projects/<id>/index.json` records that indexing is enabled
- **THEN** the dashboard and Commands page MUST render an Index card showing status, symbol count, flow count, last indexed sha, and a staleness hint comparing the last indexed sha to the current `HEAD` sha

#### Scenario: dashboard degrades when not indexed
- **WHEN** the project has no status pointer or the pointer records indexing as disabled
- **THEN** the dashboard and Commands page MUST render the Index card in a disabled state (or omit it) and MUST NOT error, so a fresh clone without the indexer still renders
