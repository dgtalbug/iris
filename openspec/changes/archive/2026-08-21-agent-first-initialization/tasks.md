## 1. Lock migration and state safety

- [x] 1.1 Add version-tolerant state parsing and tests for normalized version 2 registry data while retaining the legacy fields needed during migration.
- [x] 1.2 Implement confined positive-proof classification for active adopted-document records and cover proven removal, hash mismatch, partial metadata, malformed data, unsafe paths, symlinks, user-created lookalikes, and archived-record preservation.
- [x] 1.3 Normalize migrated state to the minimal page registry and verify repeated migration is idempotent.

## 2. Package and install the canonical agent skill

- [x] 2.1 Add one canonical packaged `iris-workspace` skill template describing the supported content workflow without product adopt/sync instructions.
- [x] 2.2 Implement the three-surface skill generator with ownership/version/digest markers, confinement and symlink guards, atomic writes, and canonical-body parity.
- [x] 2.3 Add tests for first install, unchanged rerun, managed upgrade, outside-marker preservation, edited-body collision, unmarked/malformed targets, sibling preservation, and isolated write failure.

## 3. Make init the complete setup flow

- [x] 3.1 Reorder `iris init` to scaffold, migrate, normalize state, refresh managed workspace surfaces, install skills, render, validate outputs, and report incomplete setup conflicts.
- [x] 3.2 Keep `iris update` compatible by reusing the safe managed-surface and skill installer while making `iris init` the documented setup and upgrade command.
- [x] 3.3 Extend lifecycle/init tests for first run, rerun, user configuration/pages/archive preservation, unrelated VS Code tasks, and continued use of ordinary content commands.

## 4. Retire product adoption and synchronization

- [x] 4.1 Remove `adopt` and `sync` from CLI routing and help and assert both names are rejected as unknown Iris commands.
- [x] 4.2 Remove adoption/sync implementation and adopted-source/hash/stale contracts while retaining archive, update, render registration, session-source evidence, and generic report Markdown support.
- [x] 4.3 Remove stale/adopted README assumptions from dashboard data and Aperture templates and update navigation/accessibility assertions for the agent-first empty state.
- [x] 4.4 Assert OpenSpec `/opsx:sync` and `openspec-sync-specs` instruction surfaces remain present and unchanged in purpose.

## 5. Verify installed packaging and offline behavior

- [x] 5.1 Add the canonical template path to the npm allowlist and release-package required-file checks.
- [x] 5.2 Extend the packed-install smoke test to inspect the tarball payload, initialize in an unrelated temporary repository, verify all three skills, rerun idempotently, and create/render an ordinary page without source-checkout assets or runtime network access.
- [x] 5.3 Run focused packaging and installed smoke checks and resolve any path differences across the supported Node platforms.

## 6. Update documentation and regenerate dogfood

- [x] 6.1 Update `README.md`, `docs/cmds.md`, `docs/tech.md`, `docs/design-system.md`, and `docs/status.md` for the one-command flow, installed surfaces, preservation policy, explicit rendering, and removal of product adoption/synchronization.
- [x] 6.2 Build the CLI and run its migration/init/render path against this repository to remove only the six proven active adopted dogfood pages and regenerate state, design assets, project placeholders, and dashboard HTML.
- [x] 6.3 Inspect the generated diff and run HTML/link integrity checks to prove no generated file was hand-edited and no user-owned page or archive was lost.

## 7. Complete change verification

- [x] 7.1 Run lint, token lint, typecheck, the full Vitest suite, HTML integrity, and packed-install smoke as the complete repository gate.
- [x] 7.2 Run strict OpenSpec validation and the verification workflow, reconcile every requirement and scenario with code/test evidence, and leave no incomplete implementation task before spec sync and archive.
