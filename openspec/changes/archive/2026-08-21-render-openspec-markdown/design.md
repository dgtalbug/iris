## Context

See `proposal.md` for motivation. The Spec browser currently stores bounded raw source in `iris/spec.json` and inserts an escaped copy into `<pre><code>`. Iris pages also have a deliberately tiny paragraph/list formatter, but it is not a CommonMark renderer and cannot represent OpenSpec document hierarchy. All output must remain deterministic, offline, classic-script compatible, and safe for untrusted repository content.

## Goals / Non-Goals

**Goals:**

- Render Markdown artifacts into semantic HTML during CLI generation.
- Make embedded HTML and unsafe links inert by construction.
- Retain exact escaped source and parser metadata for evidence/debugging.
- Style the generated document with Aperture tokens at 360 px, in both themes, reduced motion, and print.
- Keep package/install smoke proof representative of the new runtime dependency.

**Non-Goals:**

- Runtime Markdown rendering in the browser.
- Executing embedded HTML, JavaScript, directives, plugins, diagrams, or syntax highlighters.
- Interpreting YAML as Markdown.
- Fetching remote link targets, images, styles, fonts, or previews.
- Replacing the structural OpenSpec parser or snapshot format.

## Decisions

### 1. Use `markdown-it` at generation time with embedded HTML disabled

Add the pinned MIT-licensed `markdown-it` package and TypeScript declarations. Configure one renderer with `html: false`, `linkify: false`, and `typographer: false`. This supports the required document structures while making raw HTML text inert before template insertion. `marked` plus a sanitizer was rejected because it would require a second security dependency and a larger policy surface. Expanding Iris's tiny formatter was rejected because edge-complete Markdown parsing is mature-library work, not a charming weekend regex accident.

### 2. Apply an explicit output/link policy

Use the renderer's default URL normalization/validation and override link output only to add `rel="noopener noreferrer"`. Do not enable automatic URL linkification. Render all Markdown image syntax as escaped textual evidence (alt text plus source) rather than an active `<img>`, so neither remote nor unresolved relative references can initiate requests or break generated-file integrity. Tests must prove unsafe schemes do not become `href` or `src` attributes and generated output contains no new remote asset dependency.

The generated HTML returned by the configured renderer is trusted only as renderer output. Repository text must never bypass that renderer into an HTML context except through the existing escaping helper.

### 3. Separate rendered document and exact source

For Markdown document kinds, each artifact disclosure contains a `.spec-document` semantic rendering followed by a nested, collapsed `Source` disclosure with the escaped raw bytes. Config/YAML documents continue to use only the escaped source block. Parser warnings and requirement/scenario/operation summaries remain outside the rendered body.

This keeps the primary view readable while preserving auditable evidence and graceful fallback when Markdown is malformed.

### 4. Keep generated styling token-owned and bounded

Add styles for document headings, paragraphs, lists, task inputs, blockquotes, tables, links, and code using only Aperture tokens. Tables and code blocks scroll inside their container; long prose and URLs wrap without page-level horizontal overflow. Native controls and static content require no new animation, so reduced-motion behavior remains unchanged. Print styling avoids clipping source or document content.

### 5. Verify security at both helper and generated-dashboard boundaries

Add unit-visible fixtures containing the supported syntax plus embedded script/style/iframe/event-handler markup and unsafe links. Assert semantic output, escaped hostile HTML, rejected unsafe destinations, exact raw-source availability, no remote runtime references, and unchanged YAML literal behavior. Retain the full install smoke gate so the packed CLI proves the dependency ships correctly.

## Risks / Trade-offs

- [Markdown library behavior changes] → Pin exact versions, retain security regression fixtures, and review upgrades deliberately.
- [Rendered HTML enlarges the dashboard] → Source was already embedded; semantic markup adds bounded overhead under existing input limits.
- [Remote images create implicit requests] → Do not support remote image rendering in the Spec view; render their alt text/link evidence without an active remote `src`.
- [Malformed Markdown renders surprisingly] → Keep exact source and parser warnings available; never treat presentation as semantic validation.
- [CSS makes wide structures overflow] → Contain tables/code blocks locally and verify narrow-screen hooks.

## Migration Plan

1. Add and pin the parser dependency and declarations.
2. Introduce a focused safe Markdown renderer and unit/security tests.
3. Wire Markdown document kinds into the Spec artifact presentation while retaining YAML/source fallback.
4. Extend Aperture styles and generated-HTML assertions.
5. Update docs, regenerate dogfood through the built CLI, run full packaging/OpenSpec gates, sync, and archive.

Rollback removes the dependency and renderer integration, then regenerates `iris/` with the prior raw-only template. The snapshot format and repository-owned OpenSpec inputs do not change.
