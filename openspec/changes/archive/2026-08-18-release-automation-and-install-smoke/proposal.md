## Why

The project now has a working local render pipeline, but it still lacks a repeatable install and release story. A tool that must be run from a repo checkout or shell-specific setup path is harder to trust, harder to validate, and harder to keep consistent across environments. This change establishes a predictable install and smoke-validation flow so the `iris` CLI can be installed, verified, and upgraded with confidence.

## What Changes

- Define the supported install path for the `iris` CLI and the package or distribution surface it relies on.
- Add release metadata and automation needed to ship versioned artifacts cleanly.
- Add a smoke-check path that validates the installed command in a clean environment before release.
- Keep the install flow aligned with the project’s offline-safe, local-first design.

## Capabilities

### New Capabilities
- `release-automation-and-install-smoke`: establish a repeatable package, install, and validation path for the CLI.

### Modified Capabilities
- None

## Impact

- CLI adoption: users can install the tool without repo-specific setup or shell tricks.
- Release quality: packaging and versioning become explicit and testable.
- Validation: the project can verify the installed command surface before shipping or documenting it.
