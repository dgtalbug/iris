## Context

Phase 1 (`setup-experience-and-brand-guard`) relocates Iris's machine state to
a user-global home at `~/.iris`. The home holds `config.json`, `registry.json`
(project id → root/remote/lastSeen), and `projects/<id>/` per-project machine
state. With that split, Iris knows about every project registered on this
machine — but the user has no single view across them. A developer working on
three Iris projects today must `cd` into each repo and run `iris open` to see
what is there.

Phase 3 builds on that relocation. It could not exist without it: a global
dashboard requires a user-global registry, and a user-global registry requires
machine state to live outside any single repo. This change adds a global Iris
dashboard at `~/.iris/dashboard.html` aggregating every registered project, and
wires it into the standard render lifecycle so it stays current without a new
mandatory command.

Phase 2 (a separate, not-yet-written change) adds optional GitNexus indexing
that writes an `~/.iris/projects/<id>/index.json` pointer when enabled. Phase 3
reads that pointer when present and degrades gracefully when absent.

## Goals / Non-Goals

**Goals:**

- A global dashboard at `~/.iris/dashboard.html` showing every registered
  project, its page counts, recent activity, and — when Phase 2 indexing is
  enabled — per-project index status.
- Reuse the same Electric templates, tokens, and component vocabulary as
  workspace pages so the global view is the same voice as the per-project view.
- `iris open --global` opens the global dashboard from any directory.
- `iris render --all` refreshes the global dashboard when more than one project
  is registered, so the global view stays current as part of the standard
  render lifecycle.
- Treat the dashboard as machine-local generated output: never committed,
  gitignored by definition, regenerated from the registry on every refresh.

**Non-Goals:**

- A hosted or networked dashboard. The global dashboard is a `file://` HTML
  page, offline, no CDN at view time.
- Replacing per-project dashboards. Each project's `iris/index.html` remains
  the authoritative view of that project; the global dashboard is an
  aggregation layer above it.
- A new mandatory command. `iris open --global` is additive; `iris render --all`
  refreshes the global dashboard opportunistically, never as a hard requirement
  on single-project machines.
- Deciding whether a dedicated `iris dashboard` verb is warranted (see Open
  Questions).
- Indexing itself. Phase 2 owns the index; Phase 3 only reads the pointer.

## Decisions

### The registry is the source of truth for aggregation

`~/.iris/registry.json` (introduced by Phase 1) maps project id →
root/remote/lastSeen. The global dashboard reads this file and, for each entry,
opens the project's per-project home at `~/.iris/projects/<id>/` to read its
page registry (`state.json`) and optional index pointer (`index.json`). A
project whose root directory no longer exists is shown as stale rather than
dropped — the registry is the source of truth, not the filesystem.

### Same Electric templates, no new runtime

The global dashboard renders through the same page shell, tokens, and
component vocabulary as workspace pages. Lucide icons are inlined as SVG at
generation time; Mermaid is the vendored strict classic runtime already used by
workspace pages. No CDN, no script tag, no fetch at view time. The dashboard is
a single self-contained `file://` HTML document.

### `iris open --global` is the open path

The global dashboard opens via `iris open --global`. This matches Phase 1's
lean toward no new verbs: `open` already exists, and `--global` is a flag on
it. Whether a dedicated `iris dashboard` verb is more discoverable is left as
an open question and not decided here.

### `iris render --all` refreshes the global dashboard opportunistically

When `iris render --all` finishes and more than one project is registered, the
renderer refreshes `~/.iris/dashboard.html` as a final step. On a single-project
machine the refresh is skipped (the per-project dashboard already shows
everything). The refresh is best-effort: a failure to write the global
dashboard does not fail the render.

### Generated, never committed

`~/.iris/dashboard.html` lives under `~/.iris`, outside every registered repo.
It is gitignored by definition — no `.gitignore` entry is needed in any project
because the file is not in any project. It is regenerated from the registry on
every refresh and has no authored source.

### Index status is optional and graceful

Phase 2's indexing, when enabled, writes `~/.iris/projects/<id>/index.json`.
Phase 3 reads it when present and shows an index-status row per project. When
absent (indexing disabled or Phase 2 not landed), the dashboard shows project
metadata and page counts without an index-status row. Phase 3 never fails if
the index pointer is missing.

## Risks / Trade-offs

- [Cross-project `file://` links are fragile if a project moves] → The
  dashboard links to each project's `iris/index.html` by absolute path. A moved
  checkout breaks the link until the next `iris init`/`iris render --all`
  re-registers the project. The registry entry's `lastSeen` is the staleness
  signal; whether to show cross-project links at all is an open question.
- [Reading every project's state on every render is expensive] → The
  aggregation reads only `registry.json` and each project's `state.json` (small
  JSON). It does not walk page trees. Cost is bounded by the number of
  registered projects, not the size of any one project.
- [Stale entries accumulate in the registry] → A project whose root was
  deleted remains in the registry until manually cleaned. The dashboard shows
  such entries as stale (root missing); automatic pruning is out of scope.
- [`iris render --all` does extra work on multi-project machines] → The global
  refresh is best-effort and silent on failure; it adds one JSON read per
  registered project and one HTML write. On a single-project machine it is
  skipped entirely.

## Migration Plan

1. Land `src/lib/global-registry.ts` (registry aggregation) and
   `src/templates/pages/global-dashboard.ts` (page template) behind a feature
   flag or direct wire.
2. Wire `iris open --global` into `src/cli.ts` and the `open` command.
3. Add the opportunistic global refresh as the final step of `iris render --all`
   in `src/commands/render.ts`, gated on registered-project count > 1.
4. Verify: offline render of a multi-project machine produces a
   `~/.iris/dashboard.html` listing every registered project; `iris open
   --global` opens it; a single-project machine skips the refresh; a missing
   `index.json` degrades gracefully.
5. Strict OpenSpec validation passes.

## Open Questions

- **`iris open --global` vs a dedicated `iris dashboard` verb.** `--global`
  matches Phase 1's "no new verbs" lean and reuses the existing `open` command.
  A dedicated `iris dashboard` verb is more discoverable but adds a command to
  the catalog. Dgtal flagged this earlier; Phase 3 ships `--global` and leaves
  the verb question open.
- **Auto-refresh on every `iris render` vs `--all`-only.** Today the proposal
  refreshes the global dashboard only on `iris render --all`. Auto-refreshing
  on every `iris render` (even single-page) is convenient but adds work to the
  hot path; `--all`-only is cleaner and matches the existing lifecycle.
- **Cross-project `file://` links vs metadata-only.** The dashboard can link to
  each project's `iris/index.html` by absolute path, or just show project
  metadata. Cross-project `file://` links work but break if a project moves
  before re-registration. The registry's `lastSeen` is the staleness signal.
- **Per-project "last rendered" timestamp and staleness display.** The registry
  already carries `lastSeen`. A separate "last rendered" timestamp would let
  the dashboard show staleness per project, but it adds a write to every
  render. Whether to show staleness, and how, is open.
