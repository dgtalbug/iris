## MODIFIED Requirements

### Requirement: supported CLI installation path
The system MUST provide a clear installation path for the `iris` command that works across supported environments, and the CLI itself MUST refuse an unsupported environment or an unrecognized invocation with an actionable message rather than an internal runtime failure, because the package manager only warns about an unsupported runtime and cannot be relied on to enforce it.

#### Scenario: user installs the CLI
WHEN a user follows the documented install flow
THEN the CLI MUST be available as `iris` and MUST expose the expected command surface.

#### Scenario: install fails with clear guidance
WHEN installation prerequisites are missing or unsupported
THEN the system MUST fail with a simple, actionable message instead of a vague runtime error.

#### Scenario: CLI runs on an unsupported runtime
WHEN the installed CLI is executed on a runtime older than the supported minimum
THEN it MUST report the supported minimum and the runtime it found, MUST instruct the user to install a supported runtime, MUST exit with the documented environment-error code, and MUST NOT emit an internal stack trace or perform any workspace write.

#### Scenario: invocation is not recognized
WHEN a user passes an unknown option or an unknown command
THEN the CLI MUST report what was not recognized in a single message, MUST point the user at `iris --help`, MUST exit with the documented user-error code, and MUST NOT emit an internal stack trace.

### Requirement: versioned package distribution
The project MUST distribute the CLI through a package entrypoint that installs the same binary and command surface as the repository build on macOS, Linux, and Windows, MUST let a user and an automated installer read the installed version directly from the CLI, and MUST NOT publish package-manager metadata for a distribution channel whose release inputs do not yet exist.

#### Scenario: package install path is available
WHEN a user installs the published package with the documented package manager
THEN the command MUST resolve to the same project binary and versioned CLI behavior as the repository build

#### Scenario: upgrade path is clear
WHEN a user upgrades the installed CLI
THEN the system MUST expose a predictable version and install flow that keeps the CLI current

#### Scenario: installed version is requested
WHEN a user or an automated check asks the CLI for its version
THEN the CLI MUST print the installed package version as its own output, MUST exit successfully, and that value MUST match the version of the package the binary was installed from, so an installation can be verified without parsing the help text

#### Scenario: a distribution channel lacks release inputs
WHEN a channel such as a Homebrew formula would require a published release URL and checksum that do not exist yet
THEN the project MUST document that channel as unavailable and MUST NOT ship a formula or manifest that claims otherwise

### Requirement: minimal install smoke validation
The release workflow MUST include a minimal verification that the installed CLI works for a basic command path, and release verification MUST reject a package payload that omits any asset the installed CLI needs to initialize a workspace.

#### Scenario: install smoke test passes
WHEN the package or formula is installed
THEN a fast smoke check such as `iris --help` or a minimal render run MUST succeed without additional repo setup.

#### Scenario: invalid installation is surfaced early
WHEN the install path is broken or incompatible
THEN the validation step MUST fail early and identify the missing or unsupported prerequisite.

#### Scenario: package payload omits a required initialization asset
WHEN release verification inspects the package payload and any asset that initialization reads at runtime is absent from the declared payload
THEN verification MUST fail and MUST name the missing asset, so that a payload which cannot initialize a workspace is never published

### Requirement: documentation and upgrade guidance
The project MUST provide install instructions that align with the local-first design and current project conventions, MUST present only install paths that a reader can run successfully at the time of reading, and MUST state where the published artifact is hosted even when the documented commands are not that host's own installer.

#### Scenario: user can self-serve setup
WHEN a new user reads the docs
THEN they MUST be able to install and verify the CLI with a single, documented path.

#### Scenario: command reference stays current
WHEN package distribution changes
THEN the install docs and command reference MUST stay aligned with the actual CLI behavior.

#### Scenario: reader chooses how to install
WHEN a reader looks for the supported ways to obtain the CLI
THEN the documentation MUST present a no-install invocation, a persistent installation, and any additional channel that is actually available, MUST identify the registry the artifact is published to, and MUST NOT present an install command the project does not support as the documented path

#### Scenario: an install path has a client-specific prerequisite or delay
WHEN a documented install path requires prior client setup or can fail immediately after a release because of a client's own freshness policy
THEN the documentation MUST state that prerequisite or delay next to the command, so a user who hits it can recognize it as expected behavior rather than a broken release

#### Scenario: documentation describes an unreleased state
WHEN the project publishes a release
THEN the install documentation MUST NOT retain statements that the package is unavailable or that describe pre-release conditions that no longer hold
