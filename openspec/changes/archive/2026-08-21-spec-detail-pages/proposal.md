## Why

`iris/spec.html` is 640 KB — 45 times the next-largest generated page — because it renders every canonical spec and every change artifact inline, each one twice: as semantic Markdown and again as its escaped exact source. Escaped source alone is 40% of the page. The whole page carries four `id` attributes, so a capability with 8 requirements and 23 scenarios cannot be linked to at all, while a research page of a fraction the size gets generated heading ids and a table of contents. The previous change relocated the Spec view without restructuring it, so the section that holds most of the workspace's bytes is the one that never had an information-design pass.

## What Changes

- Turn `iris/spec.html` into a light index: the existing summary strip plus compact tables for canonical specs, active changes, and the archive, each row carrying its real counts, health, and task progress and linking to a detail page.
- Generate one detail page per canonical spec at `iris/spec/capabilities/<capability-path>/page.html` with a requirement-level table of contents, deep-linkable requirement and scenario headings, and the exact source retained in a disclosure.
- Generate one detail page per change at `iris/spec/changes/<change-name>/page.html` covering manifest, proposal, design, tasks with progress, and each delta spec, with per-artifact heading namespaces so ids cannot collide.
- Give the safe Markdown renderer an optional heading-id prefix so several documents can share one page without colliding anchors.
- Keep every existing guarantee: bounded parsing, escaped exact source, inert hostile content, literal YAML, path-specific warnings, offline `file://` rendering, and no claim of OpenSpec semantic validation.

## Capabilities

### Modified Capabilities

- `openspec-spec-browser`: the safe Markdown presentation requirement gains per-document heading identity and detail-page navigation obligations; a new requirement covers the index-plus-detail page structure.
- `aperture-design-system`: the workspace hierarchy requirement changes because Spec becomes an index over generated detail pages rather than one page holding every artifact body.

## Impact

- New `src/templates/pages/spec-detail.ts`; `pages/spec.ts` becomes the index; `workspace.ts` and `render.ts` emit the detail pages; `markdown.ts` gains the id-prefix option.
- `html-check` covers many more generated references; `openspec-browser` tests move their artifact-body assertions to the detail pages.
- Expected result: `spec.html` drops from ~640 KB to roughly the size of the other section pages, with the artifact bodies distributed across detail pages that are only read when opened.
- No new dependency, network access, schema change, or CLI command.
