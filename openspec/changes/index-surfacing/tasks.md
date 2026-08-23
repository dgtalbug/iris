# Tasks — index-surfacing

This change is structured for parallel (swarm) execution. Workstreams A–D are
independent and own disjoint files; each lists the files it owns so two agents
never edit the same file. Workstream E (integration) depends on A–D and runs
last. Each workstream is self-contained and can be handed to its own agent with
its owned files plus the design doc.

> Convention: `[WS-x]` prefixes each workstream. Owned files are exclusive.
> Shared files (`src/commands/init.ts`, `src/cli.ts`, page templates) are edited
> only by the workstream listed as their owner; others coordinate through the
> design doc.

## WS-A. Indexing library (foundation, no deps on templates or init)

- [ ] A.1 Add `src/lib/indexing.ts`: indexer discovery (`PATH` then
      `npx --no-install gitnexus`), refuse-if-absent with install instructions,
      `gitnexus analyze` invocation, `gitnexus status` parsing, and the
      `~/.iris/projects/<id>/index.json` pointer read/write
      (`{ enabled, lastIndexedSha, symbols, flows, indexedAt }`).
      **Owns:** `src/lib/indexing.ts`, `tests/indexing.test.ts`
- [ ] A.2 Implement staleness computation: compare `lastIndexedSha` to the
      current `HEAD` sha (read from git) and return `up to date` |
      `stale (N commits behind)` | `unknown`. **Owns:** `src/lib/indexing.ts`
      (same module), `tests/indexing-staleness.test.ts`

## WS-B. Page templates: Index card (owns overview + commands templates)

- [ ] B.1 Add an Index card to the Overview page template that reads
      `index.json` and renders status, symbol count, flow count, last indexed
      sha (short), and the staleness hint; degrade to a single `disabled` line
      when the pointer is absent. **Owns:** `src/templates/pages/overview.ts`
- [ ] B.2 Add the same Index card to the Commands page template.
      **Owns:** `src/templates/pages/spec.ts` (commands section), or the
      commands template file that owns the Commands page — see Phase 1's
      file ownership map and pick the single owner.
- [ ] B.3 Add render-snapshot tests for the Index card in both enabled and
      disabled states. **Owns:** `tests/pages-index-card.test.ts`

## WS-C. Agent skill: index-aware section (owns skill template)

- [ ] C.1 Add a "When the index is enabled" section to the `iris-workspace`
      skill template: run impact analysis before editing any symbol, query the
      graph before exploring unfamiliar code, warn on HIGH or CRITICAL impact.
      Name both the MCP tools (`gitnexus_impact`, `gitnexus_query`) and the
      CLI equivalents (`gitnexus impact`, `gitnexus query`) so the section
      works without the MCP. **Owns:** `templates/agents/iris-workspace/SKILL.md`
- [ ] C.2 Regenerate the skill's component reference if the section touches
      `references/*` (it should not — the section lives in `SKILL.md` only).
      **Owns:** `templates/agents/iris-workspace/references/components.md`
      (only if touched; otherwise skip)
- [ ] C.3 Add a test that the index-aware section renders for every host that
      receives the flagship skill. **Owns:** `tests/agent-skills-index.test.ts`

## WS-D. Schemas and user-global config (owns schema + config seam)

- [ ] D.1 Add an `index.json` shape description to the user-global state
      contract (no JSON schema file is added unless Phase 1 introduced one for
      `state.json`; mirror whatever Phase 1 did). **Owns:** the schema or
      contract file Phase 1 uses for `~/.iris/projects/<id>/` shapes —
      coordinate with Phase 1's WS-B output.
- [ ] D.2 Confirm `iris/config.yaml` records nothing about indexing: add a
      test that asserts no `index` or `indexing` key is written to the
      committed workspace config. **Owns:** `tests/init-config-no-index.test.ts`

## WS-E. Integration: init wiring + verification (runs LAST; depends on A–D)

- [ ] E.1 Wire `iris init --index` to call `src/lib/indexing.ts`: discover the
      indexer, refuse with install instructions if absent, run `gitnexus
      analyze`, write `index.json`, and surface the result on the completion
      card. Leave `--no-index` (default) untouched. **Owns:** `src/commands/init.ts`
- [ ] E.2 If the existing `--index` / `--no-index` plumbing in `src/cli.ts`
      needs a forward-compat note (it should not — Phase 1 already parses
      both), add it; otherwise do not touch `src/cli.ts`. **Owns:** `src/cli.ts`
      (only if needed)
- [ ] E.3 Wire the Index card read path into the render pipeline so the
      Overview and Commands pages pick up `index.json` at render time.
      **Owns:** `src/commands/render.ts` (read path only; templates are owned
      by WS-B)
- [ ] E.4 Offline smoke: `iris init --yes --tools none --no-index` still runs
      with no network and no indexer; `scripts/install-smoke.mjs` passes.
      **Owns:** `scripts/install-smoke.mjs`
- [ ] E.5 Refuse-path smoke: `iris init --index` with the indexer absent exits
      non-zero and prints the install command; with the indexer present it
      writes `index.json` and the Index card renders.
- [ ] E.6 Run the full release gate and strict OpenSpec validation.

---

### Parallelization notes

- **Wave 1 (parallel):** WS-A, WS-B, WS-C, WS-D — disjoint files. WS-D
  coordinates with Phase 1's WS-B output for the `~/.iris/projects/<id>/`
  shape contract.
- **Wave 2 (sequential):** WS-E integrates A–D (touches the shared `init`
  seam and the render read path).
- **Wave 3:** WS-E verification (steps E.4–E.6).
- `src/commands/init.ts` is owned by E.1 only; A.1 exposes the indexing
  module and E.1 calls it. `src/commands/render.ts` is owned by E.3 for the
  read path; the templates that render the card are owned by WS-B.
