# iris commands and skills

> If a command is not listed here, it does not exist.

## Common

- Exit codes: `0` ok · `1` validation/user error · `2` environment error.
- Machine mode: all commands support `--json` (planned for full output parity in later milestones).
- Agent surfaces: CLI `iris` plus the generated `iris-workspace` skill under `.agents/skills`, `.claude/skills`, and `.github/skills`.
- Navigation contract: every generated page carries the same workspace shell — a sidebar listing Overview, Work, Spec, Research, Commands, and the project docs, plus a breadcrumb top bar. Contributors can verify all generated references with `pnpm html-check` (also enforced in CI).
- Workspace contract: one page per section. `iris/index.html` is the Overview (briefing hero, section summary tiles, recent work, spec movement with task progress, architecture pane, project-docs strip) and links out rather than embedding each section. `iris/work.html` holds the dense List/Table/Kanban browser and the detail drawer, `iris/spec.html` the OpenSpec index plus a generated `iris/spec/data.js` bundle holding each record's detail, `iris/research.html` the Markdown research index, and `iris/commands.html` the generated command reference. `/` focuses the visible filter, `t` toggles theme, `b` collapses the sidebar, arrow keys move work items, and arrow/Home/End keys operate the layout tablist; all remain classic-script, `file://`-safe interactions. Theme and sidebar state persist per browser through local storage; the initial theme comes from `iris/config.yaml`.

## `iris init`

- Synopsis: create or safely upgrade the complete local Iris workspace and agent setup.
- Flags: `--json`.
- Inputs: current project directory.
- Outputs: scaffolded or refreshed `iris/` tree, styled project placeholders, the managed `.vscode/tasks.json` entry, three generated agent skills, generated `/iris:*` command surfaces for Claude and Copilot, a deterministic `iris/spec.json` OpenSpec snapshot, and every rendered section page.
- Exit codes: 0/1/2.
- Example: `iris init`.
- Surfaces: CLI + all generated skills.
- Preservation: existing configuration, user pages, archives, unrelated editor tasks, sibling skills, unmarked files, and edited managed skill content are retained. A skill collision is reported as an incomplete setup instead of being overwritten.
- Migration: legacy active document mirrors are removed only when state provenance, safe source path, page identity, generated tag, and stored/current data hashes all prove that the record is an unmodified Iris output. Ambiguous and archived records are preserved.
- Boundary: initialization does not copy, hash, monitor, or create page records from `README.md` or `docs/**/*.md`.
- Spec snapshot: if `openspec/` exists, initialization directly reads supported canonical, active, structured archive, and legacy archive layouts. Markdown becomes semantic HTML during generation with embedded HTML, unsafe destinations, and active images disabled; exact Mermaid fences get source-first diagram hosts, exact escaped document source remains available, and YAML remains literal. OpenSpec CLI availability is irrelevant; unsafe or malformed inputs become path-specific warnings rather than executable content.

## `iris render [<id>|--all]`

- Synopsis: render contract and research sources to page HTML and refresh every section page; full renders also refresh the OpenSpec filesystem snapshot.
- Flags: `--all`, `--json`.
- Inputs: `iris/pages/<id>/data.json`, `iris/research/<id>/index.md`, or all sources.
- Outputs: `page.html` artifacts and updated `iris/index.html`, `work.html`, `spec.html`, `research.html`, and `commands.html`; bare `iris render` and `--all` also atomically replace `iris/spec.json`, while `iris render <id>` reuses the prior snapshot.
- Exit codes: 0/1/2.
- Example: `iris render --all`.
- Surfaces: CLI + all generated skills.

## `iris research <id>`

- Synopsis: create a Markdown research page for an investigation or a written-up answer.
- Flags: `--json`.
- Inputs: a lowercase kebab-case page id that is not already used under `iris/pages`, `iris/research`, or `iris/archive`.
- Outputs: `iris/research/<id>/index.md` containing front matter and Question, Findings, Evidence, and Next steps headings.
- Exit codes: 0/1/2.
- Example: `iris research cache-stampede-causes`.
- Surfaces: CLI + the generated `iris-workspace` skill + the generated `/iris:research` command.

### Research source contract

The editable source is `iris/research/<id>/index.md`. Optional front matter supports `title`, `status` (`draft`, `active`, `done`, `archived`), `tags` (inline `[a, b]` or a block list), `agent`, and `updated` (ISO date). Missing values fall back to the first level-one heading or the id for the title, `draft` for status, and explicit `not set` labels elsewhere — never invented. Unsupported keys are ignored and malformed lines produce a path-specific warning shown on the Research page while the body still renders.

