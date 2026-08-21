## Purpose

Define a repeatable install and release path for the `iris` CLI so it can be installed, verified, and upgraded predictably without repo-specific workarounds.

## ADDED Requirements

### Requirement: Reliable install path
The system SHALL provide a documented install path for the `iris` CLI that works in a clean environment and clearly identifies the supported package or distribution method.

#### Scenario: Fresh install in a supported environment
- **WHEN** a user installs `iris` in a clean terminal environment
- **THEN** the CLI SHALL be available as a command with the expected help output and core commands

### Requirement: Versioned release artifact
The project SHALL expose a versioned distribution artifact or package metadata so users can install a specific release and upgrade intentionally.

#### Scenario: Release version lookup
- **WHEN** a user inspects the package or release metadata
- **THEN** the system SHALL expose a version identifier and a repeatable installation route

### Requirement: Install smoke validation
The project SHALL provide a smoke-check validation flow that proves the installed CLI can initialize a project and run a minimal render command.

#### Scenario: Post-install validation
- **WHEN** a user or release process runs the install smoke check
- **THEN** the command SHALL fail clearly on genuine issues and pass only when the CLI can start and execute core functionality

### Requirement: Offline-safe documentation
The install and release documentation SHALL describe a local-first workflow and avoid requiring remote services for basic use.

#### Scenario: Local use after install
- **WHEN** a user follows the install instructions in a network-restricted environment
- **THEN** the CLI SHALL still support the local project initialization and rendering flow described by the main product
