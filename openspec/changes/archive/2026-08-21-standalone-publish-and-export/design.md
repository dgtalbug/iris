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
- Keep PNG/PDF unavailable in this change after evaluating the current browser-renderer options. The existing explicit exit-code-1 path remains the honest contract; task 2.2 stays unchecked.
- Prefer `puppeteer-core` over Playwright if a later change relaxes the renderer constraint. `puppeteer-core` 25.8.0 does not download Chrome and can use an explicit system executable or installed channel, so it has the smaller operational surface for a single Chrome screenshot/PDF job. Its documented trade-off is decisive here: compatibility is only guaranteed with Puppeteer's bundled browser, not arbitrary system Chrome, so output cannot be treated as stable across browser updates and machines.
- Do not adopt Playwright 1.62.1 for this narrow export job. Playwright no longer downloads browsers during package installation, but its supported deterministic path still requires `playwright install`, a version-coupled browser lifecycle, and a browser cache measured in hundreds of megabytes. Its cross-browser features do not offset that operational cost for two export modes.
- Any future implementation must use a fresh temporary browser profile, abort non-`file:`/`data:`/`blob:` requests, disable background networking, and define whether determinism means byte-identical output or a pinned visual baseline. That policy decision belongs in a new renderer change before adding a dependency.

## Risks / Trade-offs

- [Large artifact size] → Mitigation: keep the single-file artifact focused on the page and bundled essentials rather than whole project files.
- [Asset dependency issues] → Mitigation: vendor critical CSS and font assets locally before export.
- [Renderer mismatch across formats] → Mitigation: keep export features narrow and validated against the known render pipeline.
- [System-browser drift] → Mitigation: defer browser export until the project chooses between a pinned downloaded browser and explicitly non-byte-stable system Chrome output.
- [Hidden browser networking] → Mitigation: require request interception and background-network suppression in any future renderer implementation.

## Migration Plan

1. Implement the publish pipeline for a single-file static artifact.
2. Keep PNG/PDF on the explicit unsupported path until the browser pinning and determinism policy is accepted.
3. Integrate asset bundling and vendoring rules to keep the final artifact self-contained.
4. Validate the commands against real pages and regression examples.

## Open Questions

Can a future renderer download and pin Chromium as an explicit optional install, or must it rely on a user-managed browser and accept cross-version output drift? This must be resolved before task 2.2 can be implemented honestly.
