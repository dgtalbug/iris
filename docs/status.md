# iris status report

> Snapshot date: 2026-08-21 · branch `feat/render-openspec-markdown` · offline Mermaid fence rendering is implemented locally under the active `render-mermaid-diagrams` change.

## One-line summary

Iris is an agent-first local visual workspace whose dashboard now has peer Work and `Spec` views: intentional Iris pages remain separate from a bounded, deterministic visualization of the repository's actual OpenSpec filesystem.

## Current implementation

| Area                      | State                                                                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commands implemented      | `init`, `render`, `report` (including `--from-session`), `publish`, `feature`, `bug`, `idea`, `plan`, `archive`, `export --single`, `vendor`, `open`, `update`                                            |
| Commands stubbed (exit 1) | `promote`                                                                                                                                                                                                 |
| Dashboard                 | Work plus top-level `Spec`; classic deferred scripts, both themes, reduced-motion fallback, visible focus, and 360 px layout                                                                              |
| OpenSpec inputs           | Project/config, canonical specs, structured active/archive changes, proposal/design/tasks, change-local delta specs, and legacy archive Markdown                                                          |
| OpenSpec snapshot         | Versioned `iris/spec.json`; refreshed by init/full render only, with independent lifecycle/completeness/task/parser-health dimensions and Markdown/YAML presentation identity                             |
| Agent surfaces            | `.agents/skills/iris-workspace`, `.claude/skills/iris-workspace`, `.github/skills/iris-workspace`, generated from one packaged template                                                                   |
| State                     | Version 2 page registry with active/archive navigation; no adopted-source hashes or stale-source states                                                                                                   |
| Tests                     | 18 Vitest suites (79 tests) plus lint, token, type, HTML, packaging, installed-smoke, and strict OpenSpec gates                                                                                           |
| Runtime dependencies      | `ajv`, generation-time `markdown-it`, and pinned Mermaid copied by explicit offline vendoring; no frontend framework, browser Markdown parser, server, watcher, telemetry, or OpenSpec runtime dependency |

## OpenSpec browser contract

- `iris init`, bare `iris render`, and `iris render --all` atomically regenerate `iris/spec.json` from current files.
- Page-specific render, report, archive, publish preparation, and update reuse the prior snapshot and do not read OpenSpec implicitly.
- Traversal is sorted, allowlisted, repository-confined, symlink-refusing, and bounded by depth, supported file count, individual bytes, and aggregate bytes.
- Task progress comes only from Markdown list checkboxes outside fenced code. Archive names never imply completion.
- Nested capability paths and ADDED/MODIFIED/REMOVED/RENAMED labels are preserved.
- Raw content is escaped. Malformed, partial, unknown, oversized, unsafe, or unreadable inputs produce isolated path-specific warnings while valid siblings remain visible.
- Markdown artifacts render semantically with embedded HTML, unsafe destinations, and active images disabled; exact Mermaid fences progressively render one at a time under strict local settings while diagram and document source remain available, and YAML stays literal.
- The parser reports filesystem evidence, not the result of `openspec validate`.

## Remaining risks and gates

1. Mermaid runtime/browser dogfood, local gates, OpenSpec verification, spec sync, archive, hosted PR checks, and merge remain pending for the active change.
2. Public npm release still requires package-owner bootstrap, trusted-publisher configuration, and the protected GitHub `npm` environment.
3. PNG/PDF export remains unavailable until a deterministic browser-pinning policy is approved.
4. Homebrew remains deferred until a published release supplies verifiable URL/checksum inputs.
5. Repository governance files and branch-protection policy remain incomplete.
