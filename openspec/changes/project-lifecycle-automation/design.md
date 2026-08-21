## Context

The project has a clear product identity and a documented command surface, but several lifecycle commands are intentionally stubbed out. The design goal is to keep the generated `iris` workspace active, up-to-date, and understandable without forcing users to manually maintain page metadata, dashboard links, or markdown-derived pages.

## Goals / Non-Goals

**Goals:**
- Turn the CLI lifecycle commands into a coherent operational model.
- Keep the generated project state aligned with repo files and documentation updates.
- Archive stale pages without losing the underlying page data.
- Maintain managed content boundaries so generated blocks do not wipe user work.

**Non-Goals:**
- Full multi-repo orchestration or remote sync.
- Automatic opinionated content rewriting beyond the project’s own lifecycle operations.
- A hosted backup or SaaS-driven project lifecycle.

## Decisions

- Treat lifecycle commands as the project’s operational layer rather than separate feature hacks.
- Keep `iris` pages and the dashboard as the canonical project memory, with repo markdown and other artifacts providing data inputs.
- Prefer selective refresh and stale-state toggles over broad re-renders after every shell event.
- Preserve user-authored files outside managed boundaries while updating generated integration code or scaffolding.

## Risks / Trade-offs

- [Project drift] → Mitigation: add sync and stale-state checks before re-rendering or archiving pages.
- [User edits getting clobbered] → Mitigation: keep managed/unmanaged boundaries explicit and update only managed blocks.
- [Lack of strong lifecycle semantics] → Mitigation: define a narrow set of lifecycle commands and keep them modest and deterministic.

## Migration Plan

1. Complete the project scaffold and baseline lifecycle configuration.
2. Implement the sync and stale-state decisions for the existing dashboard and page registry.
3. Add the adopt flow for README/docs-driven pages.
4. Add archive and update actions with boundary-safe behavior.
5. Validate the lifecycle flow with a real repo example and smoke tests.

## Open Questions

None at this stage; the command set is already defined in the CLI contract and should guide the implementation.
