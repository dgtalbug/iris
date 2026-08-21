# iris commands and skills

> If a command is not listed here, it does not exist.

## Common

- Exit codes: `0` ok · `1` validation/user error · `2` environment error.
- Machine mode: all commands support `--json` (planned for full output parity in later milestones).
- Agent surfaces: CLI `iris`, Claude `/iris *`, Copilot prompts, Codex `$iris-*` (generated in later milestones).
- Navigation contract: the dashboard links every rendered, archived, and project page; every page links back to the dashboard. Contributors can verify all generated references with `pnpm html-check` (also enforced in CI).

## `iris init`

- Synopsis: scaffold `iris/`, detect OpenSpec and GitNexus, create dashboard and editor task.
- Flags: `--json`.
- Inputs: current project directory.
- Outputs: scaffolded `iris/` tree, styled placeholder project pages, `.vscode/tasks.json`, quickstart lines.
- Exit codes: 0/1/2.
- Example: `iris init`.
- Surfaces: CLI + all generated skills.

## `iris render [<id>|--all]`

- Synopsis: render contract data to page HTML and refresh dashboard/feed.
- Flags: `--all`, `--json`.
- Inputs: `iris/pages/<id>/data.json` or all pages.
- Outputs: `page.html` artifacts and updated `iris/index.html`; each page is linked from the dashboard and links back to it.
- Exit codes: 0/1/2.
- Example: `iris render --all`.
- Surfaces: CLI + all generated skills.

## `iris report|feature|bug|idea|plan <id>`

- Synopsis: create type-specific draft contract skeleton.
- Flags: `--json`.
- Inputs: page id.
- Outputs: `iris/pages/<id>/data.json` skeleton.
- Exit codes: 0/1/2.
- Example: `iris bug bug-cache-stampede`.
- Surfaces: CLI + `/iris bug` style skills.

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

Published HTML includes the page CSS and has no local-file or network asset dependency. Interactive features that require the project script, and navigation links that point into the `iris/` tree, are intentionally omitted from this static handoff artifact.

## `iris promote <report-id> <feature|bug|idea>`

- Synopsis: remap report sections into promoted page and link both.
- Flags: `--json`.
- Inputs: report id + target type.
- Outputs: new promoted page folder.
- Exit codes: 0/1/2.
- Example: `iris promote report-cache feature`.
- Surfaces: CLI + skills.
- Status: not yet implemented; the CLI exits 1 with a clear message until a later milestone lands.

## `iris sync`

- Synopsis: incremental changelog, hotspots, stale marks, selective re-render.
- Flags: `--json`.
- Inputs: local page contracts, adopted source paths, and the hashes stored in `iris/state.json`.
- Outputs: state updates + feed/delta artifacts.
- Exit codes: 0/1/2.
- Example: `iris sync`.
- Surfaces: CLI + hooks.
- State transitions: `refreshed` for changed page data or missing output, `stale` for changed/removed adopted sources, and `unchanged` when no work is needed.

## `iris adopt`

- Synopsis: mirror README/docs markdown as read-only styled pages.
- Flags: `--json`.
- Inputs: repo docs markdown.
- Outputs: mirror pages + dashboard listing.
- Exit codes: 0/1/2.
- Example: `iris adopt`.
- Surfaces: CLI + skills.
- Contract: scans `README.md` and `docs/**/*.md`, stores the source path and content hash in the page registry, and writes a read-only report mirror. Re-run `adopt` to accept a source update flagged by `sync`.

## `iris archive <id>`

- Synopsis: move page to archive and update feed/index.
- Flags: `--json`.
- Inputs: page id.
- Outputs: archived page + state update.
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

## `iris vendor`

- Synopsis: download pinned CDN assets into `design/vendor` and switch asset base.
- Flags: `--json`.
- Inputs: CDN constants.
- Outputs: local vendored assets.
- Exit codes: 0/1/2.
- Example: `iris vendor`.
- Surfaces: CLI + skills.
- Status: not yet implemented; the CLI exits 1 with a clear message until a later milestone lands.

## `iris open`

- Synopsis: open `iris/index.html` in the default browser via the platform opener (`open`, `start`, or `xdg-open`).
- Flags: `--json`.
- Inputs: local dashboard path.
- Outputs: browser launch; prints the opened path.
- Exit codes: 0 opened · 1 when `iris/index.html` is missing (run `iris init` first) · 2 when the opener cannot launch.
- Example: `iris open`.
- Surfaces: CLI + editor task.

## `iris update`

- Synopsis: regenerate managed integration shims while preserving user edits outside managed blocks.
- Flags: `--json`.
- Inputs: existing project configuration.
- Outputs: refreshed surface shim files.
- Exit codes: 0/1/2.
- Example: `iris update`.
- Surfaces: CLI.
- Managed boundary: design assets and the `iris: open dashboard` task are refreshed; unrelated `.vscode/tasks.json` entries are preserved.
