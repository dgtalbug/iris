## Why

Iris renders Markdown semantically but leaves Mermaid fences as inert code, so architecture and workflow diagrams cannot be inspected visually in the offline workspace. Mermaid support should preserve Iris's safe-source evidence and `file://` contract instead of introducing a network loader or allowing diagram failures to break an entire document.

## What Changes

- Recognize fenced Markdown blocks whose language is exactly `mermaid` and emit an accessible diagram host with an escaped-source fallback.
- Render each diagram independently in the browser from a locally installed, pinned Mermaid asset; make invalid diagrams fail locally while leaving their source readable.
- Make the local Mermaid runtime available through the existing `iris vendor` lifecycle command and keep generated pages free of remote requests and runtime modules.
- Document and test the Markdown authoring, offline asset, security, fallback, theme, and standalone-publish boundaries.

## Capabilities

### New Capabilities

- `markdown-diagram-rendering`: Safe, offline rendering and fallback behavior for Mermaid fences embedded in Iris Markdown.

### Modified Capabilities

- `openspec-spec-browser`: OpenSpec Markdown artifacts may progressively render recognized Mermaid fences while preserving exact source and inert untrusted content.

## Impact

- Affects `src/lib/markdown.ts`, static page templates and client script, CLI lifecycle handling, generated design assets, tests, and rendering documentation.
- Adds Mermaid as a pinned runtime dependency whose browser bundle and license are copied into each Iris workspace on explicit vendoring.
- Does not enable embedded HTML, remote assets, arbitrary Markdown plugins, or server-side/browser automation.
