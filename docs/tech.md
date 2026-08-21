# iris technical decisions

## Stack decisions (pinned)

- Node.js >=22.13 + TypeScript 5.9.2 strict ESM — modern runtime + deterministic tooling.
- Ajv 8.17.1 — strict JSON Schema validation with explicit errors.
- Vitest 3.2.4 + ESLint 9.34.0 + Prettier 3.6.2 — test and quality baseline.
- Mermaid 11.17.0 — pinned production dependency copied locally by `iris vendor`; never loaded from a CDN at view time.

## Data-contract design

Envelope schema plus per-type schemas; rendering is blocked on invalid contracts.

## Rendering model

Data in (`data.json`) to deterministic html out (`page.html`); dashboard is static file://-compatible HTML.

## OpenSpec filesystem model

Iris reads OpenSpec as bounded, untrusted local input without invoking the OpenSpec CLI. A sorted allowlisted walker recognizes `project.md`, `config.yaml`, canonical `specs/**/spec.md`, structured active/archive change artifacts and delta specs, and legacy archive Markdown. It preserves nested capability paths, refuses symlinks and escapes, caps depth/file count/file bytes/aggregate bytes, and isolates errors by path.

The parser extracts headings, requirements, scenarios, delta-operation labels, and task checkboxes outside fenced examples. A pinned generation-time `markdown-it` renderer converts Markdown to semantic HTML with embedded HTML, automatic linkification, unsafe destinations, and active images disabled; YAML is never interpreted. Exact `mermaid` fences emit escaped source-first diagram hosts. A pinned local classic script progressively renders each host independently with Mermaid strict security, click/HTML behavior disabled, fixed source/edge limits, and isolated failure. Every artifact retains bounded escaped source and actionable warnings, and Iris does not claim OpenSpec semantic validation.

`iris/spec.json` is a versioned deterministic generated snapshot with no timestamp. `iris init`, bare `iris render`, and `iris render --all` replace it atomically. Single-page render, report, archive, publish preparation, and update reuse the stored snapshot, so there is no watcher or hidden synchronization.

## Initialization and state model

`iris init` is the single setup and upgrade operation. Version 2 state stores only the page registry needed for active/archive navigation. Explicit `iris render <id>|--all` regenerates page HTML and the dashboard; there is no document mirroring, source monitoring, stale-source state, watcher, or background synchronization.

The initializer reads version 1 state only long enough to classify legacy active document mirrors. It removes an exact page directory only when safe path, state provenance, page identity, generated metadata, and both stored data hashes match the current bytes. Every mismatch and every archived record is preserved before state is normalized to version 2.

Agent instructions come from one packaged `templates/agents/iris-workspace.md` source. Generated skill files use versioned managed markers and a SHA-256 body digest. Intact managed regions update atomically; unmarked, malformed, edited, symlinked, or escaping targets are preserved and reported.

## Permalink algorithm

Reserved for M2/M3: derive host/org/repo from remote URL and emit commit-anchored blob links.

## Animation policy

Meaning-bearing only with reduced-motion fallback to static frame at frame zero.

## Distribution model

The built npm package is the primary, verified Node entrypoint on macOS, Linux, and Windows. It includes the canonical agent template, so initialization needs no network after installation. GitHub Release publication is automated through npm trusted publishing and provenance after the owner configures the external trust relationship. Homebrew remains deferred until a real release URL and checksum exist. Contributors use pnpm locally. The installed CLI has no server or telemetry, and rendering makes no network request.

`iris vendor` resolves Mermaid from the installed Iris dependency, checks the exact expected version, and atomically copies `mermaid.min.js` plus the upstream MIT license into `iris/design/vendor/`. Initialization writes a tiny inert placeholder at that script path so generated references remain valid before vendoring; it does not download or silently vendor the 3.4 MB bundle. Standalone publishing removes project-relative scripts and keeps Mermaid source fallback rather than embedding the runtime or claiming an SVG snapshot.

## License notes

MIT at package level; vendored third-party assets retain upstream licenses in vendor directory.

## Rejected alternatives

- MCP server: rejected for v1 local-file scope.
- Reaviz: rejected to avoid extra runtime weight and contract lock-in.
- IconScout primary icons: rejected (secondary only) to keep Lucide as default.
- SaaS dashboard: rejected to preserve offline local-first model.
- Bundling GitNexus: rejected because GitNexus remains external source-of-truth.
- Hand-written agent HTML: rejected in favor of strict contract-to-template flow.

## Decision log (append-only)

| date       | decision                                                                                                                             | why                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-18 | Start with Node22.13 + TS strict ESM and Ajv runtime validation                                                                      | Matches pnpm 11 requirements and keeps a modern runtime baseline                                                                                   |
| 2026-08-18 | Centralize design tokens and base components under `iris/design` scaffold                                                            | Enables deterministic file:// rendering and easy vendor/offline mode                                                                               |
| 2026-08-18 | Enforce token literals through token-lint script in CI                                                                               | Prevents style drift outside tokens.css                                                                                                            |
| 2026-08-18 | Keep OpenSpec milestone records under `openspec/changes/archive`                                                                     | Dogfoods lifecycle traceability from day zero                                                                                                      |
| 2026-08-19 | Preserve user-owned editor tasks while updating only iris-managed surfaces                                                           | Lifecycle updates must not clobber user content                                                                                                    |
| 2026-08-19 | Load base components as a classic deferred script instead of a module                                                                | Browsers CORS-block module scripts on file://, killing interactivity                                                                               |
| 2026-08-19 | Dashboard links every page; publish strips nav chrome via data-iris-nav                                                              | Local HTML must be navigable, published artifacts must stand alone                                                                                 |
| 2026-08-19 | Enforce generated-link integrity with html-check in CI                                                                               | A broken reference in generated HTML must fail the build                                                                                           |
| 2026-08-21 | Ship Aperture steps 1–3 with contrast-safe text aliases and no remote loaders                                                        | Preserves the specified palette, 4.5:1 readable text, and strict offline classic-script rendering while vendor/diagram/chart work remains deferred |
| 2026-08-21 | Make npm the primary install path and gate publication on an exact release tag, full checks, OIDC trusted publishing, and provenance | The cross-platform packed CLI is already verified; Homebrew lacks the release URL and checksum required for an honest formula                      |
| 2026-08-21 | Defer PNG/PDF export; prefer puppeteer-core only after accepting a browser-pinning and determinism policy                            | System Chrome avoids downloads but is not version-stable; Playwright's supported pinned browser adds a separate large download lifecycle           |
| 2026-08-21 | Make `iris init` the complete agent-first setup and upgrade operation                                                                | Removes document ingestion and hidden lifecycle coupling while shipping one canonical offline agent skill safely to three supported surfaces       |
| 2026-08-21 | Persist a bounded OpenSpec snapshot for the dashboard Spec tab                                                                       | Keeps explicit refresh semantics while allowing every dashboard regeneration to remain deterministic and offline                                   |
| 2026-08-21 | Render OpenSpec Markdown at generation time with embedded HTML disabled                                                              | Improves readability without adding browser runtime or weakening exact-source evidence                                                             |
| 2026-08-21 | Render exact Mermaid fences through an explicitly vendored strict classic runtime with source fallback                               | Adds useful offline diagrams without remote loaders, runtime modules, active diagram behavior, or all-or-nothing failure                           |
