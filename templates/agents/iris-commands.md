# Iris generated command surfaces

Each `##` section below becomes one generated command file for every supported agent
host. The heading is `<command> — <description>`; the body is the instruction the
agent follows. Keep bodies short: create, fill, render, report the path.

## research — Capture an investigation or written-up answer as an Iris research page

Record research as a Markdown page in the Iris workspace.

1. Pick a lowercase kebab-case `<id>` from the question (for example `cache-stampede-causes`). If the user named one, use it.
2. Run `iris research <id>`.
3. Write the findings in `iris/research/<id>/index.md`: set `title`, `status`, and `tags` in the front matter, then fill the Question, Findings, Evidence, and Next steps headings with real content. Use fenced `mermaid` blocks for diagrams.
4. Run `iris render --all`.
5. Report the generated path `iris/research/<id>/page.html` and offer `iris open`.

## bug — Record a reproduced, diagnosed, or fixed bug as an Iris page

Record a bug in the Iris workspace.

1. Pick a lowercase kebab-case `<id>` describing the bug.
2. Run `iris bug <id>`.
3. Edit `iris/pages/<id>/data.json`: describe the symptom, set `severity` (`p0`–`p3`), and add real timeline events. Set `title`, `status`, and `agent`.
4. Run `iris render <id>`.
5. Report the generated path `iris/pages/<id>/page.html`.

## feature — Record a built or scoped feature as an Iris page

Record a feature in the Iris workspace.

1. Pick a lowercase kebab-case `<id>`.
2. Run `iris feature <id>`.
3. Edit `iris/pages/<id>/data.json`: fill `problem`, `goal`, and the `tasks` list with real tasks and their done state. Replace the placeholder diagrams in `sections.design.hld` (a `flowchart` of how the feature sits in the system) and `sections.design.lld` (a `sequenceDiagram` of how it works inside) with the real components; remove `design` only when there is nothing worth drawing.
4. If the feature changed the system's shape, update `iris/project/hld.md` and `iris/project/lld.md` too.
5. Run `iris render <id>`, or `iris render --all` when project docs changed.
6. Report the generated path `iris/pages/<id>/page.html`.

## idea — Record a proposal worth keeping as an Iris page

Record an idea in the Iris workspace.

1. Pick a lowercase kebab-case `<id>`.
2. Run `iris idea <id>`.
3. Edit `iris/pages/<id>/data.json`: fill `current_state`, `proposed`, and honest `effort`/`impact` values from 1 to 5.
4. Run `iris render <id>`.
5. Report the generated path `iris/pages/<id>/page.html`.

## plan — Record a milestone plan as an Iris page

Record a plan in the Iris workspace.

1. Pick a lowercase kebab-case `<id>`.
2. Run `iris plan <id>`.
3. Edit `iris/pages/<id>/data.json`: fill `goal` and ordered `steps`, each with an id, title, and optional detail.
4. Run `iris render <id>`.
5. Report the generated path `iris/pages/<id>/page.html`.

## report — Summarize a working session as an Iris page

Record a session report in the Iris workspace.

1. Pick a lowercase kebab-case `<id>`.
2. Run `iris report <id>`, or `iris report --from-session <path> <id>` when a local session export exists.
3. Edit `iris/pages/<id>/data.json`: fill `summary` bullets, `open_items`, and `promotable_as`.
4. Run `iris render <id>`.
5. Report the generated path `iris/pages/<id>/page.html`.
