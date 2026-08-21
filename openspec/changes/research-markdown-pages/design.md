## Context

See proposal.md. Iris renders five JSON contract types from `iris/pages/<id>/data.json` and visualizes OpenSpec Markdown read directly from `openspec/` through a bounded walker plus `renderSafeMarkdown` (markdown-it, embedded HTML off, Mermaid fences as source-first hosts). `agent-first-initialization` deliberately removed implicit ingestion of `README.md`/`docs/**/*.md`. This change depends on `dashboard-shell-redesign` for `renderShell()`, the nav model, and section pages.

## Goals / Non-Goals

**Goals:**

- Agents write one Markdown file per research item; no JSON escaping.
- Reuse the OpenSpec reading discipline (sorted, allowlisted, bounded, symlink-refusing) and the existing safe renderer.
- Research joins the same Work projection so one browser, filter, and drawer cover everything.
- Skill guidance stays a few lines; skeleton is small.

**Non-Goals:**

- Reading Markdown from outside `iris/research/` (for example `docs/agent-handoffs/*.md`). Explicit opt-in source globs in `config.yaml` are a possible later capability; implicit ingestion stays removed.
- Images or attachments next to `index.md`, Markdown-to-contract promotion, full-text search, or editing in the browser.
- A YAML dependency; the parser covers the documented subset only.

## Decisions

### Markdown file with front matter, not a sixth JSON contract

A `research` JSON type with `sections.body.md` would reuse every existing code path but forces agents to escape Markdown inside JSON strings and makes diffs unreadable. A plain file matches how agents already produce research and how OpenSpec artifacts are authored; the price is a small front-matter parser and a second source root, both bounded.

### Bounded hand-rolled front matter parser

`src/lib/front-matter.ts` accepts a leading `---` block and parses `key: scalar`, `key: [a, b]`, and `key:` followed by `- item` lines; quotes are stripped, unknown keys ignored, duplicate keys last-wins, anything else yields a warning. Values are validated (`status` enum, `updated` `YYYY-MM-DD` prefix, tag strings bounded to 80 chars, at most 20 tags). No YAML library: the subset is tiny and determinism matters more than YAML fidelity.

### Discovery mirrors the OpenSpec walker

`src/lib/research-workspace.ts` lists `iris/research/*/index.md` sorted, refuses symlinks and path escapes, caps file bytes (256 KB) and item count, and returns `{ id, frontMatter, body, warnings }`. Warnings surface on the Research page and in `--json` output, not as failures.

### Document template and table of contents

`renderSafeMarkdown` gains an options object with `headingIds: true`; when set, heading tokens get deterministic slug ids (lowercased, non-alphanumerics collapsed to `-`, numeric suffix on collision) and the renderer returns the heading list alongside HTML. OpenSpec rendering keeps the default (no ids) so multiple documents on the Spec page cannot collide. The research page shows a right-rail TOC (sticky on wide screens, inline above the body at narrow widths) when two or more h2/h3 headings exist.

### One projection, two source roots

`refreshDashboard` builds `DashboardPage[]` from `pages/` (contracts) and `research/` (Markdown), tagging research entries `type: 'research'`, `priority: 'not set'`, `description` = first paragraph bounded to 1200 chars, `evidence` = `"<n> headings · <m> words"`. Work List/Table/Kanban, filter, and drawer need no change; `typeClass` gains `tp-research`. The Overview and Work summary strips count research.

### Registry and lifecycle

`PageRegistryEntry` gains optional `source: 'pages' | 'research'` (default `pages`); state stays version 2. `archive` resolves the source root from the entry (falling back to whichever directory exists), moves the whole folder under `iris/archive/<id>/`, and re-renders. `publish`/`export` resolve `page.html` across `pages/`, `research/`, and `archive/`. Research pages carry the same `data-iris-nav` shell so the existing stripper works.

### Skill and catalog wording

`templates/agents/iris-workspace.md` adds one numbered item ("`iris research <id>` creates `iris/research/<id>/index.md`; write Markdown there, then `iris render --all`") and one sentence on front matter keys. `command-catalog.ts` adds `research` to the `content` group with status `implemented`.

## Risks / Trade-offs

- [Two source roots complicate id uniqueness] → `draft`/`research` refuse an id that exists in `pages/`, `research/`, or `archive/`; the render reports duplicates and keeps the first.
- [Front matter subset surprises users] → Warnings name the unsupported line; docs list the exact grammar.
- [Heading ids could leak into Spec rendering] → Opt-in option only; a test asserts OpenSpec output has no ids.
- [Large Markdown bloats work-item data attributes] → Description bounded before projection, as for contracts.
- [Shell dependency] → Implement after `dashboard-shell-redesign`; if it slips, render research pages with the shell function stubbed to the current header to stay unblocked, then switch.

## Migration Plan

1. Land parser and discovery with tests (no output change).
2. Add `iris research`, the document template, and the Research section page + nav entry; extend the projection.
3. Extend archive/publish/export and the registry; update the skill template and catalog.
4. Regenerate dogfood, run the release gate, update docs.

Rollback: remove the command and pages; existing `iris/research/` Markdown is left untouched as plain files.
