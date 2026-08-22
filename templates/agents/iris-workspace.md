# Iris workspace

Iris turns finished agent work into local, versioned HTML that opens straight from `file://`. No server, no network, no build step.

## When to use this

Reach for Iris the moment a piece of work is _done_ — not while exploring. If the answer would otherwise stay in the chat log or a loose Markdown file, it belongs in the workspace.

| The user says / you just finished          | Run                  | Lands in                      |
| ------------------------------------------ | -------------------- | ----------------------------- |
| investigated something, wrote up an answer | `iris research <id>` | `iris/research/<id>/index.md` |
| reproduced, diagnosed, or fixed a bug      | `iris bug <id>`      | `iris/pages/<id>/data.json`   |
| built or scoped a feature                  | `iris feature <id>`  | `iris/pages/<id>/data.json`   |
| proposed something worth keeping           | `iris idea <id>`     | `iris/pages/<id>/data.json`   |
| planned a milestone or a sequence          | `iris plan <id>`     | `iris/pages/<id>/data.json`   |
| wrapped a working session                  | `iris report <id>`   | `iris/pages/<id>/data.json`   |
| wants the workspace refreshed              | `iris render --all`  | every generated page          |
| wants to look at it                        | `iris open`          | the browser                   |

Always: create → fill the source file → `iris render --all` → tell the user the page path. Use lowercase kebab-case ids.

## Research pages are Markdown

`iris research <id>` writes `iris/research/<id>/index.md`. Write plain Markdown there — headings, lists, tables, fenced code, and exact `mermaid` fences all render. Optional front matter:

```markdown
---
title: Why the cache stampedes
status: active
tags: [cache, performance]
agent: claude-code
updated: 2026-08-21
---
```

Diagrams in a `mermaid` fence pick up the workspace theme automatically. For flowcharts, paste these class definitions and apply them so nodes carry the workspace's meanings — violet is the thing being described, cyan a service, amber a data store, lime an async path, pink an external system, red an error path:

```
classDef focus stroke:#8b5cf6,stroke-width:2.5px,fill:transparent,color:#8b5cf6;
classDef svc   stroke:#22d3ee,fill:transparent,color:#22d3ee;
classDef db    stroke:#fbbf24,fill:transparent,color:#fbbf24;
classDef q     stroke:#a3e635,fill:transparent,color:#a3e635;
classDef ext   stroke:#f472b6,fill:transparent,color:#f472b6;
classDef err   stroke:#f87171,fill:transparent,color:#f87171,stroke-dasharray:4;
```

Supported `status` values are `draft`, `active`, `done`, `archived`. Missing values fall back to the first `#` heading, `draft`, and explicit `not set` labels — never invented.

## Contract pages are JSON

The other content commands write a typed contract at `iris/pages/<id>/data.json`. Edit that file; it is validated against a schema on render. Treat `page.html`, `iris/index.html`, the section pages, `iris/spec.json`, and everything under `iris/design/` as CLI-owned output and never hand-edit them.

## Setup and the rest of the surface

- `iris init` creates or safely upgrades the workspace, installs these agent surfaces, and renders every page. Run it once after installing or upgrading the CLI. It never copies or monitors `README.md` or `docs/**/*.md`.
- `iris vendor` installs the pinned Mermaid runtime locally so diagrams render offline.
- `iris archive <id>` moves a page into history; `iris publish [<id>]` and `iris export <id> --single` write portable standalone HTML.
- If the repository has an `openspec/` directory, the Spec page visualizes canonical specs, active changes, archives, and real task checkboxes. `iris init` and `iris render --all` refresh that snapshot; nothing watches files in the background.
- The Commands page (`iris/commands.html`) lists every command with its real status.

Preserve user-owned configuration, pages, archives, and unrelated agent or editor files.