Rendering is bounded and local: Iris reads only `iris/research/*/index.md`, sorted, refusing symlinks and path escapes, capping file size at 256 KB and directory count at 500. The body renders through the same safe Markdown pipeline as OpenSpec artifacts — embedded HTML, unsafe destinations, and active images disabled — plus generated heading ids and a table of contents when the body has two or more level-two or level-three headings. Exact `mermaid` fences become source-first diagram hosts.

Research records join the Work browser as type `research` with status from front matter and priority reported as unavailable, and `iris archive`, `iris publish`, and `iris export --single` all accept a research id.

## `iris report|feature|bug|idea|plan <id>`

- Synopsis: create type-specific draft contract skeleton.
- Flags: `--json`.
- Inputs: page id.
- Outputs: `iris/pages/<id>/data.json` skeleton.
- Exit codes: 0/1/2.
- Example: `iris bug bug-cache-stampede`.
- Surfaces: CLI + the generated `iris-workspace` skill.

## `iris report --from-session <path> [<id>]`

- Synopsis: turn local agent session data into a report contract, render it, and keep the output in the page registry.
- Flags: `--from-session`, `--json`.
- Inputs: a JSON object/array export, a non-empty Markdown/TXT dump, or a directory containing named session artifacts. Directory discovery reads files whose names identify metadata, sessions, conversations, turns/messages, checkpoints, tool/file activity, events, references, summaries, notes, or reports; unrelated files are ignored.
- Outputs: `iris/pages/<id>/data.json` plus rendered HTML for the report page.
- Exit codes: 0/1/2.
- Example: `iris report --from-session ./agent-session session-review`.
- Surfaces: CLI + local session ingestion workflows.

### Session import contract

The adapter is local-only and performs no network requests. It recognizes common camelCase and snake_case fields for workstream/title, branch, repository, status, timestamps, changed files, references, checkpoints, turns/messages, and tool activity. Missing optional metadata is represented as `null`, `unknown`, or an empty list rather than guessed.

The normal report fields remain available in `sections.summary`, `sections.open_items`, and `sections.promotable_as`. Traceable source data is also preserved under `sections.session_evidence`:

```json
{
  "source": "agent-session",
  "input_shape": "directory",
  "workstream": "Session ingestion",
  "status": "completed",
  "repo": "dgtalbug/iris",
  "branch": "feat/session-report",
  "timestamps": ["2026-08-18T08:00:00.000Z"],
  "files_touched": ["src/commands/report.ts"],
  "references": ["https://github.com/dgtalbug/iris/pull/42"],
  "checkpoints": ["Parser verified"],
  "tool_activity": ["pnpm test"]
}
```

Empty files, malformed JSON, unsupported extensions, missing sources, directories without recognized session artifacts, and sources with no reportable evidence fail with an actionable exit-code-1 validation error.

## `iris publish [<id>] [--output path]`

- Synopsis: generate a portable standalone HTML artifact from a rendered page for offline sharing.
- Flags: `--output`, `--json`.
- Inputs: page id. If omitted, the first available page is published.
- Outputs: a single-file static HTML artifact at `iris/archive/<id>-publish.html` or the exact requested path. Missing parent directories are created.
- Exit codes: 0/1/2.
- Example: `iris publish bug-cache-stampede --output dist/published.html`.
- Surfaces: CLI + local publish/export flows.

Published HTML includes the page CSS and has no local-file or network asset dependency. Interactive features that require the project script, navigation links that point into the `iris/` tree, and the Mermaid runtime are intentionally omitted from this static handoff artifact. Mermaid fences remain readable as escaped source; SVG snapshots are not claimed.

## `iris promote <report-id> <feature|bug|idea>`

- Synopsis: remap report sections into promoted page and link both.
- Flags: `--json`.
- Inputs: report id + target type.
- Outputs: new promoted page folder.
- Exit codes: 0/1/2.
- Example: `iris promote report-cache feature`.
- Surfaces: CLI + skills.
- Status: not yet implemented; the CLI exits 1 with a clear message until a later milestone lands.

## `iris archive <id>`

- Synopsis: move page to archive and update feed/index.
- Flags: `--json`.
- Inputs: page id from `iris/pages` or `iris/research`.
- Outputs: archived page directory under `iris/archive/<id>/` + state update.
- Exit codes: 0/1/2.
- Example: `iris archive bug-cache-stampede`.
- Surfaces: CLI + skills.

## `iris export <id> --single|--png|--pdf`

