## Why

Phase 1 (`setup-experience-and-brand-guard`) makes `iris init` a staged, offline, host-aware setup flow and introduces the user-global `~/.iris` home. It also parses the `--index` / `--no-index` flags and reserves an `indexing` slot in user-global config — but it stops short of wiring those flags to real behavior. As a result, an operator who opts into indexing gets no surface inside Iris: the dashboard does not show whether the project is indexed, the agent skill gives no guidance on using the graph, and the CLI never checks that the indexer is even installed.

This change closes that gap. It surfaces GitNexus indexing inside Iris as an opt-in `iris init --index` flow that locates the indexer, records a status pointer in `~/.iris`, renders an Index card on the dashboard and Commands page, and adds one index-aware section to the `iris-workspace` skill. Iris stays a reader: it never writes to `~/.gitnexus/` or `.gitnexus/`, it never auto-downloads the indexer, and the default `--no-index` path stays fully offline so the existing smoke test keeps passing.

## What Changes

- Wire `iris init --index` to real behavior: locate the indexer binary by checking `PATH` first, then `npx --no-install gitnexus`; if absent, REFUSE with actionable install instructions and never auto-download. `iris init --no-index` (the default) skips all indexing and stays offline.
- Add a machine-local index status pointer at `~/.iris/projects/<id>/index.json` with the shape `{ enabled, lastIndexedSha, symbols, flows, indexedAt }`. Iris owns this pointer; it does NOT own `~/.gitnexus/` or `.gitnexus/` and reads the graph via the CLI/MCP only.
- Add an Index card to the Overview and Commands page templates showing status (enabled/disabled), symbol count, flow count, last indexed sha, and a staleness hint comparing `lastIndexedSha` to the current `HEAD` sha.
- Add one section to the `iris-workspace` skill: when the index is enabled, run impact analysis before editing any symbol and query the graph before exploring unfamiliar code — mirroring the repo's own `CLAUDE.md` / `AGENTS.md` agent rules. The section degrades gracefully when the host has no MCP and only the CLI is available.
- Keep `iris/config.yaml` free of indexing state. Indexing state is machine-local by design and lives in `~/.iris`; nothing about indexing is committed to the workspace.

## Capabilities

### New Capabilities

- `workspace-index-integration`: an opt-in bridge to a locally installed GitNexus indexer. Iris locates the indexer (refusing with install instructions if absent, never auto-downloading), records a machine-local status pointer in `~/.iris/projects/<id>/index.json`, surfaces an Index card on the dashboard and Commands page, and adds one index-aware section to the `iris-workspace` skill. Iris reads the graph via the CLI/MCP only and never writes to `~/.gitnexus/` or `.gitnexus/`.

### Modified Capabilities

- `agent-first-initialization`: the `--index` flag (already parsed by Phase 1) now has real behavior — indexer discovery, refuse-if-absent, status pointer write, and an opt-in path that stays offline by default. `--no-index` remains the default and skips all of the above.
- `project-lifecycle-automation`: the dashboard and Commands page render an Index card whose status is read from the machine-local pointer; the card is absent (or shows disabled) when the project is not indexed, so the committed workspace never depends on indexing.

## Impact

- Adds one new library module (`src/lib/indexing.ts`) responsible for indexer discovery, status-pointer read/write, and staleness computation. Adds the `index.json` shape to the user-global project directory.
- Modifies the Overview and Commands page templates to render an Index card from the status pointer; the card degrades to a disabled state when the pointer is absent.
- Adds one section to the `iris-workspace` skill template; the section is generated for every host that already receives the flagship skill.
- Touches `src/commands/init.ts` to invoke the indexing flow when `--index` is set, and touches `src/cli.ts` only if the existing flag plumbing needs a forward-compat note (no new flags are added).
- Preserves the offline contract: `iris init --yes --tools none --no-index` (the default) keeps the existing smoke test passing with no network and no indexer dependency.
- Does NOT touch `~/.gitnexus/`, `.gitnexus/`, or `iris/config.yaml`. Does NOT add a runtime dependency on the indexer binary — indexing is opt-in and the binary is discovered, not bundled.
