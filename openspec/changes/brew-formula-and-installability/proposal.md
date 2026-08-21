## Why

The CLI and render pipeline are now working, but the project still lacks a reliable install story for everyday use. A local-first tool is easier to trust when users can install it consistently, verify the command surface quickly, and upgrade without manual repo cloning or shell hacks.

## What Changes

- Define a supported install path for the `iris` CLI using Homebrew and/or a standard Node package entrypoint.
- Package the release metadata so the CLI can be versioned and upgraded predictably.
- Add a smoke-testable install path that verifies the binary and core render commands work immediately after installation.
- Keep the install story aligned with the repo's local-first and offline-safe design principles.

## Capabilities

### New Capabilities
- brew-formula-and-installability: establish a distribution path for the CLI that is easy to install, verify, and upgrade.

### Modified Capabilities
- None

## Impact

- CLI adoption: easier setup for users who want to try or use the tool without a repo checkout.
- Release quality: versioning and install metadata become explicit and testable.
- Documentation: users get a clear first-run path and a consistent command reference.
