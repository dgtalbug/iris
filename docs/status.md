# iris status report

> Snapshot date: 2026-08-23 · branch `main` · no active OpenSpec change; every change is archived and its deltas synced into the canonical specs.

## One-line summary

Iris is an agent-first local visual workspace: a shared navigation shell over one page per section — Overview, Work, Spec, Research, Commands, and project docs — where JSON contracts, Markdown research, and a bounded view of the repository's OpenSpec filesystem all render as deterministic offline HTML.

## Current implementation

| Area                      | State                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands implemented      | `init`, `render`, `research`, `report` (including `--from-session`), `publish`, `feature`, `bug`, `idea`, `plan`, `archive`, `export --single`, `vendor`, `open`, `update`, plus the global `--help` and `--version` flags                                                                                                                                                                                                                           |
| Commands stubbed (exit 1) | `promote`; `export --png` and `export --pdf` refuse explicitly and write nothing                                                                                                                                                                                                                                                                                                                                                                     |
| Workspace                 | Sidebar shell over `index.html` (Overview), `work.html`, `spec.html` plus its record bundle, `research.html`, `commands.html`, contract pages, and project docs; classic deferred scripts, both themes, reduced-motion fallback, visible focus, and 360 px layout; project docs rendered from Markdown sources with Mermaid skeletons, the HLD projected onto the Overview, and each OpenSpec change shown as Proposal / Design / Tasks / Specs tabs |
| Design system             | Vision "Electric" v2.0 (`docs/design-system.md` 4.0): oklch token block plus an iris extension, Vision component vocabulary, radar identity, and Lucide icons serialised to inline SVG at generation time; contrast, control-boundary, and border floors validated in CI over oklch and token aliases                                                                                                                                                |
| OpenSpec inputs           | Project/config, canonical specs, structured active/archive changes, proposal/design/tasks, change-local delta specs, and legacy archive Markdown                                                                                                                                                                                                                                                                                                     |
| OpenSpec snapshot         | Versioned `iris/spec.json`; refreshed by init/full render only, with independent lifecycle/completeness/task/parser-health dimensions and Markdown/YAML presentation identity                                                                                                                                                                                                                                                                        |
| Agent surfaces            | Three `iris-workspace` skills plus `/iris:*` command files for Claude and Copilot prompts, generated from two packaged templates under one managed-ownership contract that covers the generated front matter as well as the managed body, so descriptions converge on upgrade                                                                                                                                                                        |
| State                     | Version 2 page registry with active/archive navigation; no adopted-source hashes or stale-source states                                                                                                                                                                                                                                                                                                                                              |
| Tests                     | 27 Vitest suites (195 tests) plus lint, format, token, type, HTML, packaging, installed-smoke, and strict OpenSpec gates                                                                                                                                                                                                                                                                                                                             |
| Runtime dependencies      | `ajv`, generation-time `markdown-it` and `lucide`, and pinned Mermaid copied by explicit offline vendoring; no frontend framework, browser Markdown parser, icon runtime, server, watcher, telemetry, or OpenSpec runtime dependency                                                                                                                                                                                                                 |

## OpenSpec browser contract

- `iris init`, bare `iris render`, and `iris render --all` atomically regenerate `iris/spec.json` from current files.
- Page-specific render, report, archive, publish preparation, and update reuse the prior snapshot and do not read OpenSpec implicitly.
- Traversal is sorted, allowlisted, repository-confined, symlink-refusing, and bounded by depth, supported file count, individual bytes, and aggregate bytes.
- Task progress comes only from Markdown list checkboxes outside fenced code. Archive names never imply completion.
- Nested capability paths and ADDED/MODIFIED/REMOVED/RENAMED labels are preserved.
- Raw content is escaped. Malformed, partial, unknown, oversized, unsafe, or unreadable inputs produce isolated path-specific warnings while valid siblings remain visible.
- Markdown artifacts render semantically with embedded HTML, unsafe destinations, and active images disabled; exact Mermaid fences progressively render one at a time under strict local settings while diagram and document source remain available, and YAML stays literal.
- The Spec index lists records only; artifact bodies and exact source live in a generated classic-script bundle addressed by hash, with deep-linkable requirement headings. Opening a record needs JavaScript; the index, its counts, and every source path do not.
- The parser reports filesystem evidence, not the result of `openspec validate`.

## Research page contract

- `iris research <id>` creates `iris/research/<id>/index.md`; the Markdown file is the editable source and `page.html` is generated output.
- Front matter supports `title`, `status`, `tags`, `agent`, and `updated`; missing values fall back to the first heading, `draft`, or explicit `not set`, and malformed input warns per path instead of failing the render.
- Discovery is sorted, symlink-refusing, repository-confined, and bounded by file size and directory count; only `iris/research/` is read.
- Research records appear in the Work browser as type `research` and are covered by archive, publish, and export.

## Remaining risks and gates

Everything that remains is performed by the package owner outside this repository:

1. Publishing `@dgtalbug/iris` requires the owner to bootstrap the package on npm, configure `dgtalbug/iris` + `release.yml` as its trusted publisher, and approve the protected GitHub `npm` environment. The pipeline is otherwise complete and a manual dispatch exercises every step except the publish.
2. Branch protection on `main` is a repository setting, not a file in the tree.
3. Homebrew remains deferred until a published release supplies verifiable URL/checksum inputs. The canonical spec requires that no formula or manifest be shipped for a channel whose release inputs do not exist.

PNG/PDF export is a stated contract rather than a gate: the CLI refuses those modes and writes nothing until a deterministic browser-pinning policy is approved.
