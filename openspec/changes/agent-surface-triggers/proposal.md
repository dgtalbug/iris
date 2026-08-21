## Why

Iris installs one `iris-workspace` skill whose description — "Use Iris to create and render intentional local visual workspace content" — says what Iris is but never says *when* to reach for it, so in ordinary conversation an agent finishes a bug fix, a plan, or a piece of research and the result stays in chat instead of landing on the dashboard. Claude Code and Copilot users also expect typed slash commands for frequent actions, and today Iris exposes none.

## What Changes

- Rewrite the canonical skill so its trigger is conversational: a description naming the moments that call for Iris (finished a fix, a feature, a plan, an idea, research, or a session) and a compact intent-to-command table mapping what a user says to the exact command and where it lands.
- Generate typed slash commands from the same canonical source into `.claude/commands/iris/` and `.github/prompts/`, one per frequent content action (`report`, `research`, `bug`, `feature`, `idea`, `plan`, `render`), each a short create → fill → render → report-path instruction.
- Apply the existing managed-region ownership rules to the generated command files: verifiable ownership markers with a body digest, atomic confined writes, refresh only an intact managed region, preserve and report anything unmarked, edited, malformed, symlinked, or escaping.
- Keep the skill the single source of agent instructions; command files are generated projections of it, never independently maintained copies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-first-initialization`: the canonical skill installation requirement gains conversational trigger and intent-mapping content obligations; a new requirement covers generated slash-command surfaces installed and preserved under the same managed-ownership rules.

## Impact

- `templates/agents/iris-workspace.md` is rewritten; a new packaged command template source and `src/lib/agent-skills.ts` gain command-file generation; `package.json` `files` must ship the new template assets and release verification must check them.
- `src/commands/init.ts` and `src/commands/lifecycle.ts` report command-surface results alongside skill results.
- Tests for skill content, command generation, collision preservation, and packaged payload; docs (`README.md`, `docs/cmds.md`, `docs/status.md`) updated.
- Depends on `dashboard-shell-redesign` (command catalog and Commands page) and `research-markdown-pages` (the `research` command the skill and slash commands reference). No new dependency, network access, or runtime.
