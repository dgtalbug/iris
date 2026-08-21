## Context

The generation-time Markdown renderer currently escapes HTML and active images, rejects unsafe links, and emits ordinary fences as `<pre><code>`. Generated pages load one local classic deferred script and work directly from `file://`. The CLI already creates `iris/design/vendor/`, registers a stubbed `iris vendor` command, and documents Mermaid as a later local-only enhancement. See `proposal.md` for motivation and the two delta specs for observable behavior.

Mermaid's browser runtime is necessarily client-side if Iris is to avoid a browser automation dependency. Diagram source is untrusted repository input, so the integration must preserve the Markdown renderer's existing trust boundary and must not treat successful JavaScript execution as the only readable state.

## Goals / Non-Goals

**Goals:**

- Add one safe Markdown extension for exact `mermaid` fences.
- Keep source-first no-JS behavior, per-diagram failure isolation, and deterministic generated markup.
- Install a pinned Mermaid classic browser bundle from Iris's already installed dependency, without a second network operation.
- Use the same behavior in contract Markdown and OpenSpec Markdown.

**Non-Goals:**

- Rendering diagrams to SVG during CLI generation or embedding SVG snapshots in standalone exports.
- Supporting remote Mermaid loaders, ES modules at view time, click interactions, HTML labels, custom icons, external images, arbitrary plugins, or theme directives that weaken global security configuration.
- Replacing fenced source with a diagram-only representation.

## Decisions

### Extend the existing Markdown renderer at the fence rule

The `markdown-it` fence renderer will delegate all non-Mermaid fences to its existing default and emit a semantic figure for exact normalized `mermaid` info strings. The figure contains a dedicated runtime host plus an always-present escaped `<pre><code>` fallback. This keeps escaping centralized and makes no-JS output complete.

Alternative considered: preprocess Markdown with regular expressions. Rejected because fence parsing, nesting, and escaping already belong to the Markdown parser; duplicating them would create divergent edge cases.

### Use a pinned runtime dependency and explicit offline vendoring

Mermaid will be pinned as a production dependency. `iris vendor` will resolve the installed package, verify the expected browser bundle and license, then atomically copy those bytes into `iris/design/vendor/`. It will not download from the CDN. Generated pages may reference only that relative classic-script path.

Alternative considered: load the documented CDN ESM build. Rejected because it violates `file://`, offline, no-network, and no-runtime-module constraints. A CLI-side SVG renderer was also rejected for this slice because it would introduce DOM/browser emulation or headless-browser policy that the project has explicitly deferred.

### Initialize once, then render one node at a time

The shared base script will call `mermaid.initialize` once with `startOnLoad: false`, `securityLevel: 'strict'`, `htmlLabels: false`, fixed text/edge bounds, suppressed built-in error SVGs, and a system font stack. It will then await `mermaid.run({ nodes: [node], suppressErrors: true })` separately for every host. Success hides only that host's fallback and adds accessible SVG metadata; rejection marks only that figure as failed and leaves its source visible.

This follows Mermaid's current official security contract: strict mode encodes HTML and disables click behavior, secure configuration keys prevent diagram directives from weakening core limits, and `run` supports explicit node arrays. Theme-specific color remapping is deferred; Mermaid's neutral theme will sit on Iris surfaces in both themes while source remains authoritative.

Alternative considered: render all nodes in one `run` call. Rejected because a single invalid diagram can make failure attribution and fallback state ambiguous.

### Treat contract fields and OpenSpec artifacts as one Markdown surface

Contract section Markdown will use `renderSafeMarkdown` instead of its small parallel paragraph/list converter. This avoids implementing Mermaid twice and brings the same embedded-HTML/link/image protections to both inputs. Exact OpenSpec source disclosure remains unchanged.

### Keep standalone publishing source-safe

Published single-file contract pages will remove external Mermaid and base-script tags as they already do for local shared assets. The embedded diagram source fallback remains visible; runtime SVG snapshotting remains out of scope until Iris adopts a deterministic browser renderer.

## Risks / Trade-offs

- [The full Mermaid bundle materially increases installed dependency and per-workspace size] → Keep installation explicit through `iris vendor`, pin the version, copy one minified browser file plus its license, and document the size.
- [Mermaid is a large untrusted-input parser with its own security history] → Pin exact versions, use strict mode and secure bounds, disable interactions/HTML labels, retain source fallback, and include dependency/security review in upgrades.
- [Theme changes after rendering do not recolor an existing SVG] → Use a neutral, surface-compatible first implementation and retain accessible source; theme-aware rerendering can be a later independently specified enhancement.
- [A missing vendor file produces a local resource load error] → The base script detects the absent global, keeps all fallbacks visible, and reports a concise local status in each figure.
- [Standalone artifacts do not include rendered SVG] → Preserve the escaped source honestly; do not embed a multi-megabyte runtime or claim visual standalone diagrams without snapshot evidence.

## Migration Plan

1. Add the pinned dependency and the idempotent local vendor command.
2. Extend safe Markdown output, styles, base script initialization, templates, and standalone stripping.
3. Add unit, CLI, HTML integrity, malicious-input, multiple-diagram, offline, and packaging tests.
4. Update authoring/technical documentation, run `iris vendor`, then regenerate checked-in Iris output with `iris render --all`.

Rollback removes the Mermaid fence override, vendor command implementation, script references, dependency, and generated vendor files; existing Markdown remains ordinary fenced code with no data migration.
