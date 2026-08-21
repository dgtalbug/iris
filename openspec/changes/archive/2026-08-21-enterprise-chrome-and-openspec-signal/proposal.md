# Enterprise chrome and OpenSpec signal

## Why

Three defects surfaced when the generated workspace was reviewed against a real repository that already uses OpenSpec.

**The dashboard reports that OpenSpec is absent when it is not.** `iris/spec.json` records `detected: true` with nine canonical specs and seventeen archived changes, and the Spec page renders all of it. The sidebar badge still reads `Spec 0` because it counts only active changes, while the `work`, `research`, and `commands` badges all count totals. The Overview "Spec movement" card compounds this: with no active change it prints "No active OpenSpec changes" and stops, never mentioning the specs it is already holding. A reader concludes Iris cannot see OpenSpec.

`iris/config.yaml` states this outright: `detected_tools.openspec: false`. That key is written once by `writeIfMissing` and never revisited, so it is frozen at whatever was true on the day the workspace was created. Nothing reads it. It is derived state stored in a user-owned file, and it contradicts the snapshot that is actually authoritative.

**Initialization installs fifteen agent files and says nothing.** `iris init` writes the `iris-workspace` skill to the generic/Codex, Claude, and Copilot skill roots and six command surfaces to `.claude/commands/iris/` and `.github/prompts/`, then prints `iris initialized`. `updateManagedSurfaces` already returns created, updated, unchanged, and conflict lists; initialization discards all of it. The workspace has no view of what Iris installed either, so the product's central promise — set up skills for agents — is invisible in both the terminal and the dashboard.

**Card borders are unvalidated and read as muddy.** `--line-1` measures 1.46:1 against `--surface-1` and 1.23:1 against `--surface-2` in the dark theme. The token contract enforces 4.5:1 across twenty-one text pairs and does not check border or control boundaries at all, so `pnpm token-lint` stayed green while the boundaries were effectively invisible. The accent is a soft periwinkle rather than a primary blue, and the top bar is painted `var(--bg)`, so the chrome has no identity of its own.

## What Changes

- Section badges report totals consistently; the Spec badge counts canonical specs plus active changes.
- The Overview spec card always reports canonical and archived counts, and names active changes as a separate line rather than as the card's only content.
- `detected_tools` is removed from the generated `config.yaml` template; OpenSpec detection is read from the snapshot, which is where it is already derived.
- `iris init` reports the agent surfaces it installed, updated, left unchanged, or could not write.
- The Commands page gains an agent-surfaces section listing every installed surface and its destination.
- The token contract validates non-text contrast: control boundaries at 3:1 and border visibility at a declared floor, in both themes.
- The palette moves to neutral chrome with a strong blue primary: crisper borders, a distinct top-bar surface, and a blue active rail.
- The Overview project-docs shelf becomes a card grid carrying each document's icon and purpose.

## Impact

- Affected specs: `aperture-design-system`, `agent-first-initialization`, `openspec-spec-browser`
- Affected code: `src/templates/tokens.ts`, `src/templates/styles.ts`, `src/templates/workspace.ts`, `src/templates/pages/overview.ts`, `src/templates/pages/commands.ts`, `src/commands/init.ts`, `scripts/token-contract.mjs`
- `navCounts` carries a CRITICAL impact rating (14 impacted symbols, 3 direct callers, 14 execution flows). The signature is unchanged; only the reported value moves, so every caller keeps compiling and rendering.
- Existing workspaces keep their `detected_tools` key until the owner removes it. Nothing reads it, so a stale value stops being able to mislead the dashboard.
