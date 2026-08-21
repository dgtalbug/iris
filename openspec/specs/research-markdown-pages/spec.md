# research-markdown-pages Specification

## Purpose
Let agents record research and investigation output as plain Markdown files that Iris reads directly and renders into organized, navigable, offline HTML pages with their own section, so research stops living as loose Markdown.

## Requirements

### Requirement: Markdown research source contract

The system MUST treat `iris/research/<id>/index.md` as the editable source of a research page, where `<id>` is lowercase kebab-case, the file MAY begin with front matter providing `title`, `status` (`draft`, `active`, `done`, `archived`), `tags` (list of strings), `agent`, and `updated` (ISO date), and the remainder is the Markdown body. Missing front matter values MUST fall back to the first level-one heading or the id for `title`, `draft` for `status`, and an explicit unavailable value for the rest; malformed front matter MUST produce a path-specific warning and defaults, never a failed render of other pages. Reading MUST stay inside `iris/research/`, MUST refuse symlinks, MUST bound file size, and MUST NOT execute or fetch anything referenced by the file.

#### Scenario: agent creates a research skeleton

- **WHEN** a user or agent runs `iris research <id>`
- **THEN** the system MUST create `iris/research/<id>/index.md` with front matter for the supported keys and Question, Findings, Evidence, and Next steps headings, and MUST refuse an id that already exists or is not kebab-case

#### Scenario: front matter is absent

- **WHEN** a research file has no front matter
- **THEN** the page MUST render with the first level-one heading or the id as its title, `draft` status, and unavailable tags, agent, and updated values

#### Scenario: front matter is malformed

- **WHEN** front matter cannot be parsed or contains an unsupported status value
- **THEN** the system MUST render the page with defaults, report a warning naming the file, and continue rendering every other page

#### Scenario: file exceeds bounds or is unsafe

- **WHEN** `index.md` is larger than the configured bound, is a symlink, or escapes the research root
- **THEN** the system MUST skip that item with a path-specific warning and MUST NOT read the target

### Requirement: research document rendering

Each research source MUST render to `iris/research/<id>/page.html` as a deterministic document page inside the shared navigation shell with a header showing title, type `research`, status, tags, agent, and updated, a generated table of contents when the body has two or more level-two or level-three headings, the body rendered by the safe Markdown renderer with embedded HTML, unsafe destinations, and active images disabled, Mermaid fences as source-first diagram hosts, and a print presentation.

#### Scenario: body contains headings and a Mermaid fence

- **WHEN** a research body has several level-two headings and an exact `mermaid` fence
- **THEN** the rendered page MUST contain a table of contents linking to each heading and a diagram host that renders after `iris vendor` while keeping escaped source as fallback

#### Scenario: body contains hostile content

- **WHEN** the body contains raw HTML, script, remote image, or `javascript:` link Markdown
- **THEN** the rendered page MUST show it as inert text or omit the active part and MUST NOT emit executable or network-loading markup

#### Scenario: page is published standalone

- **WHEN** `iris publish <id>` or `iris export <id> --single` targets a research page
- **THEN** the artifact MUST be self-contained, omit the navigation shell, and keep the document readable

### Requirement: research section page and navigation

The system MUST generate `iris/research.html` listing every research item with a summary strip (total and per-status counts), a filterable list showing title, id, status, tags, agent, and updated with unavailable values labelled, and MUST add a Research entry to the navigation shell on every generated page.

#### Scenario: repository has research items

- **WHEN** a user opens the Research section
- **THEN** it MUST list every rendered research item with a link to its page and honest metadata, and the shell MUST mark Research as current

#### Scenario: repository has no research items

- **WHEN** the Research section has no items
- **THEN** it MUST name `iris research <id>` and `iris render --all` as the commands that populate it

### Requirement: research records in the work browser and lifecycle

Research items MUST appear in the Work browser projection as type `research` with status from front matter, priority unavailable, a bounded description from the first paragraph, and a full-page link, so List, Table, Kanban, filter, and the detail drawer cover them; `iris archive <id>` MUST move a research item into the archive while keeping its page reachable, and the Overview summary MUST count research items.

#### Scenario: research item is filtered or opened from Work

- **WHEN** a user filters by a research tag or activates a research row
- **THEN** the matching research record MUST be shown with type `research` and its drawer MUST link to the research page

#### Scenario: research item is archived

- **WHEN** a user runs `iris archive <id>` for a research item
- **THEN** the source and page MUST move under `iris/archive/<id>/`, the registry MUST mark it archived, and the dashboard MUST keep a working link

### Requirement: agent guidance for research pages

The canonical `iris-workspace` skill MUST describe creating, writing, and rendering research pages as Markdown, naming the source path and the render command, so agents write Markdown rather than JSON for research responses.

#### Scenario: skill is installed

- **WHEN** `iris init` installs or refreshes the agent skill
- **THEN** every generated skill surface MUST include the research workflow alongside the existing content commands