- Synopsis: export standalone HTML or rendered image/PDF.
- Flags: `--single` (default), `--png`, `--pdf`, `--output`, `--json`.
- Inputs: page id.
- Outputs: `--single` writes `iris/archive/<id>.html`; an explicit `--output` path overrides that location and missing parent directories are created.
- Exit codes: 0/1/2.
- Example: `iris export bug-cache-stampede --single`.
- Surfaces: CLI + skills.

Current limitation: the standalone HTML exporter is implemented, but PNG and PDF remain unavailable until the project approves and integrates a browser renderer. Requests for either mode fail explicitly; they never emit mislabeled HTML. The bundled CSS uses system font stacks, so no remote font files are required.

Renderer decision (2026-08-21): `puppeteer-core` is the preferred future candidate because it can use an explicit system Chrome without downloading a browser. Implementation remains deferred because Puppeteer does not guarantee compatibility with arbitrary system Chrome, so the current deterministic-output contract cannot yet be claimed across machines or browser upgrades. Playwright was not selected: its supported pinned-browser path requires a separate browser install and a cache measured in hundreds of megabytes. Task 2.2 remains open; the existing error path is intentional.

## `iris vendor`

- Synopsis: install or refresh the pinned Mermaid browser runtime for offline diagram previews.
- Flags: `--json`.
- Inputs: an initialized Iris workspace and Mermaid 11.17.0 from the installed Iris production dependencies; no network request is made.
- Outputs: `iris/design/vendor/mermaid.min.js` and `iris/design/vendor/LICENSE.mermaid.txt`, written atomically.
- Exit codes: 0/1/2.
- Example: `iris vendor`.
- Surfaces: CLI + skills.
- Behavior: idempotently refreshes the exact pinned bytes. Running before `iris init`, or from an incomplete package installation, fails with an actionable error rather than creating a partial workspace.

Exact `mermaid` fences in contract Markdown and OpenSpec Markdown are rendered one at a time from `file://` using this local classic script. Strict security disables active HTML and clicks; configured text/edge bounds and per-diagram error handling keep invalid graphs isolated. Before vendoring, without JavaScript, during print, or in a standalone artifact, the escaped source fallback remains readable.

## `iris open`

- Synopsis: open `iris/index.html` in the default browser via the platform opener (`open`, `start`, or `xdg-open`).
- Flags: `--json`.
- Inputs: local dashboard path.
- Outputs: browser launch; prints the opened path.
- Exit codes: 0 opened · 1 when `iris/index.html` is missing (run `iris init` first) · 2 when the opener cannot launch.
- Example: `iris open`.
- Surfaces: CLI + editor task.

## `iris update`

- Synopsis: refresh managed workspace assets and agent skills while preserving user-owned content.
- Flags: `--json`.
- Inputs: existing project configuration.
- Outputs: refreshed design/project surfaces, editor task, section pages, and intact managed agent skill and command regions.
- Exit codes: 0/1/2.
- Example: `iris update`.
- Surfaces: CLI.
- Managed boundary: design assets and the `iris: open dashboard` task are refreshed; unrelated `.vscode/tasks.json` entries are preserved. Agent skill and command regions update only when their ownership markers and digest remain valid. The retired `iris/project/commands.html` placeholder is removed only when it still carries the managed marker; a user-owned copy is preserved and reported.
- Setup guidance: use `iris init` for first run and upgrades. `iris update` remains a compatible explicit refresh, not a required setup step.

## Generated agent surfaces

`iris init` and `iris update` generate every agent-facing instruction from two packaged templates:

| Surface                                   | Source                               | Purpose                                                                                    |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `.agents/skills/iris-workspace/SKILL.md`  | `templates/agents/iris-workspace.md` | Codex and generic agents                                                                   |
| `.claude/skills/iris-workspace/SKILL.md`  | `templates/agents/iris-workspace.md` | Claude Code                                                                                |
| `.github/skills/iris-workspace/SKILL.md`  | `templates/agents/iris-workspace.md` | GitHub Copilot                                                                             |
| `.claude/commands/iris/<action>.md`       | `templates/agents/iris-commands.md`  | `/iris:research`, `/iris:bug`, `/iris:feature`, `/iris:idea`, `/iris:plan`, `/iris:report` |
| `.github/prompts/iris-<action>.prompt.md` | `templates/agents/iris-commands.md`  | The same actions as Copilot prompts                                                        |

The skill states when to reach for Iris in conversational terms and maps each intent to its command and generated destination, so finished work lands in the workspace without the user asking. Every generated file carries ownership, version, and a SHA-256 body digest between `IRIS:MANAGED` markers: an intact region is refreshed atomically while bytes outside it are preserved, and anything unmarked, half-marked, edited, symlinked, or escaping the repository is preserved and reported as a collision.
