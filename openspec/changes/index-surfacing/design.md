## Context

Phase 1 (`setup-experience-and-brand-guard`) lands the user-global `~/.iris` home, the staged `iris init` flow, the `--index` / `--no-index` CLI flags, and an `indexing` slot in `~/.iris/config.json`. Phase 1's design doc lists GitNexus surfacing as a separate follow-up change and locks three decisions that bound this change:

- GitNexus is OPT-IN via `--index`. The default init stays offline; the offline contract is preserved.
- Iris never writes to `~/.gitnexus/` or `.gitnexus/`. It reads the graph via the CLI/MCP only.
- Indexing state is machine-local. It lives in `~/.iris/projects/<id>/`, never in the committed workspace.

The GitNexus CLI exposes the surface this change builds on. `npx gitnexus --help` lists `analyze`, `status`, `query`, `context`, `impact`, `detect-changes`, and `mcp`. `npx gitnexus status` prints `Indexed commit`, `Current commit`, and a `stale` hint for the current repo — the exact fields Iris needs for the Index card and the staleness hint. `npx gitnexus analyze` writes the index under `~/.gitnexus/` (or `.gitnexus/` in-repo when configured) and updates `CLAUDE.md` / `AGENTS.md` with agent rules — Iris must not duplicate that write.

## Goals / Non-Goals

**Goals:**

- Make `iris init --index` locate the indexer, refuse with actionable install instructions when it is absent, and never auto-download.
- Record a machine-local status pointer in `~/.iris/projects/<id>/index.json` so the dashboard and Commands page can render an Index card without re-running the indexer.
- Surface an Index card on the Overview and Commands pages showing status, symbol count, flow count, last indexed sha, and a staleness hint against current `HEAD`.
- Add one index-aware section to the `iris-workspace` skill so an agent working in an indexed repo runs impact analysis before edits and queries the graph before exploring unfamiliar code.
- Keep `iris/config.yaml` free of indexing state; keep the default `--no-index` path fully offline.

**Non-Goals:**

- Bundling or auto-installing the GitNexus binary. Discovery is by `PATH` then `npx --no-install gitnexus`; absent means refuse.
- Writing to `~/.gitnexus/` or `.gitnexus/`. Iris reads via the CLI/MCP only.
- Surfacing indexing state in the committed workspace (`iris/config.yaml`, authored sources, or generated HTML metadata). Indexing is machine-local by design.
- Re-implementing the GitNexus agent rules in Iris's own skill. The `iris-workspace` skill gains one section that mirrors the repo's `CLAUDE.md` / `AGENTS.md` rules; the canonical rules stay authored by GitNexus.
- Adding `gitnexus_impact` / `gitnexus_query` MCP tools as a hard dependency. The skill section must work whether or not the host has the MCP.

## Decisions

### Opt-in via `--index`, refuse-if-absent, never auto-download

`iris init --index` resolves the indexer in two steps: check `PATH` for a `gitnexus` executable first, then fall back to `npx --no-install gitnexus` (which uses the cached package and never fetches). If neither resolves, init REFUSES with a one-line error naming the install command (`npm i -g gitnexus` or `npx gitnexus setup`) and exits non-zero. Iris never runs `npm install`, never writes to `~/.gitnexus/`, and never silently proceeds without the indexer. `iris init --no-index` (the default) skips the entire flow and stays offline; the existing offline smoke test is unchanged.

### Iris owns a status pointer, not the index

Iris writes `~/.iris/projects/<id>/index.json` with the shape:

```
{
  "enabled": true,
  "lastIndexedSha": "<sha>",
  "symbols": <number>,
  "flows": <number>,
  "indexedAt": "<ISO 8601>"
}
```

The pointer is written after `gitnexus analyze` completes (or after `gitnexus status` is parsed on a non-init refresh). Iris reads the graph via the CLI (`gitnexus status`, `gitnexus query`, `gitnexus impact`) or the MCP when the host has it; it never reads `~/.gitnexus/` directly. The pointer is the only indexing state Iris owns, and it is machine-local — `iris/config.yaml` records nothing about indexing.

### Index card on Overview and Commands

