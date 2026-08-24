## MODIFIED Requirements

### Requirement: one-command agent-first setup
The system MUST make `iris init` the complete project setup and upgrade flow for an installed Iris CLI. Init MUST run as a staged flow — welcome, validation, host detection, tool selection, generation, and a completion summary — and MUST report the agent surfaces it installed. Init MUST NOT record derived tool detection in the user-owned workspace configuration; the selected tools are recorded in the user-global configuration instead. Indexing is opt-in via `--index`; the default `--no-index` path MUST stay fully offline and MUST NOT require the indexer to be installed.

#### Scenario: first initialization
- **WHEN** a user runs `iris init` in a repository with no Iris workspace
- **THEN** the system MUST detect supported agent hosts, generate the usable local workspace, install the selected agent-facing Iris skill surfaces, and render the dashboard in that operation

#### Scenario: repeated initialization
- **WHEN** a user runs `iris init` again in an initialized repository
- **THEN** the system MUST refresh Iris-managed outputs idempotently without requiring `iris update`, `iris adopt`, or `iris sync` as a setup step

#### Scenario: initialized repository has content commands
- **WHEN** initialization completes successfully
- **THEN** agents and users MUST still be able to use the existing draft, render, report, archive, publish, export, and open commands

#### Scenario: initialization installs agent surfaces
- **WHEN** `iris init` finishes installing agent surfaces
- **THEN** it MUST report how many surfaces were created, updated, and left unchanged, and MUST name every surface it could not write, so that the operator can see what was installed without inspecting the filesystem

#### Scenario: generated configuration is written
- **WHEN** the system writes the workspace configuration file
- **THEN** that file MUST NOT contain detection results derived from the repository's contents, and MUST NOT contain any indexing state, so that a value frozen at creation time can never contradict the detection the dashboard actually reads and so that indexing stays machine-local

#### Scenario: default init stays offline
- **WHEN** a user runs `iris init --yes --tools none` (or any init without `--index`)
- **THEN** the system MUST complete without prompting, without network access, and without requiring the indexer to be installed

#### Scenario: opt-in indexing refuses when the indexer is absent
- **WHEN** a user runs `iris init --index` and the indexer cannot be resolved on `PATH` or via `npx --no-install gitnexus`
- **THEN** the system MUST refuse with a one-line message naming the install command, MUST exit non-zero, and MUST NOT auto-download or auto-install the indexer

#### Scenario: opt-in indexing writes a status pointer
- **WHEN** a user runs `iris init --index` and the indexer is present
- **THEN** the system MUST run the indexer, write a machine-local status pointer under `~/.iris/projects/<id>/`, and MUST NOT write any indexing state into the committed workspace or into `~/.gitnexus/` or `.gitnexus/`
