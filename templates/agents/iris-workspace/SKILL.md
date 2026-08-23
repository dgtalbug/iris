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

## When not to use this

- The answer fits in a chat paragraph: a quick explanation, a one-off command, a pointer to a file. Chat answers that fit in paragraphs stay in chat — a page nobody revisits is noise.
- The work is still in flight. Draft the page when the investigation, fix, or plan has actually landed; a page of guesses renders as fact.
- The user asked about the code and nothing more. Answer first; record only what is worth keeping.

## The craft loop

1. **Investigate the real code first.** Open the files you will write about. Never draft a finding, flow, or diagram from memory or from a guess about naming.
2. **Cite what you opened.** Every finding carries an `::: evidence` citation at a `file:line` you actually read. No citation, no finding.
3. **Mark your confidence.** Every TL;DR bullet and every finding carries a confidence badge: `**[HIGH]**` verified against the code, `**[MED]**` inferred from partial reading, `**[LOW]**` suspected. Never present a guess as a fact.
4. **Draft into the blueprint.** Research pages scaffold the ten sections; fill them in order, omitting only what is truly empty. `references/blueprint.md` holds the sections and per-type emphasis; `references/components.md` the component syntax.
5. **Render and verify.** Run `iris render --all`, then walk the verification checklist below.
6. **Report the page path.** Tell the user exactly which generated page to open and offer `iris open`.

## Type map

| Page type | Iris verb            | Doc-type emphasis                                  |
| --------- | -------------------- | -------------------------------------------------- |
| bug       | `iris bug <id>`      | Findings plus the failing path, in the danger tone |
| feature   | `iris feature <id>`  | Proposal options as tabs, with the design diagrams |
| plan      | `iris plan <id>`     | Timeline phases, ordered and dated                 |
| research  | `iris research <id>` | Findings-first; the question and scope bound them  |
| report    | `iris report <id>`   | TL;DR bullets plus the numbers                     |

Use lowercase kebab-case ids. Always: create → fill the source file → `iris render --all` → tell the user the page path.

## Project docs are Markdown

`iris init` scaffolds `iris/project/{overview,hld,lld,erd,decisions}.md` with front matter and placeholder diagram skeletons (HLD `flowchart`, LLD `sequenceDiagram`, ERD `erDiagram`). Right after init, and whenever a feature changes the system's shape, replace the placeholder nodes with the real components from the codebase and run `iris render --all`; the HLD diagram is projected onto the Overview.

## Research pages are Markdown

`iris research <id>` writes `iris/research/<id>/index.md`. Write plain Markdown there — headings, lists, tables, fenced code, and exact `mermaid` fences all render, and the Electric containers compile to the design system's own classes. Optional front matter: `title`, `status` (`draft`, `active`, `done`, `archived`), `tags: [a, b]`, `agent`, `updated`. Missing values fall back to the first `#` heading, `draft`, and explicit `not set` labels — never invented.

## Contract pages are JSON

The other content commands write a typed contract at `iris/pages/<id>/data.json`. Edit that file; it is validated against a schema on render. A feature's optional `sections.design.hld` and `design.lld` hold Markdown with diagrams and render as tabs. Treat `page.html`, `iris/index.html`, the section pages, `iris/spec.json`, and everything under `iris/design/` as CLI-owned output and never hand-edit them.

## The color law for diagrams

Every diagram in the workspace obeys one semantic mapping, and it is law — never invent a new hue and never let color carry a meaning this table does not assign:

| Color  | Meaning                                    |
| ------ | ------------------------------------------ |
| violet | the focus — the thing being described      |
| cyan   | a service, API, function, internal compute |
| amber  | a data store, cache, persisted state       |
| lime   | an async path — queue, event, stream       |
| pink   | an external system, user, vendor           |
| red    | an error path or failure mode              |

Paste this `classDef` block into every flowchart (it ships in `iris/project/hld.md`); these hexes are the only permitted color literals — diagram sources cannot read design tokens:

```
classDef focus stroke:#8b5cf6,stroke-width:2.5px,fill:transparent,color:#8b5cf6;
classDef svc   stroke:#22d3ee,fill:transparent,color:#22d3ee;
classDef db    stroke:#fbbf24,fill:transparent,color:#fbbf24;
classDef q     stroke:#a3e635,fill:transparent,color:#a3e635;
classDef ext   stroke:#f472b6,fill:transparent,color:#f472b6;
classDef err   stroke:#f87171,fill:transparent,color:#f87171,stroke-dasharray:4;
```

## Setup and the rest of the surface

- `iris init` creates or safely upgrades the workspace, installs these agent surfaces, and renders every page. It never copies or monitors `README.md` or `docs/**/*.md`.
- `iris vendor` installs the pinned diagram runtime locally so diagrams render offline.
- `iris archive <id>` moves a page into history; `iris publish [<id>]` and `iris export <id> --single` write portable standalone HTML.
- With a `specs/` directory, the Spec page shows canonical specs, active changes, archives, and real task checkboxes, each change as Proposal / Design / Tasks / Specs tabs. `iris init` and `iris render --all` refresh that snapshot.
- The Commands page (`iris/commands.html`) lists every command with its real status.

Preserve user-owned configuration, pages, archives, and unrelated agent or editor files.

## Verification checklist

Before you report a page, verify every line:

- [ ] Every TOC link on the rendered page resolves to a section that exists.
- [ ] Every footnote marker resolves to a footnote definition, and each definition names a real source.
- [ ] Every diagram is valid — it rendered, and its colors follow the color law.
- [ ] No stray color literals anywhere in the source; the `classDef` hexes above are the only permitted ones.
- [ ] The page was actually opened or read back after render — never report a page you have not seen.
- [ ] Run the iris-guard self-check before render: the draft names no external tool, framework, or design system — see the `iris-guard` skill.
