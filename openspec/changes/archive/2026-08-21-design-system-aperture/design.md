## Context

The generated HTML already uses a token stylesheet, a shared base stylesheet, and one classic deferred script. The redesign must preserve those boundaries, work from `file://`, and regenerate the checked-in `iris/` dogfood output from source templates rather than editing output by hand.

## Goals / Non-Goals

**Goals:**
- Make dark theme the source palette and derive a contrast-safe light theme.
- Keep every generated CSS literal in the token stylesheet and strengthen validation around the expanded contract.
- Establish the Aperture component vocabulary and newcomer-first dashboard sequence without changing page contracts.
- Preserve deterministic markup, keyboard behavior, reduced-motion fallback, and narrow-screen usability.

**Non-Goals:**
- Implement `iris vendor`, load tier-1 fonts, or introduce third-party assets.
- Add Mermaid execution, diagram snapshots, chart contracts, or chart renderers.
- Add a browser renderer or change PNG/PDF export behavior.

## Decisions

- Keep `src/templates/design.ts` as the sole source for generated tokens, component CSS/JS, and HTML. This preserves the current generator contract and avoids a second styling pipeline.
- Expand token lint with a declared-token reference pass plus explicit WCAG contrast pairs for both themes. A generic CSS engine would add disproportionate dependency and maintenance cost for a fixed token contract.
- Render the architecture area as a semantic placeholder that names `iris vendor` and the later diagram workflow. Fabricating a diagram would blur the intentionally deferred step 4–5 boundary.
- Derive briefing copy from deterministic local project metadata and adopted README presence; use an instructional fallback when no adopted source exists. No prose generation or network access is introduced.
- Use CSS transforms only for the one-time aperture opening cue, with segments already visible in the reduced-motion static frame. All routine transitions use motion tokens.
- Keep `/` and `t` in the existing classic script, and represent their shortcuts with visible `kbd` hints. No module script or framework is introduced.

## Risks / Trade-offs

- [Fixed contrast-pair validation can miss future component combinations] → Validate every foreground/background pairing introduced by this change and require new pairs to be registered alongside new tokens.
- [Dashboard briefing has limited source data] → Prefer explicit local metadata and command-specific empty states over inferred prose.
- [Generated dogfood drift] → Re-run the source CLI against this repository and retain HTML/link/token checks in the phase gate.
- [Animation obscures content] → Keep the ring readable at frame zero and disable animation/transitions under reduced motion.

## Migration Plan

1. Replace generated token values and extend token validation.
2. Replace generated component styles/markup and preserve existing interactions.
3. Reorder dashboard markup and add deterministic briefing/health/architecture content.
4. Regenerate checked-in dogfood output and run the full phase gate.
5. Roll back by reverting the phase commit; page contracts and state remain compatible.
