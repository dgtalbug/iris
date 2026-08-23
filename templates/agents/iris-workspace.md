# Iris workspace

Iris turns finished agent work into local, versioned HTML that opens straight from `file://`. No server, no network, no build step.

## When to use this

Reach for Iris the moment a piece of work is _done_ — not while exploring. If the answer would otherwise stay in the chat log or a loose Markdown file, it belongs in the workspace.

| The user says / you just finished          | Run                  | Lands in                         |
| ------------------------------------------ | -------------------- | -------------------------------- |
| initialized Iris in a repository           | `iris init`          | `iris/project/hld.md` + `lld.md` |
| investigated something, wrote up an answer | `iris research <id>` | `iris/research/<id>/index.md`    |
| reproduced, diagnosed, or fixed a bug      | `iris bug <id>`      | `iris/pages/<id>/data.json`      |
| built or scoped a feature                  | `iris feature <id>`  | `iris/pages/<id>/data.json`      |
| proposed something worth keeping           | `iris idea <id>`     | `iris/pages/<id>/data.json`      |
| planned a milestone or a sequence          | `iris plan <id>`     | `iris/pages/<id>/data.json`      |
| wrapped a working session                  | `iris report <id>`   | `iris/pages/<id>/data.json`      |
| wants the workspace refreshed              | `iris render --all`  | every generated page             |
| wants to look at it                        | `iris open`          | the browser                      |

Always: create → fill the source file → `iris render --all` → tell the user the page path. Use lowercase kebab-case ids.

## Project docs are Markdown

`iris init` scaffolds `iris/project/{overview,hld,lld,erd,decisions}.md` with front matter and placeholder Mermaid skeletons (HLD `flowchart`, LLD `sequenceDiagram`, ERD `erDiagram`). Right after init, and whenever a feature changes the system's shape, replace the placeholder nodes with the real components from the codebase and run `iris render --all`; the HLD diagram is projected onto the Overview. The `classDef` lines in `hld.md` carry the workspace's colour meanings (violet focus, cyan service, amber store, lime async, pink external, red error) — copy them into any flowchart.

## Research pages are Markdown

`iris research <id>` writes `iris/research/<id>/index.md`. Write plain Markdown there — headings, lists, tables, fenced code, and exact `mermaid` fences all render. Optional front matter: `title`, `status` (`draft`, `active`, `done`, `archived`), `tags: [a, b]`, `agent`, `updated`. Missing values fall back to the first `#` heading, `draft`, and explicit `not set` labels — never invented.

## Contract pages are JSON

The other content commands write a typed contract at `iris/pages/<id>/data.json`. Edit that file; it is validated against a schema on render. A feature's optional `sections.design.hld` and `design.lld` hold Markdown with Mermaid diagrams and render as tabs. Treat `page.html`, `iris/index.html`, the section pages, `iris/spec.json`, and everything under `iris/design/` as CLI-owned output and never hand-edit them.

## Setup and the rest of the surface

- `iris init` creates or safely upgrades the workspace, installs these agent surfaces, and renders every page. It never copies or monitors `README.md` or `docs/**/*.md`.
- `iris vendor` installs the pinned Mermaid runtime locally so diagrams render offline.
- `iris archive <id>` moves a page into history; `iris publish [<id>]` and `iris export <id> --single` write portable standalone HTML.
- With an `openspec/` directory, the Spec page shows canonical specs, active changes, archives, and real task checkboxes, each change as Proposal / Design / Tasks / Specs tabs. `iris init` and `iris render --all` refresh that snapshot.
- The Commands page (`iris/commands.html`) lists every command with its real status.

Preserve user-owned configuration, pages, archives, and unrelated agent or editor files.
