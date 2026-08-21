# Design

## Context

The workspace is generated once and opened from `file://`. Every decision below is constrained by that: there is no runtime to re-derive state, so anything the reader sees was decided at generation time and frozen into the output.

## Decisions

### Section counts are totals, measured the same way

`navCounts` reported `work`, `research`, and `commands` as totals and `spec` as `active_changes.length`. Mixing measures inside one badge row is what produced `Spec 0` beside a Spec page listing nine canonical specs. The badge becomes canonical specs plus active changes: the records the section holds.

Archived changes are deliberately excluded from the badge. They are reachable and counted on the Spec page, but a badge that grows forever as history accumulates stops carrying signal about the current workspace. The badge answers "how much is here now"; the page answers "what is here in total".

`navCounts` carries a CRITICAL impact rating — three direct callers, fourteen execution flows, both the Commands and Templates modules. The rating reflects that every page renders the shell. The `NavCounts` shape is unchanged and `spec` remains a number, so the blast radius is the displayed value on eleven pages, which is the intent.

### Derived detection is removed from user configuration, not re-derived

`detected_tools.openspec` was written into `iris/config.yaml` by `writeIfMissing`, so it recorded whatever was true when the workspace was first created and was never revisited. Nothing reads it.

Re-deriving it on every `init` was rejected. `config.yaml` is user-owned: it carries `theme`, which `loadWorkspaceTheme` reads, and `budgets`. Rewriting a user-owned file to refresh a value nothing consumes trades a harmless stale key for a real risk of clobbering hand edits. Detection already has a correct home in `iris/spec.json`, which is regenerated wholesale on every `init` and `render`, and which the renderer actually reads.

The key is dropped from the template rather than migrated out of existing files. Removing a key from a file the user owns is a change to their file; leaving it costs nothing once no code path consults it.

### Non-text contrast is validated with two thresholds, named separately

The token contract enforced 4.5:1 across twenty-one text pairs and checked no border or control boundary. Measured against that silence, `--line-1` sat at 1.46:1 on `--surface-1` and 1.23:1 on `--surface-2`.

Two thresholds apply, because two different things are being measured:

- **Control boundaries at 3:1.** `--accent` carries buttons, the active navigation rail, and focus rings. These are user interface components under WCAG 1.4.11, and 3:1 is that criterion's threshold.
- **Border visibility at 1.45:1.** A card border is not a control and no accessibility criterion governs it. The floor exists to make "the boundary is visible" a measurable property rather than a matter of taste. It is declared as a project floor and the validator says so in the failure message, because reporting a 1.45 floor in the same voice as a WCAG result would misrepresent what was checked.

### Neutral chrome with a blue primary

A navy chrome band was considered and rejected: the light theme paints `--nav-bg: #ffffff`, so a navy top bar would either force the sidebar navy in both themes or leave the two halves of one chrome unit unrelated.

Instead the chrome stays neutral and the blue carries meaning: the active navigation rail, links, buttons, and focus. The top bar takes its own surface token rather than `var(--bg)` so it reads as a band without colour, and `--elevation-1` stays off in the dark theme, where a shadow under a now-visible border only muddies the edge it sits on.

### Codex coverage already exists

`iris init` writes the `iris-workspace` skill to `.agents/skills/`, `.claude/skills/`, and `.github/skills/` — the same three roots OpenSpec v1.9.0 writes in this repository — plus six command surfaces under `.claude/commands/iris/` and `.github/prompts/`. The canonical spec already names `.agents/` as the generic/Codex location, and neither tool writes `AGENTS.md`.

No new surface descriptor is added. The gap was that fifteen installed files were reported nowhere, so initialization looked like it had done nothing. The fix is reporting, in the terminal and on the Commands page.

## Risks

- Existing workspaces keep a stale `detected_tools` key. It is inert once unread, and removing it from a user-owned file without being asked is the larger harm.
- Raising border contrast changes the appearance of every generated page. The token contract now covers it, so a regression is caught by `pnpm token-lint` rather than by eye.
