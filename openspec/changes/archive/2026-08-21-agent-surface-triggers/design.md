## Context

See proposal.md. `src/lib/agent-skills.ts` already implements the managed-surface machinery this change reuses: a packaged template read from the installed package root, front matter plus `IRIS:MANAGED:START/END` markers carrying template id, schema, version, and a SHA-256 body digest, symlink and confinement checks, and atomic temp-file writes. It installs three skill files today.

## Goals / Non-Goals

**Goals:**

- An agent reading only the skill can decide whether Iris applies and which command to run.
- Slash commands exist where users type them (Claude Code, Copilot) without a second source of truth.
- Reuse the existing ownership, digest, confinement, and atomic-write rules verbatim.
- Keep the skill small; the intent table is the payload, not prose.

**Non-Goals:**

- A Codex command surface (Codex consumes the skill directly).
- Commands for setup or share actions (`init`, `update`, `vendor`, `open`, `publish`, `export`); the Commands page and `--help` cover those.
- Auto-invocation, hooks, or watching. Iris still runs when an agent or user runs it.

## Decisions

### Generalize the installer over a surface descriptor

`installAgentSkills` becomes `installAgentSurfaces`, iterating a list of `{ templateId, target, frontMatter, body }` descriptors instead of one hard-coded template. Marker parsing keys off the descriptor's template id rather than the literal `iris-workspace`, so skill and command files share one code path and one conflict-reporting shape. The public `SkillInstallResult` shape is unchanged so `assertSkillInstallComplete` and its callers keep working.

Alternative: a second parallel installer for commands. Rejected — it duplicates the security-relevant marker and confinement logic, which is exactly the drift the agent-first change removed.

### One packaged command template, projected per action

`templates/agents/iris-commands.md` holds a table of actions (`report`, `research`, `bug`, `feature`, `idea`, `plan`, `render`) with the one-line body each generated command carries. The generator emits `.claude/commands/iris/<action>.md` and `.github/prompts/iris-<action>.prompt.md` from that single table, differing only in the front matter each host expects. Bodies stay ~8 lines: what it creates, what to edit, what to run, what to report back.

### Conversational skill trigger

The skill's `description` changes to name the moments rather than the product, and the body opens with a "When to use this" intent table (user says → command → lands as). Everything already in the skill (setup, contract workflow, render semantics, preservation rules) stays but is compressed so the file does not grow materially; the intent table earns its ~150 tokens by being the part that fires in conversation.

### Packaging and verification

`package.json` `files` already ships `templates/agents`, so the new template is included by directory. `scripts/verify-release.mjs` gains an assertion for the command template so a missing asset fails the release rather than silently installing fewer surfaces.

## Risks / Trade-offs

- [More generated files to preserve safely] → Same marker, digest, confinement, and atomic-write path as skills; conflicts are reported, never overwritten.
- [Slash commands could drift from the CLI] → Actions are derived from the command catalog introduced by `dashboard-shell-redesign`; a test asserts every generated command names a catalog entry that exists.
- [A larger skill costs tokens on every agent turn] → The rewrite compresses existing prose to offset the intent table; a test asserts the rendered skill stays under a fixed byte budget.
- [Copilot prompt front matter differs from Claude's] → Encoded per surface in the descriptor; unknown hosts are simply not targeted.

## Migration Plan

1. Generalize the installer and add descriptor-driven generation with tests, still installing only skills.
2. Add the command template and the two command surfaces; extend init/update reporting.
3. Rewrite the skill template; update packaging verification and docs.
4. Run the release gate and regenerate local surfaces.

Rollback: revert; generated command files are inert Markdown that a later `iris init` no longer refreshes, and users may delete them.
