# brew-formula-and-installability Specification

## Purpose
Provide a reliable, low-friction installation and upgrade path for the `iris` CLI so the project remains easy to adopt without depending on a repo checkout or manual build steps.

## Requirements

### Requirement: supported CLI installation path
The system MUST provide a clear installation path for the `iris` command that works across supported environments.

#### Scenario: user installs the CLI
WHEN a user follows the documented install flow
THEN the CLI MUST be available as `iris` and MUST expose the expected command surface.

#### Scenario: install fails with clear guidance
WHEN installation prerequisites are missing or unsupported
THEN the system MUST fail with a simple, actionable message instead of a vague runtime error.

### Requirement: versioned package distribution
The project MUST distribute the CLI through a package entrypoint that installs the same binary and command surface as the repository build on macOS, Linux, and Windows, and MUST NOT publish package-manager metadata for a distribution channel whose release inputs do not yet exist.

#### Scenario: package install path is available
WHEN a user installs the published package with the documented package manager
THEN the command MUST resolve to the same project binary and versioned CLI behavior as the repository build

#### Scenario: upgrade path is clear
WHEN a user upgrades the installed CLI
THEN the system MUST expose a predictable version and install flow that keeps the CLI current

#### Scenario: a distribution channel lacks release inputs
WHEN a channel such as a Homebrew formula would require a published release URL and checksum that do not exist yet
THEN the project MUST document that channel as unavailable and MUST NOT ship a formula or manifest that claims otherwise

### Requirement: minimal install smoke validation
The release workflow MUST include a minimal verification that the installed CLI works for a basic command path.

#### Scenario: install smoke test passes
WHEN the package or formula is installed
THEN a fast smoke check such as `iris --help` or a minimal render run MUST succeed without additional repo setup.

#### Scenario: invalid installation is surfaced early
WHEN the install path is broken or incompatible
THEN the validation step MUST fail early and identify the missing or unsupported prerequisite.

### Requirement: documentation and upgrade guidance
The project MUST provide install instructions that align with the local-first design and current project conventions.

#### Scenario: user can self-serve setup
WHEN a new user reads the docs
THEN they MUST be able to install and verify the CLI with a single, documented path.

#### Scenario: command reference stays current
WHEN package distribution changes
THEN the install docs and command reference MUST stay aligned with the actual CLI behavior.
