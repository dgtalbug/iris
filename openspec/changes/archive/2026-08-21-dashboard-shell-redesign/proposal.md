## Why

The dashboard packs every surface (briefing, health strip, architecture, Work browser, Spec browser, project docs) into one tabbed `index.html` that is already 5,800 lines with zero pages; as OpenSpec, command, and research content grows it becomes slow to scan, expensive for agents to read, and impossible to deep-link by section. Users want Jira/Trello-style organization: a persistent navigation shell, one page per section with its own summary strip, and a cleaner product palette.

## What Changes

- Replace the single tabbed dashboard with a multi-page workspace: `iris/index.html` (Overview), `iris/work.html` (Work), `iris/spec.html` (Spec), `iris/commands.html` (Commands), plus the existing contract pages and project docs, all sharing one generated navigation shell (collapsible sidebar + top bar).
- Introduce Aperture 3 "Electra" tokens: cooler neutral surfaces, an electric indigo interactive accent, a white sidebar in the light theme, and light as a first-class peer of dark. The type, status, and priority spectrum is retained; a `research` type color is reserved for the follow-up research capability.
- Add a generated Commands page driven by one command catalog (purpose groups, synopsis, usage, explicit status: implemented / partial / stubbed). `iris --help` is generated from the same catalog.
- Every section page opens with its own summary strip. Overview shows cross-section summaries (briefing, counts, recent work, active spec movement, quick-start commands) and links out instead of embedding each section's full content.
- Navigation shell: sidebar collapses to a rail (control + `b` key, persisted locally), top bar carries breadcrumb, filter when relevant, and theme toggle; at narrow widths the sections sit behind a menu control. The shell is stripped from published and exported artifacts.
- **BREAKING** (generated output only): Work and Spec leave `index.html` for their own pages, and the managed `iris/project/commands.html` placeholder is retired in favor of `iris/commands.html`. Contracts, `state.json`, schemas, and CLI commands are unchanged; every page stays reachable from the dashboard and links back to it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `aperture-design-system`: token contract gains navigation-shell tokens and the Electra palette; component language gains the navigation shell, page header, summary strip, progress bar, and command card; the dashboard hierarchy becomes a multi-page workspace with an Overview page; deterministic interaction gains sidebar collapse, the `b` shortcut, cross-page theme persistence, and a narrow-width menu; new requirements cover the navigation shell, the generated command reference, and per-section summary strips.

## Impact

- `src/templates/design.ts` is split into tokens, shell, component CSS, classic script, and per-page generators; `src/commands/render.ts` writes the additional section pages; `src/commands/lifecycle.ts` retires the commands placeholder safely; `src/cli.ts` derives help from a new `src/lib/command-catalog.ts`.
- `publish`/`export` strip the shell; `html-check` covers the new cross-page links; `token-lint`/`token-contract` validate the new token pairs.
- Tests touching `index.html` structure (`html-navigation`, `work-board`, `openspec-browser`, `cli-help`, `publish-export`, `token-contract`) are updated; shell, overview, and commands-page tests are added.
- Docs (`README`, `docs/cmds.md`, `docs/design-system.md`, `docs/status.md`, the canonical skill template's dashboard mention) and the checked-in `iris/` dogfood output are regenerated. No new runtime dependency, framework, network request, or server.
- Sequencing: `redesign-work-board` modifies the same Aperture requirements and must be archived before this change so the delta applies on top of it.
