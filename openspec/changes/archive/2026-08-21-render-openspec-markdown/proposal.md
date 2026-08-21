## Why

The Spec browser currently presents every OpenSpec artifact as escaped source, which is safe but forces users to read Markdown syntax instead of the document hierarchy it describes. Iris should render Markdown as semantic offline HTML while preserving the existing untrusted-content boundary and an exact raw-source fallback.

## What Changes

- Render Markdown OpenSpec artifacts with headings, paragraphs, lists, task lists, links, blockquotes, tables, and fenced code at generation time.
- Disable embedded HTML and unsafe URL schemes so repository content cannot become executable markup or trigger remote requests implicitly.
- Keep YAML manifests as escaped code and retain a collapsed raw-source disclosure for every document.
- Style rendered documents through the existing Aperture token contract and cover readable light/dark, reduced-motion, narrow-screen, and print-safe behavior.
- Add dependency, packaging, security, snapshot, and generated-HTML tests for the renderer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec-spec-browser`: Replace raw-only Markdown presentation with safe semantic rendering while retaining exact source fallback and offline independence.

## Impact

- Affects the dashboard template, generated Aperture CSS, OpenSpec browser tests/fixtures, package dependencies and lockfile, dogfood output, and documentation.
- Adds `markdown-it` as an installed generation-time dependency plus its TypeScript declarations for development.
- Does not add browser runtime code, a server, network access, background processing, or Markdown execution.
