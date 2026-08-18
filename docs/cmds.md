# iris commands and skills

> If a command is not listed here, it does not exist.

## Common
- Exit codes: `0` ok · `1` validation/user error · `2` environment error.
- Machine mode: all commands support `--json` (planned for full output parity in later milestones).
- Agent surfaces: CLI `iris`, Claude `/iris *`, Copilot prompts, Codex `$iris-*` (generated in later milestones).

## `iris init [--tools claude,codex,copilot] [--theme dark|light]`
- Synopsis: scaffold `iris/`, detect OpenSpec and GitNexus, create dashboard and editor task.
- Flags: `--tools`, `--theme`, `--json`.
- Inputs: current project directory.
- Outputs: scaffolded `iris/` tree, `.vscode/tasks.json`, quickstart lines.
- Exit codes: 0/1/2.
- Example: `iris init --tools claude,copilot --theme dark`.
- Surfaces: CLI + all generated skills.

## `iris render [<id>|--all]`
- Synopsis: render contract data to page HTML and refresh dashboard/feed.
- Flags: `--all`, `--json`.
- Inputs: `iris/pages/<id>/data.json` or all pages.
- Outputs: `page.html` artifacts and updated `iris/index.html`.
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

## `iris promote <report-id> <feature|bug|idea>`
- Synopsis: remap report sections into promoted page and link both.
- Flags: `--json`.
- Inputs: report id + target type.
- Outputs: new promoted page folder.
- Exit codes: 0/1/2.
- Example: `iris promote report-cache feature`.
- Surfaces: CLI + skills.

## `iris sync`
- Synopsis: incremental changelog, hotspots, stale marks, selective re-render.
- Flags: `--quiet`, `--json`.
- Inputs: git history range.
- Outputs: state updates + feed/delta artifacts.
- Exit codes: 0/1/2.
- Example: `iris sync --quiet`.
- Surfaces: CLI + hooks.

## `iris adopt`
- Synopsis: mirror README/docs markdown as read-only styled pages.
- Flags: `--json`.
- Inputs: repo docs markdown.
- Outputs: mirror pages + dashboard listing.
- Exit codes: 0/1/2.
- Example: `iris adopt`.
- Surfaces: CLI + skills.

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
- Flags: `--single` (default), `--png`, `--pdf`, `--json`.
- Inputs: page id.
- Outputs: exported artifact.
- Exit codes: 0/1/2.
- Example: `iris export bug-cache-stampede --single`.
- Surfaces: CLI + skills.

## `iris vendor`
- Synopsis: download pinned CDN assets into `design/vendor` and switch asset base.
- Flags: `--json`.
- Inputs: CDN constants.
- Outputs: local vendored assets.
- Exit codes: 0/1/2.
- Example: `iris vendor`.
- Surfaces: CLI + skills.

## `iris open`
- Synopsis: open `iris/index.html` in default browser.
- Flags: `--json`.
- Inputs: local dashboard path.
- Outputs: browser launch attempt.
- Exit codes: 0/1/2.
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
