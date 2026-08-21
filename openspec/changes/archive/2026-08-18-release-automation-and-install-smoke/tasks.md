## 1. Install path and release definition

- [x] 1.1 Choose the primary install surface for the `iris` CLI and confirm the supported target environments.
- [x] 1.2 Add or formalize the package metadata needed for a repeatable install and upgrade flow.
- [x] 1.3 Document the supported installation and upgrade steps for end users.

## 2. Smoke validation and release automation

- [x] 2.1 Add a smoke-check command or script that validates the installed CLI in a clean environment.
- [x] 2.2 Wire release automation or packaging metadata to produce versioned install artifacts consistently.
- [x] 2.3 Confirm the release path remains compatible with the project’s offline-safe, local-first model.

## 3. Review and rollout

- [x] 3.1 Verify the install path works against the minimum supported Node version.
- [x] 3.2 Review the documentation and release outputs for clarity and version consistency.
- [x] 3.3 Keep the change scoped to installability and distribution, not broader product changes.
