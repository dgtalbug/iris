## Why

Iris today is a working proof of concept: `iris init` writes a fixed set of agent
surfaces with no tool picker, no user-global configuration, no terminal styling,
and no machine-local state home. Project docs and research pages are placeholder
Markdown rather than structured reports, and the design language is described
using an upstream name rather than as Iris's own system. To release Iris widely,
setup must become a first-class, best-in-class experience, reporting must adopt
Iris's native structured design language, and machine bookkeeping must move out
of the committed workspace.

## What Changes

- Turn `iris init` into a staged setup flow: welcome card, host detection,
  interactive multi-select tool picker, per-host skill/command generation, and a
  completion card. Add `--tools`, `--yes`, `--interactive`, and `--index` flags.
  Non-interactive and CI paths stay fully offline and never prompt.
- Add a data-driven host-adapter table supporting Claude, shared agents, GitHub
  Copilot, Cursor, Gemini, and Codex; adding a host becomes a row, not a code
  path.
- Introduce a user-global home at `~/.iris` holding machine config, a project
  registry, and per-project machine state. Move the derived page registry and
  spec snapshot out of the committed `iris/` tree; keep authored sources in the
  repo.
- Make the structured report blueprint and Electric components the native
  structure of research, bug, feature, plan, and project pages via additive,
  backward-compatible schema and renderer changes.
- Rename the design language to Iris Electric as Iris's native system and absorb
  the upstream contract doc.
- Add `iris-guard`: a provenance/brand linter (scanner + agent skill) that keeps
  all user-facing output free of external tool and source names.
- Upgrade the flagship `iris-workspace` skill to a directory with a blueprint and
  a component cookbook generated from the same source as the renderer tests.

## Capabilities

### New Capabilities

- `user-global-state`: a `~/.iris` home for machine config, a project registry,
  and per-project machine state, with a stable project-identity scheme and
  migration from in-repo state.
- `provenance-and-brand-guard`: a denylist scanner and agent skill that keep
  user-facing output true to Iris and free of external source names.
- `electric-report-blueprint`: the ten-section report structure and Electric
  Markdown components as the native authoring and rendering model.

### Modified Capabilities

- `agent-first-initialization`: init becomes a staged, host-detecting,
  tool-selecting setup flow that writes user-global config and per-host surfaces.
- `project-lifecycle-automation`: machine state relocates to `~/.iris` with a
  safe, atomic migration that preserves the committed workspace.

## Impact

- Adds new library modules (`host-adapters`, `terminal`, `user-config`,
  `provenance`, `markdown-electric`) and reworks `init` and `agent-skills`.
- Adopts a small, pinned set of prompt/color runtime dependencies, each recorded
  in `package.json`'s dependency rationale.
- Moves `iris/state.json` and `iris/spec.json` to `~/.iris/projects/<id>/` via an
  atomic migration; both are already gitignored, so no history rewrite.
- Renames the design system to Iris Electric across user-facing copy and
  generated HTML `data-ds` attributes.
- Adds a CI provenance lint alongside the existing token lint.
- Keeps `--version` as a bare token; styling is confined to help, init, and
  welcome output. Offline and smoke-test contracts are preserved.
