## Context

The product is designed around local rendering and static HTML output, but it still needs an explicit publish/export layer to support handoff, review, and offline sharing. The command contract already declares `publish` and `export`, so the implementation should focus on reliability, portability, and self-contained asset handling rather than broad feature expansion.

## Goals / Non-Goals

**Goals:**
- Produce a standalone artifact from a rendered page without requiring a live project checkout.
- Keep the output portable and safe for offline or external review.
- Support the export modes already documented in the CLI contract.
- Maintain local-first operating assumptions while enabling shareable files.

**Non-Goals:**
- Full remote publishing or hosted document management.
- Complex visual transformation beyond the already-supported render pipeline.
- A broad library ecosystem for export formats outside the documented project scope.

## Decisions

- Use the rendered page as the canonical source of truth and build the artifact from that data rather than from ad hoc DOM scraping.
- Prefer bundled local assets over remote CDN resources so published outputs remain offline-safe.
- Keep output paths explicit and deterministic for easier automation and review.
- Limit the first implementation to the export modes already declared in the project contract.

## Risks / Trade-offs

- [Large artifact size] → Mitigation: keep the single-file artifact focused on the page and bundled essentials rather than whole project files.
- [Asset dependency issues] → Mitigation: vendor critical CSS and font assets locally before export.
- [Renderer mismatch across formats] → Mitigation: keep export features narrow and validated against the known render pipeline.

## Migration Plan

1. Implement the publish pipeline for a single-file static artifact.
2. Add the export wrapper for alternate output modes and output path logic.
3. Integrate asset bundling and vendoring rules to keep the final artifact self-contained.
4. Validate the commands against real pages and regression examples.

## Open Questions

None at this stage; the output contract is already clearly scoped by the CLI docs and product goals.
