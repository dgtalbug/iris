## Why

Iris currently requires repository-document adoption and synchronization to make its dashboard useful, while its advertised agent surfaces are not shipped by the installed package. Project setup should instead be one local, deterministic `iris init` operation that installs agent guidance and preserves user-owned work without copying or monitoring general documentation.

## What Changes

- **BREAKING** remove the Iris CLI commands `iris adopt` and `iris sync`, including their help entries, document-mirroring behavior, adopted-source hashes, stale-source states, tests, documentation, and generated dashboard copy.
- Make `iris init` the complete first-run and upgrade flow: scaffold or refresh the Iris workspace, safely migrate proven legacy adopted pages, install supported agent skills, and render the usable dashboard.
- Ship one canonical `iris-workspace` skill template in the npm package and generate managed skill files for generic/Codex agents, Claude, and GitHub Copilot without a network request after package installation.
- Preserve user configuration, pages, archives, unrelated editor tasks, sibling skills, unmarked files, and user-edited managed skill content; refresh only positively identified intact Iris-managed regions.
- Preserve all existing content commands and lifecycle behavior for `archive` and `update`; do not change OpenSpec `/opsx:sync` or `openspec-sync-specs` tooling.
- Remove this repository's proven generated `adopted-doc` dogfood records through the CLI migration/generation path and regenerate all CLI-owned HTML and state.
- Update the canonical requirements and product documentation to describe agent-first initialization and retire product document adoption/synchronization.

## Capabilities

### New Capabilities

- `agent-first-initialization`: One-command local workspace and agent-skill installation, including managed ownership, offline packaging, idempotence, upgrade, and preservation behavior.

### Modified Capabilities

- `project-lifecycle-automation`: Retire document adoption, incremental product synchronization, adopted-source metadata, and stale-source states while preserving bootstrap, archive, managed updates, and explicit rendering.

## Impact

- CLI routing and help in `src/cli.ts`; initialization, lifecycle, rendering, project-state, filesystem, and design-template code under `src/`.
- Npm package payload and installed smoke verification in `package.json`, release scripts, and tests.
- Generated agent surfaces under `.agents/skills`, `.claude/skills`, and `.github/skills` from one packaged canonical template.
- Tracked dogfood under `iris/`, regenerated only through the built CLI.
- Lifecycle, navigation, packaging, migration-safety, and documentation tests plus `README.md` and `docs/` command/technical/design/status references.
- Canonical OpenSpec lifecycle requirements; OpenSpec's own sync workflow and historical archives remain unchanged.
