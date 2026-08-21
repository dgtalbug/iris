## Context

The repo already enforces strict contract envelopes and a tokenized dashboard model. The missing layer is a typed registry that maps each page contract to a fixed template and a distribution path that turns rendered output into shareable local artifacts. This change keeps the existing local-first model while adding predictable render logic and portable export flows.

## Goals / Non-Goals

**Goals:**
- Define a contract-to-template registry for the supported page types.
- Validate all contract inputs before render output is written.
- Keep generated pages deterministic and visually consistent with the existing design tokens.
- Add local publish/export and session-based report workflows.

**Non-Goals:**
- Remote rendering or hosted publishing.
- Authenticated user accounts or SaaS features.
- A broad platform rewrite beyond the render/distribution slice.

## Decisions

- Registry-first rendering: each supported contract type resolves through a single canonical template entry. This keeps the render path explicit and easy to test.
- Validation as a hard gate: rendering starts only after a contract passes schema validation. This prevents partial HTML and keeps error handling deterministic.
- Static artifact output: publish/export generates a portable local artifact rather than a server-backed asset. This preserves the repo's offline-first design philosophy.
- Session extraction stays local and structured: report generation should operate on structured local session data and then re-enter the normal validation/render pipeline instead of bypassing it.

## Risks / Trade-offs

- [Template drift] → Mitigation: keep each template tied to a fixed contract shape and add render tests for every supported type.
- [Publish complexity] → Mitigation: prefer a narrow single-file static artifact path over a broader remote distribution platform.
- [Session ingest ambiguity] → Mitigation: normalize to the report contract schema early and reject malformed input before generation.

## Migration Plan

1. Add the template registry and map contract types to their rendering templates.
2. Wire the render CLI to validate contracts before writing HTML output.
3. Add local publish/export and session report generation behind the same validation model.
4. Update docs and validation fixtures to cover the new contract-to-template flow.

## Open Questions

None at this stage; the chosen approach is narrow and grounded in the existing CLI and schema contracts.
