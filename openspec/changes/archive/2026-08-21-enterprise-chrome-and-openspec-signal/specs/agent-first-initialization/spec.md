# agent-first-initialization

## MODIFIED Requirements

### Requirement: one-command agent-first setup
The system MUST make `iris init` the complete project setup and upgrade flow for an installed Iris CLI, MUST report the agent surfaces that operation installed, and MUST NOT record derived tool detection in the user-owned workspace configuration.

#### Scenario: first initialization
- **WHEN** a user runs `iris init` in a repository with no Iris workspace
- **THEN** the system MUST create the usable local workspace, install the supported agent-facing Iris skill surfaces, and render the dashboard in that operation

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
- **THEN** that file MUST NOT contain detection results derived from the repository's contents, so that a value frozen at creation time can never contradict the detection the dashboard actually reads

## ADDED Requirements

### Requirement: installed agent surface visibility

The generated workspace MUST show which agent surfaces Iris installed and where each one lives, so that the setup Iris performs is inspectable from the dashboard rather than only from the filesystem.

#### Scenario: surfaces are installed

- **WHEN** a user opens the generated command reference after initialization
- **THEN** it MUST list each installed agent surface with its destination path and the agent tooling that reads it

#### Scenario: a surface could not be written

- **WHEN** a surface was preserved as a conflict instead of being written
- **THEN** the listing MUST mark that surface as not installed and give the reason, rather than presenting it as available
