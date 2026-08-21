## Why

Coding agents produce research, investigation, and hand-off output as Markdown, but Iris can only render JSON contracts with Markdown embedded in string fields — clumsy to write, escape, and review — so that output ends up as loose `.md` files with no index, navigation, or consistent rendering. OpenSpec already shows the right model: read Markdown files directly, render them deterministically, and organize them. Iris should do the same for agent research so the workspace, not a folder of Markdown, becomes the organized record.

## What Changes

- Add a `research` content type whose source is one Markdown file per item at `iris/research/<id>/index.md`, with optional front matter (`title`, `status`, `tags`, `agent`, `updated`) and a free Markdown body.
- Add `iris research <id>` to create a compact skeleton (front matter plus Question / Findings / Evidence / Next steps headings) that agents fill in directly in Markdown.
- Render each research item to `iris/research/<id>/page.html` with a document template: shared navigation shell, page header from front matter, generated table of contents, the existing safe Markdown renderer, Mermaid fences, callouts, print styles.
- Generate `iris/research.html`: a Research section page with a summary strip, filterable list, and tag signals; add a Research entry to the navigation shell.
- Include research records in the Work browser projection as type `research` (status from front matter, priority unavailable) so List/Table/Kanban, filter, and drawer cover them; extend archive, publish, and export to research pages.
- Update the canonical `iris-workspace` skill with the research workflow in a few lines so agents know to write Markdown, not JSON, for research responses.

## Capabilities

### New Capabilities

- `research-markdown-pages`: Markdown-sourced research pages — source contract, rendering, section page, navigation, work-browser inclusion, lifecycle, and agent guidance.

### Modified Capabilities

None. Navigation and work-browser inclusion are stated as requirements of the new capability; the shell itself comes from `dashboard-shell-redesign`, which this change depends on.

## Impact

- New `src/lib/front-matter.ts` (bounded parser) and `src/lib/research-workspace.ts` (discovery, bounds, projection); new `src/templates/pages/research.ts` and document template; `draft.ts` gains `research`; `render.ts`, `lifecycle.ts` (archive), `publish.ts`, `export.ts` resolve research paths; `project-state.ts` records the source root per entry (additive, version stays 2); `command-catalog.ts` and `templates/agents/iris-workspace.md` gain the command.
- `renderSafeMarkdown` gains an opt-in heading-id mode for the table of contents; OpenSpec rendering is unchanged.
- Tests for parser, draft, render, projection, archive, publish, hostile input, and the skill template; docs (`README`, `docs/cmds.md`, `docs/status.md`, `docs/tech.md`) and regenerated `iris/` output.
- No new dependency; reading stays inside `iris/research/`, sorted, bounded, symlink-refusing, and network-free. Depends on `dashboard-shell-redesign` for the shell and the Research nav entry.
