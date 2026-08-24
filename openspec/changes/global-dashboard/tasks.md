# Tasks — global-dashboard

This change is structured for parallel (swarm) execution. Workstreams A–C are
independent and own disjoint files; each lists the files it owns so two agents
never edit the same file. Workstream D (integration) depends on A–C and runs
last. Each workstream is self-contained and can be handed to its own agent
with its owned files plus the design doc.

> Convention: `[WS-x]` prefixes each workstream. Owned files are exclusive.
> Shared files (`src/cli.ts`, `src/commands/render.ts`, `src/commands/open.ts`)
> are edited only by the workstream listed as their owner; others coordinate
> through the design doc.

## WS-A. Global registry aggregation (foundation, no deps)

- [x] A.1 Add `src/lib/global-registry.ts`: read `~/.iris/registry.json` and,
      for each entry, read `~/.iris/projects/<id>/state.json` for page counts
      and recent activity, and `~/.iris/projects/<id>/index.json` (Phase 2
      pointer) for index status when present. Mark a project stale when its
      root directory no longer exists. **Owns:** `src/lib/global-registry.ts`,
      `tests/global-registry.test.ts`
- [x] A.2 Define the `GlobalDashboardModel` shape (project list with id, name,
      root, remote, lastSeen, page counts, recent activity, index status,
      staleness) consumed by the page template. **Owns:** `src/lib/global-registry.ts`
      (same module)

## WS-B. Global dashboard page template (owns its template)

- [x] B.1 Add `src/templates/pages/global-dashboard.ts` rendering the
      `GlobalDashboardModel` to a single self-contained HTML document using
      the existing Electric shell, tokens, and component vocabulary. Inlined
      Lucide SVG, vendored Mermaid, no CDN, no script tag at view time.
      **Owns:** `src/templates/pages/global-dashboard.ts`,
      `tests/global-dashboard.test.ts`
- [x] B.2 Reuse the existing page shell (`src/templates/shell.ts`) and common
      components (`statTile`, `escapeHtml`, `icon`) so the global dashboard
      shares the per-project dashboard's voice. No new color literals, no new
      token aliases. **Owns:** `src/templates/pages/global-dashboard.ts` (same
      module)

## WS-C. Open command --global flag (owns the open command)

- [x] C.1 Add `--global` to `iris open` in `src/commands/open.ts` and
      `src/cli.ts`: when set, open `~/.iris/dashboard.html` instead of the
      per-project `iris/index.html`. Exit 1 when the global dashboard has not
      been generated yet (run `iris render --all` first). **Owns:**
      `src/commands/open.ts`, `src/cli.ts` (open command surface only)

## WS-D. Integration: render --all refreshes the global dashboard (runs LAST; depends on A–C)

- [x] D.1 Wire the opportunistic global dashboard refresh into the final step
      of `iris render --all` in `src/commands/render.ts`: after the per-project
      render completes, if `~/.iris/registry.json` lists more than one project,
      regenerate `~/.iris/dashboard.html` from the aggregated model. The refresh
      is best-effort: a failure to write the global dashboard MUST NOT fail the
      render. **Owns:** `src/commands/render.ts`
- [x] D.2 Wire the global registry module into the render path so the
      aggregation reads `~/.iris/registry.json` and per-project state without
      walking page trees. **Owns:** `src/commands/render.ts` (same module)

## WS-E. Verification (depends on D)

- [x] E.1 Offline smoke: on a multi-project machine, `iris render --all`
      produces `~/.iris/dashboard.html` listing every registered project;
      `iris open --global` opens it; a single-project machine skips the refresh;
      a missing `~/.iris/projects/<id>/index.json` degrades gracefully (no
      index-status row, no error). **Owns:** `tests/global-dashboard.test.ts`
      (smoke additions), `tests/global-registry.test.ts` (smoke additions)
- [x] E.2 Run the full release gate and strict OpenSpec validation.

---

### Parallelization notes

- **Wave 1 (parallel):** WS-A, WS-B, WS-C — disjoint files (registry module,
  page template, open command).
- **Wave 2 (sequential):** WS-D integrates A–C (touches the shared `render.ts`
  seam).
- **Wave 3:** WS-E verification.
- `src/cli.ts` is co-owned by WS-C (open `--global` flag); the Wave-2
  integrator does not touch it. If a later workstream needs a CLI edit, it
  coordinates through the design doc rather than editing `src/cli.ts` directly.
