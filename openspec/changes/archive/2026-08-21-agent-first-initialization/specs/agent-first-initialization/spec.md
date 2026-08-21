## Purpose

Make a single installed Iris command establish and safely upgrade the local visual workspace and its agent-facing instructions without requiring repository-document ingestion or network access.

## ADDED Requirements

### Requirement: one-command agent-first setup
The system MUST make `iris init` the complete project setup and upgrade flow for an installed Iris CLI.

#### Scenario: first initialization
- **WHEN** a user runs `iris init` in a repository with no Iris workspace
- **THEN** the system MUST create the usable local workspace, install the supported agent-facing Iris skill surfaces, and render the dashboard in that operation

#### Scenario: repeated initialization
- **WHEN** a user runs `iris init` again in an initialized repository
- **THEN** the system MUST refresh Iris-managed outputs idempotently without requiring `iris update`, `iris adopt`, or `iris sync` as a setup step

#### Scenario: initialized repository has content commands
- **WHEN** initialization completes successfully
- **THEN** agents and users MUST still be able to use the existing draft, render, report, archive, publish, export, and open commands

### Requirement: canonical multi-agent skill installation
The system MUST generate supported agent skill files from one canonical Iris-owned skill source rather than maintaining independent instruction copies.

#### Scenario: supported skill surfaces are installed
- **WHEN** `iris init` installs agent guidance
- **THEN** it MUST provide the `iris-workspace` skill to the generic/Codex, Claude, and GitHub Copilot repository skill locations

#### Scenario: unrelated agent content exists
- **WHEN** a supported skill directory already contains sibling skills or unrelated files
- **THEN** initialization MUST leave that content unchanged

### Requirement: managed skill preservation
The system MUST identify its generated skill content with verifiable managed ownership metadata and fail safely around user-owned or modified content.

#### Scenario: managed content is intact
- **WHEN** a generated Iris skill has valid ownership markers and its managed content matches the recorded digest
- **THEN** initialization MUST update only that managed content and preserve user-authored bytes outside the managed boundary

#### Scenario: managed content was edited
- **WHEN** the managed content no longer matches its recorded digest
- **THEN** initialization MUST preserve the file and report an actionable collision instead of overwriting the edit

#### Scenario: target is unmarked or malformed
- **WHEN** the target skill file is user-owned, unmarked, partially marked, misordered, unsafe, or outside the repository boundary
- **THEN** initialization MUST not truncate, replace, or follow it and MUST report the affected surface

### Requirement: packaged offline initialization
The installed Iris package MUST contain every template and runtime file required for initialization after the package itself has been obtained.

#### Scenario: installed package initializes offline
- **WHEN** a user runs `iris init` from a packed or globally installed Iris package with no repository checkout or network access
- **THEN** the command MUST generate the workspace and agent skills entirely from packaged local assets

#### Scenario: package payload is verified
- **WHEN** the release package is built
- **THEN** release verification MUST fail if the canonical agent template or its installed generator is absent from the package payload

### Requirement: safe retirement of adopted document records
The system MUST remove a legacy adopted-document page only when Iris can positively prove that the exact record remains an unmodified generated mirror.

#### Scenario: legacy generated mirror is proven
- **WHEN** legacy state provenance, a safe README or docs source path, page identity, generated metadata, and stored and current content digests all agree
- **THEN** initialization MAY remove that exact generated page and normalize the state before rendering

#### Scenario: ownership proof is incomplete
- **WHEN** any ownership, path, identity, metadata, or digest check is missing or mismatched
- **THEN** initialization MUST preserve the page and report it for manual review

#### Scenario: arbitrary user page resembles an adopted page
- **WHEN** a user-created page has a `doc-` prefix, an `adopted-doc` tag, source-like prose, or only some legacy fields
- **THEN** initialization MUST NOT treat those hints alone as permission to delete the page
