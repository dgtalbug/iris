## Context

Iris is a local-first Node CLI that scaffolds an `iris/` workspace, drafts typed
JSON/Markdown sources, and renders Electric-styled static HTML. The current
v0.4.0 is treated as a proof of concept. This change defines the wide-release
setup experience, the relocation of machine state out of the committed
workspace, the adoption of the structured report blueprint as Iris's native
authoring model, and a provenance guard that keeps the product's voice its own.

Iris remains local-first and offline-capable. Initialization and rendering must
work from packaged assets with no network and no LLM in the CLI. The CLI
scaffolds structure; an agent skill fills report prose.

## Goals / Non-Goals

**Goals:**

- A staged `iris init` with welcome, host detection, an interactive tool picker,
  per-host surface generation, and a completion card.
- A user-global `~/.iris` home for machine config, a project registry, and
  per-project machine state, with atomic migration from in-repo state.
- The ten-section report blueprint and Electric components as the native
  structure of research, bug, feature, plan, and project pages.
- A provenance/brand guard (scanner plus agent skill) that keeps user-facing
  output free of external tool and source names.
- A flagship `iris-workspace` skill whose component reference is generated from
  the same canonical source as the renderer's container tests.

**Non-Goals:**

- GitNexus indexing and the global dashboard (separate follow-up changes).
- Moving authored sources out of the repository (they stay committed).
- Changing `--version` output (stays a bare token for installers).
- Putting an LLM in the CLI or requiring network at init or render time.

## Decisions

### Staged init with a data-driven host table

`iris init` runs: welcome card (interactive only) → silent validation → host
detection → tool picker → user-global config (first run) → generation →
completion card. Host support lives in a data-driven adapter table
(`id`, display name, detect paths, skills dir, commands dir, command format);
adding a host is a row, not a code path. Six adapters ship: `claude`, `agents`,
`github`, `cursor`, `gemini`, `codex`. Detection reads filesystem signals only
and is never written into the user-owned `iris/config.yaml`.

Resolution order for tool selection: `--tools` > `--yes`/non-TTY (`detected`) >
picker. `--tools none` still scaffolds the workspace and renders. Every flag
path stays offline; CI runs `iris init --yes --tools none` and never prompts.

### Curated terminal dependencies

The picker and styling use a small, pinned set of prompt/multi-select and color
libraries rather than hand-rolled readline/ANSI. Each dependency is recorded in
`package.json`'s dependency rationale so the trust story stays explicit. Color
and animation honor `NO_COLOR`, `CI`, an Iris no-animation env var, and the OS
reduced-motion preference, with a static fallback.

### User-global state and project identity

`~/.iris` holds `config.json` (theme, agent identity, tool defaults, indexing
preference), `registry.json` (project id → root/remote/lastSeen), and
`projects/<id>/` for machine-local state. Project identity is
`<slug>-<hash8>` keyed primarily on the normalized git remote, falling back to
an absolute-realpath hash; commands reconcile by root path then remote so a
moved checkout keeps its state.

Only machine state moves: `iris/state.json` and `iris/spec.json` relocate to
`~/.iris/projects/<id>/` via an atomic move (copy + verify + delete across
devices). Authored sources (`config.yaml`, `project/*.md`, `research/*`,
`pages/*`, `archive/**`) and generated output (`design/**`, `*.html`,
`iris/spec/`) stay in the repo. This keeps `git status` on `iris/` showing only
human-edited sources while `~/.iris` holds everything a human would not touch.

### Blueprint as native structure, additive schema only

Research pages scaffold from a blueprint template mapping ten fixed Markdown
headings to section ids (`#tldr` … `#appendix`); the renderer builds the TOC and
meta-row automatically and omits empty sections. A hand-rolled Markdown
container/fence layer compiles `::: callout|evidence|steps|timeline|filetree|
flow|details|meter`, footnotes, and confidence badges to existing token-only CSS
classes — no new color literals, so token lint and contrast validation keep
passing. Contract schemas gain one optional `sections.blueprint` object whose
keys are a subset of the ten section ids; when present, narrative sections
compose above the existing typed widgets; when absent, pages render as today.
Charts are CLI-generated inline SVG (no CDN chart library).

### Iris Electric rename and provenance guard

The design language is renamed Iris Electric across user-facing copy and the
generated `data-ds` attribute; the upstream contract doc is absorbed into
`docs/design-system.md` as Iris's own. A denylist scanner
(`src/lib/provenance.ts` + `scripts/provenance-lint.mjs`) scans generated agent
surfaces, templates, user-facing source strings, docs, and generated HTML for
external source names and fails CI on any hit. It runs after init/update, on
`render --all`, and in CI; it never auto-rewrites user content. The specs
directory format name is genericized to "Specs" in user-facing copy and
allowlisted to detection code only. An `iris-guard` skill enforces the same
rules at authoring time and ends the flagship skill's checklist.

### Flagship skill as a directory

`iris-workspace` ships as a directory (`SKILL.md` + `references/blueprint.md` +
`references/components.md`) under managed markers to every selected host.
`components.md` is generated from the same canonical source as the renderer's
container tests, so the skill can never document a construct the renderer
rejects — drift becomes a test failure.

## Risks / Trade-offs

- [New runtime dependencies expand the trust surface] → Keep the set small and
  pinned; record each in the dependency rationale; audit in CI.
- [Meta migration loses state] → Atomic move with copy + verify + delete
  fallback; both files are already gitignored, so no history rewrite.
- [Blueprint breaks existing drafts] → `sections.blueprint` is optional and
  additive; pages without it render exactly as today.
- [Provenance guard false positives] → Allowlist is per-path with a required
  justification comment; user content is flagged with `file:line`, never
  rewritten.
- [Interactive flow breaks CI] → Interactivity is gated on TTY and not-CI;
  `--yes`/`--tools` paths never prompt and stay offline.

## Migration Plan

1. Land the library modules, host adapters, terminal, user-config, provenance,
   and markdown-electric behind the reworked `init` and `agent-skills`.
2. Run `migrateMetaToHome` on first init/update/render after upgrade: move
   `state.json`, regenerate `spec.json` into the new location, print one line.
3. Rename the design system to Iris Electric and absorb the upstream doc.
4. Ship the flagship skill directory and `iris-guard`; wire the provenance lint
   into the release gate.
5. Verify: offline smoke (`init --yes --tools none`), migration, denylist, and
   container render snapshots all pass.

## Open Questions

- Exact prompt/color dependency set and versions (pinned at implementation).
- Whether `iris open --global` (Phase 3) is sufficient or a dedicated dashboard
  verb is warranted later.
