# Tasks — setup-experience-and-brand-guard

This change is structured for parallel (swarm) execution. Workstreams A–F are
independent and own disjoint files; each lists the files it owns so two agents
never edit the same file. Workstream G (integration) depends on A–F and runs
last. Each workstream is self-contained and can be handed to its own agent with
its owned files plus the design doc.

> Convention: `[WS-x]` prefixes each workstream. Owned files are exclusive.
> Shared files (`src/cli.ts`, `package.json`, schemas) are edited only by the
> workstream listed as their owner; others coordinate through the design doc.

## WS-A. Terminal + host adapters (foundation, no deps)

- [ ] A.1 Add `src/lib/terminal.ts`: color/box/prompt primitives honoring
      `NO_COLOR`, `CI`, the Iris no-animation env var, and OS reduced-motion,
      with a static fallback. **Owns:** `src/lib/terminal.ts`, `tests/terminal.test.ts`
- [ ] A.2 Add `src/lib/host-adapters.ts`: data-driven adapter table for
      `claude`, `agents`, `github`, `cursor`, `gemini`, `codex` (detect paths,
      skills dir, commands dir, command format). **Owns:** `src/lib/host-adapters.ts`,
      `tests/host-adapters.test.ts`
- [ ] A.3 Add curated prompt/color dependencies, pinned, each recorded in
      `package.json`'s dependency rationale. **Owns:** `package.json`

## WS-B. User-global state (`~/.iris`) (depends on nothing; owns its module)

- [ ] B.1 Add `src/lib/user-config.ts`: read/write `~/.iris/config.json`,
      `registry.json`, and `projects/<id>/`; implement `<slug>-<hash8>` identity
      (git-remote primary, realpath fallback) and root/remote reconciliation.
      **Owns:** `src/lib/user-config.ts`, `tests/user-config.test.ts`
- [ ] B.2 Implement `migrateMetaToHome(cwd)`: atomic move of `iris/state.json`,
      regenerate `iris/spec.json` into the new location, single stdout line.
      **Owns:** `src/lib/user-config.ts` (same module), `tests/migrate-meta.test.ts`

## WS-C. Electric Markdown + blueprint renderer (owns markdown layer)

- [ ] C.1 Add `src/lib/markdown-electric.ts`: hand-rolled container/fence
      tokenizer for `callout|evidence|steps|timeline|filetree|flow|details|meter`,
      footnotes, and confidence badges, compiling to existing token-only classes.
      **Owns:** `src/lib/markdown-electric.ts`, `tests/markdown-electric.test.ts`
- [ ] C.2 Wire section-id mapping (ten fixed headings → `#tldr`…`#appendix`),
      auto TOC, and meta-row into the markdown pipeline. **Owns:** `src/lib/markdown.ts`
- [ ] C.3 Add `templates/research/blueprint.md` research scaffold.
      **Owns:** `templates/research/blueprint.md`

## WS-D. Contract schemas + page templates (owns schemas + page templates)

- [ ] D.1 Add optional additive `sections.blueprint` object to the bug, feature,
      idea, plan, and report schemas (subset of the ten section ids, Markdown
      strings). **Owns:** `schemas/bug.schema.json`, `schemas/feature.schema.json`,
      `schemas/idea.schema.json`, `schemas/plan.schema.json`, `schemas/report.schema.json`
- [ ] D.2 Compose blueprint narrative sections above existing typed widgets when
      `sections.blueprint` is present; render as today when absent. Add report
      chrome (TOC, meta-row) to research and project docs; add inline-SVG charts.
      **Owns:** `src/templates/pages/*.ts`

## WS-E. Provenance guard + Iris Electric rename (owns provenance + docs)

- [ ] E.1 Add `src/lib/provenance.ts` (denylist scanner) and
      `scripts/provenance-lint.mjs` (CI entry, exit 1 on hit), with a per-path
      allowlist file carrying justification comments. **Owns:** `src/lib/provenance.ts`,
      `scripts/provenance-lint.mjs`, `provenance.allowlist.json`, `tests/provenance.test.ts`
- [ ] E.2 Rename the design language to Iris Electric across user-facing copy and
      generated `data-ds` attributes; absorb the upstream contract doc into
      `docs/design-system.md` and delete the verbatim upstream file. Genericize
      the specs-integration name to "Specs" in UI copy (allowlist the directory
      literal in detection code only). **Owns:** `docs/design-system.md`,
      `docs/vision-electric-v2.md` (delete), `src/templates/tokens.ts` comments

## WS-F. Agent skills + command surfaces (owns agent templates + generator)

- [ ] F.1 Restructure `templates/agents/iris-workspace/` as a directory:
      `SKILL.md` (craft loop, when-to-use, type map, color law, verification
      checklist) + `references/blueprint.md` + `references/components.md`.
      **Owns:** `templates/agents/iris-workspace/**`
- [ ] F.2 Generate `references/components.md` from the same canonical source as
      the renderer's container tests so skill/renderer drift fails a test.
      **Owns:** `templates/agents/iris-workspace/references/components.md`,
      `tests/components-doc.test.ts`
- [ ] F.3 Add `templates/agents/iris-guard/SKILL.md` (authoring-time provenance
      rules + embedded denylist). **Owns:** `templates/agents/iris-guard/**`
- [ ] F.4 Make `src/lib/agent-skills.ts` adapter-driven and emit skill
      *directories* under managed markers for each selected host.
      **Owns:** `src/lib/agent-skills.ts`, `tests/agent-skills.test.ts`

## WS-G. Integration: staged init + config verb + state resolution (runs LAST; depends on A–F)

- [ ] G.1 Rework `src/commands/init.ts` into the staged flow (welcome → validate
      → detect → picker → user-global config → generate → completion card) with
      `--tools`, `--yes`, `--interactive`, `--index` flags. **Owns:** `src/commands/init.ts`
- [ ] G.2 Add the new init flags and implement the `config` verb in `src/cli.ts`.
      **Owns:** `src/cli.ts`
- [ ] G.3 Resolve page registry and spec snapshot via `~/.iris/projects/<id>/` in
      state/render/lifecycle/spec-snapshot modules. **Owns:** `src/lib/project-state.ts`,
      `src/commands/render.ts`, `src/lib/lifecycle.ts`, `src/lib/openspec-workspace.ts`
- [ ] G.4 Wire the provenance scan into init/update/render and `release:check`.
      **Owns:** `package.json` (release:check script), `src/commands/init.ts` (scan call)

## WS-H. Verification (depends on G)

- [ ] H.1 Offline smoke: `iris init --yes --tools none` runs with no network and
      no prompt; `scripts/install-smoke.mjs` passes. **Owns:** `scripts/install-smoke.mjs`
- [ ] H.2 Migration, denylist, and container render snapshot tests pass.
- [ ] H.3 Run the full release gate and strict OpenSpec validation.

---

### Parallelization notes

- **Wave 1 (parallel):** WS-A, WS-B, WS-C, WS-D, WS-E, WS-F — disjoint files.
- **Wave 2 (sequential):** WS-G integrates A–F (touches the shared `init`/`cli`
  and state-resolution seams).
- **Wave 3:** WS-H verification.
- `package.json` is co-owned by A.3 (deps) and G.4 (release:check); the Wave-2
  integrator reconciles both edits in one pass.