The Overview and Commands page templates get an Index card. The card reads `index.json` and renders: status (`enabled` / `disabled`), symbol count, flow count, last indexed sha (short), and a staleness hint. The staleness hint compares `lastIndexedSha` to the current `HEAD` sha (read from git) and shows `up to date`, `stale (N commits behind)`, or `unknown` when either sha is missing. When the pointer is absent (project not indexed), the card is either omitted or shows a single `disabled` line — never an error, so a fresh clone with no indexer still renders.

### One index-aware section in the `iris-workspace` skill

The flagship skill gains one section titled "When the index is enabled". It mirrors the repo's own `CLAUDE.md` / `AGENTS.md` agent rules: run `gitnexus impact` (or the MCP `gitnexus_impact`) before editing any symbol; query the graph (`gitnexus query` / `gitnexus_query`) before exploring unfamiliar code; warn the user on HIGH or CRITICAL impact. The section degrades gracefully: when the MCP is unavailable, the same guidance applies to the CLI commands. The section is generated for every host that already receives the flagship skill; no new managed marker is introduced.

### `iris/config.yaml` records nothing about indexing

Indexing state is machine-local by design. The committed `iris/config.yaml` keeps its existing keys; no `index` or `indexing` key is added. The user-global `~/.iris/config.json` already has an `indexing` slot from Phase 1; this change writes the per-project pointer at `~/.iris/projects/<id>/index.json` instead, so a moved checkout retains its indexing state under the same project identity.

## Risks / Trade-offs

- [Indexer absent in CI] → `iris init --index` refuses with a clear install command; CI runs `--no-index` (the default) and is unaffected. The refuse path is tested.
- [Stale pointer misleads the dashboard] → The staleness hint compares against live `HEAD` so a stale pointer is visible, not hidden. The card shows `stale` rather than a fresh-looking `enabled`.
- [Skill section assumes MCP the host lacks] → The section names both the MCP tool and the CLI equivalent, so it works on hosts without the MCP.
- [Indexer writes `CLAUDE.md` / `AGENTS.md` Iris does not own] → Iris does not gate on or rewrite those files; the skill section points at them as the canonical agent rules.
- [Auto-download temptation] → Refused by design. The discovery path is `PATH` then `npx --no-install`; there is no code path that fetches the binary.

## Migration Plan

1. Land `src/lib/indexing.ts` (discovery, status-pointer read/write, staleness) and its tests behind a feature flag that is off by default.
2. Wire `iris init --index` to call `indexing.ts`; write `index.json` on success; refuse with install instructions on absence. Leave `--no-index` untouched.
3. Add the Index card to the Overview and Commands page templates; read from `index.json`, degrade to disabled when absent.
4. Add the "When the index is enabled" section to the `iris-workspace` skill template; regenerate the skill for every host.
5. Verify: offline smoke (`iris init --yes --tools none --no-index`) still passes; `iris init --index` with the indexer absent refuses with the right message; `iris init --index` with the indexer present writes `index.json` and renders the card; the skill section renders on every host.

## Open Questions

- **Sync vs async `gitnexus analyze` on `iris init --index`.** Run `gitnexus analyze` synchronously (blocks init until the index is ready) or kick it off in the background and poll? Sync is simpler and the index is ready when init returns; async is better UX for large repos but the index may not be ready immediately, so the Index card would show `indexing…` until the pointer is written.
- **Staleness hint source.** Compare `lastIndexedSha` to current `HEAD` (simple, uses only git) or to a stored "last analyzed commit" that GitNexus exposes (more accurate, needs `gitnexus status` to be parsed at pointer-write time)? `gitnexus status` already prints `Indexed commit` and `Current commit`, so the second option is cheap if we trust the CLI output.
- **`iris update` re-index behavior.** Should `iris update` also re-run `gitnexus analyze` when the project is indexed, or only `iris init --index`? Re-running on update keeps the index fresh on every refresh; only-init keeps update fast and offline.
- **MCP dependency in the skill section.** Does Phase 2 need to assume the `gitnexus_impact` / `gitnexus_query` MCP tools exist, or is the CLI sufficient? The repo's own `CLAUDE.md` / `AGENTS.md` assume MCP; Iris's skill section should work whether or not the host has the MCP, so the section names both — but does Iris need to detect MCP availability and tailor the section, or is naming both enough?
