# iris technical decisions

## Stack decisions (pinned)
- Node.js >=20 + TypeScript 5.9.2 strict ESM — modern runtime + deterministic tooling.
- Ajv 8.17.1 — strict JSON Schema validation with explicit errors.
- Vitest 3.2.4 + ESLint 9.34.0 + Prettier 3.6.2 — test and quality baseline.
- CDN constants centralized in `src/cdn.ts` — one source of truth for vendoring/template loads.

## Data-contract design
Envelope schema plus per-type schemas; rendering is blocked on invalid contracts.

## Rendering model
Data in (`data.json`) to deterministic html out (`page.html`); dashboard is static file://-compatible HTML.

## Sync algorithm
Reserved for M3: incremental git range parse, hotspot/co-change math, stale marking by scoped globs.

## Permalink algorithm
Reserved for M2/M3: derive host/org/repo from remote URL and emit commit-anchored blob links.

## Animation policy
Meaning-bearing only with reduced-motion fallback to static frame at frame zero.

## Distribution model
Global pnpm + local init; no server, no telemetry, no network at render time.

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
| date | decision | why |
|---|---|---|
| 2026-08-18 | Start with Node20 + TS strict ESM and Ajv runtime validation | Meets spec constraints while keeping runtime deps minimal |
| 2026-08-18 | Centralize design tokens and base components under `iris/design` scaffold | Enables deterministic file:// rendering and easy vendor/offline mode |
| 2026-08-18 | Enforce token literals through token-lint script in CI | Prevents style drift outside tokens.css |
| 2026-08-18 | Keep OpenSpec milestone records under `openspec/changes/archive` | Dogfoods lifecycle traceability from day zero |
