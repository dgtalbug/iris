## Why

Phase 1 (`setup-experience-and-brand-guard`) relocates Iris's machine state to a
user-global home at `~/.iris` and keeps a project registry mapping project id →
root/remote/lastSeen. With that split landed, Iris knows about every project
registered on this machine — but the user still has no single place to see them.
Today a developer working across three Iris projects must `cd` into each repo
and run `iris open` to remember what is there. The registry already holds the
truth; the dashboard does not yet surface it.

This change adds a global Iris dashboard at `~/.iris/dashboard.html` that
aggregates every registered project: page counts, recent activity, and — when
Phase 2 indexing is enabled — per-project index status. It reuses the same
Electric templates as workspace pages so the global view is the same voice as
the per-project view, with no CDN at view time, inlined Lucide, and vendored
Mermaid.

## What Changes

- Add `src/lib/global-registry.ts` that reads `~/.iris/registry.json` and
  aggregates per-project stats (page counts, recent activity, and index status
  from Phase 2's `~/.iris/projects/<id>/index.json` when present).
- Add `src/templates/pages/global-dashboard.ts` that renders
  `~/.iris/dashboard.html` — all registered projects, page counts, recent
  activity, and index status — using the same Electric templates as workspace
  pages (no CDN at view time, inlined Lucide, vendored Mermaid).
- Add `iris open --global` to open the global dashboard. Whether a dedicated
  `iris dashboard` verb is warranted is left as an open question.
- Make `iris render --all` refresh the global dashboard when more than one
  project is registered, so the global view stays current without a separate
  command.
- Treat `~/.iris/dashboard.html` as machine-local generated output: never
  committed, gitignored by definition (it lives in `~/.iris`, not the repo),
  regenerated from the registry on every refresh.

## Capabilities

### New Capabilities

- `global-project-dashboard`: a machine-local global dashboard at
  `~/.iris/dashboard.html` aggregating every registered project from
  `~/.iris/registry.json`, rendered with the same Electric templates as
  workspace pages, refreshable from any project's `iris render --all`.

### Modified Capabilities

- `user-global-state`: the `~/.iris` home gains a generated `dashboard.html`
  output and the registry becomes the source of truth for cross-project
  aggregation, not just project lookup.
- `project-lifecycle-automation`: `iris render --all` refreshes the global
  dashboard when more than one project is registered, making global
  aggregation part of the standard render lifecycle rather than a separate
  command.

## Impact

- Adds two new library/template modules (`src/lib/global-registry.ts`,
  `src/templates/pages/global-dashboard.ts`) and a thin `--global` flag on the
  existing `iris open` command.
- Reads `~/.iris/registry.json` (introduced by Phase 1) and an optional
  `~/.iris/projects/<id>/index.json` pointer (introduced by Phase 2's GitNexus
  indexing, when enabled). Phase 3 degrades gracefully when the index pointer
  is absent: the dashboard shows project metadata and page counts without an
  index-status row.
- Writes one generated file at `~/.iris/dashboard.html`. It is machine-local
  by construction — it lives outside every registered repo — so it is gitignored
  by definition and never appears in `git status` for any project.
- Reuses the existing Electric page shell, tokens, and component vocabulary;
  no new color literals, no new runtime dependencies, no CDN at view time.
- Preserves the offline contract: the global dashboard renders from packaged
  assets and the local registry with no network and no LLM in the CLI.
