## ADDED Requirements

### Requirement: opt-in indexer discovery
The system MUST locate a locally installed GitNexus indexer when the operator opts into indexing via `iris init --index`, by checking `PATH` for a `gitnexus` executable first and then falling back to `npx --no-install gitnexus`. The system MUST refuse with actionable install instructions when the indexer is absent and MUST NOT auto-download, auto-install, or bundle the indexer.

#### Scenario: indexer is on PATH
- **WHEN** `iris init --index` resolves a `gitnexus` executable on `PATH`
- **THEN** the system MUST use that executable to run indexing and MUST NOT invoke `npx`

#### Scenario: indexer falls back to npx cache
- **WHEN** `iris init --index` finds no `gitnexus` on `PATH` but `npx --no-install gitnexus` resolves from the local cache
- **THEN** the system MUST use the cached package and MUST NOT fetch from the network

#### Scenario: indexer is absent
- **WHEN** `iris init --index` cannot resolve the indexer on `PATH` or via `npx --no-install gitnexus`
- **THEN** the system MUST refuse with a one-line message naming the install command, MUST exit non-zero, and MUST NOT auto-download or auto-install the indexer

#### Scenario: default init never requires the indexer
- **WHEN** a user runs `iris init` without `--index`
- **THEN** the system MUST NOT attempt indexer discovery and MUST NOT fail if the indexer is absent

### Requirement: machine-local index status pointer
The system MUST record indexing state in a machine-local status pointer at `~/.iris/projects/<id>/index.json` with the shape `{ enabled: boolean, lastIndexedSha: string|null, symbols: number|null, flows: number|null, indexedAt: string|null }`. The system MUST NOT write indexing state into the committed workspace, into `iris/config.yaml`, into `~/.gitnexus/`, or into `.gitnexus/`.

#### Scenario: pointer is written after indexing
- **WHEN** `iris init --index` completes an indexing run
- **THEN** the system MUST write `index.json` with `enabled: true`, the last indexed sha, symbol and flow counts, and an ISO 8601 `indexedAt` timestamp

#### Scenario: pointer is absent by default
- **WHEN** a project is initialized without `--index`
- **THEN** the system MUST NOT write `index.json` and MUST NOT write any indexing key into `iris/config.yaml`

#### Scenario: iris does not write to gitnexus-owned paths
- **WHEN** the system records or reads indexing state
- **THEN** it MUST NOT write to `~/.gitnexus/` or `.gitnexus/` and MUST read the graph via the GitNexus CLI or MCP only

#### Scenario: pointer survives a moved checkout
- **WHEN** a project's checkout path changes but its git remote is unchanged
- **THEN** the system MUST reconcile identity by remote and retain the project's `index.json` under the same project identity

### Requirement: staleness hint against current HEAD
The system MUST compute a staleness hint for the Index card by comparing the pointer's `lastIndexedSha` to the current `HEAD` sha read from git, and MUST surface the hint on the dashboard and Commands page.

#### Scenario: index is up to date
- **WHEN** `lastIndexedSha` equals the current `HEAD` sha
- **THEN** the Index card MUST show the index as up to date

#### Scenario: index is stale
- **WHEN** `lastIndexedSha` differs from the current `HEAD` sha
- **THEN** the Index card MUST show the index as stale and, when feasible, name how many commits behind

#### Scenario: sha is unknown
- **WHEN** `lastIndexedSha` or the current `HEAD` sha is missing
- **THEN** the Index card MUST show the staleness as unknown rather than as up to date

### Requirement: index-aware agent skill section
The flagship `iris-workspace` skill MUST include one section that activates when the project's index is enabled, directing the agent to run impact analysis before editing any symbol and to query the graph before exploring unfamiliar code, mirroring the repository's own agent rules. The section MUST name both the MCP tools and their CLI equivalents so it works whether or not the host has the MCP.

#### Scenario: skill section is generated for every host
- **WHEN** `iris init` installs the flagship skill for a selected host
- **THEN** the generated skill MUST include the index-aware section regardless of whether indexing is enabled for that project

#### Scenario: section names MCP and CLI equivalents
- **WHEN** an agent reads the index-aware section
- **THEN** the section MUST name `gitnexus_impact` / `gitnexus_query` (MCP) and `gitnexus impact` / `gitnexus query` (CLI) so the agent can follow the guidance without the MCP

#### Scenario: section degrades without the MCP
- **WHEN** the host does not provide the GitNexus MCP
- **THEN** the section MUST still be usable by directing the agent to the CLI equivalents, and MUST NOT assume MCP availability

### Requirement: offline contract preserved
The default indexing path MUST NOT introduce a network or indexer dependency. The system MUST NOT require the indexer to be installed for any init path that does not opt into indexing via `--index`, and the existing offline smoke test MUST continue to pass.

#### Scenario: offline smoke still passes
- **WHEN** `iris init --yes --tools none` runs in CI without network access and without the indexer
- **THEN** it MUST complete without prompting, without network access, and without referencing the indexer

#### Scenario: no auto-download on absence
- **WHEN** `iris init --index` cannot find the indexer
- **THEN** the system MUST refuse with install instructions and MUST NOT attempt any network fetch
