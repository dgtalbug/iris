# iris technical decisions

## Stack decisions (pinned)

- Node.js >=22.13 + TypeScript 5.9.2 strict ESM — modern runtime + deterministic tooling.
- Ajv 8.17.1 — strict JSON Schema validation with explicit errors.
- Vitest 3.2.4 + ESLint 9.34.0 + Prettier 3.6.2 — test and quality baseline.
- CDN constants centralized in `src/cdn.ts` — one source of truth for vendoring/template loads.

## Data-contract design

Envelope schema plus per-type schemas; rendering is blocked on invalid contracts.

## Rendering model

Data in (`data.json`) to deterministic html out (`page.html`); dashboard is static file://-compatible HTML.

## Sync algorithm

The lifecycle registry stores SHA-256 hashes for page contracts and adopted markdown sources. Sync re-renders changed page contracts, marks changed or removed adopted sources stale, and skips unchanged pages. Re-running adopt explicitly refreshes a stale mirror.

## Permalink algorithm

Reserved for M2/M3: derive host/org/repo from remote URL and emit commit-anchored blob links.

## Animation policy

Meaning-bearing only with reduced-motion fallback to static frame at frame zero.

## Distribution model

The built npm package is the verified Node entrypoint; public npm and Homebrew distribution remain pending a release URL and checksum. Contributors use pnpm locally. The installed CLI has no server or telemetry, and rendering makes no network request.

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

| date       | decision                                                                   | why                                                                  |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 2026-08-18 | Start with Node22.13 + TS strict ESM and Ajv runtime validation            | Matches pnpm 11 requirements and keeps a modern runtime baseline     |
| 2026-08-18 | Centralize design tokens and base components under `iris/design` scaffold  | Enables deterministic file:// rendering and easy vendor/offline mode |
| 2026-08-18 | Enforce token literals through token-lint script in CI                     | Prevents style drift outside tokens.css                              |
| 2026-08-18 | Keep OpenSpec milestone records under `openspec/changes/archive`           | Dogfoods lifecycle traceability from day zero                        |
| 2026-08-19 | Preserve user-owned editor tasks while updating only iris-managed surfaces | Lifecycle updates must not clobber user content                      |
| 2026-08-19 | Load base components as a classic deferred script instead of a module      | Browsers CORS-block module scripts on file://, killing interactivity |
| 2026-08-19 | Dashboard links every page; publish strips nav chrome via data-iris-nav    | Local HTML must be navigable, published artifacts must stand alone   |
| 2026-08-19 | Enforce generated-link integrity with html-check in CI                     | A broken reference in generated HTML must fail the build             |
| 2026-08-21 | Ship Aperture steps 1–3 with contrast-safe text aliases and no remote loaders | Preserves the specified palette, 4.5:1 readable text, and strict offline classic-script rendering while vendor/diagram/chart work remains deferred |
