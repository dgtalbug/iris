## 1. Offline Runtime

- [x] 1.1 Add and lock the pinned Mermaid production dependency, including its runtime rationale.
- [x] 1.2 Implement idempotent `iris vendor` copying of the classic browser bundle and upstream license with actionable precondition and asset errors.
- [x] 1.3 Add CLI, package, and offline asset tests for successful vendoring, refresh, missing workspace, and installed artifact contents.

## 2. Markdown and Browser Rendering

- [x] 2.1 Extend the safe Markdown renderer so exact Mermaid fences emit escaped, accessible diagram hosts while other fences remain literal code.
- [x] 2.2 Use the safe Markdown renderer for contract Markdown fields and load only relative classic Mermaid assets from generated HTML.
- [x] 2.3 Add isolated Mermaid initialization, strict security and complexity configuration, success accessibility, missing-runtime fallback, and per-diagram error handling to the shared base script.
- [x] 2.4 Add responsive, theme-compatible, print-safe diagram and fallback styles without page-level overflow.
- [x] 2.5 Keep standalone publish/export artifacts self-contained by removing the local runtime reference and retaining diagram source fallback.

## 3. Verification and Documentation

- [x] 3.1 Add renderer, OpenSpec dashboard, hostile-input, multiple-diagram, invalid-diagram, accessibility, offline, and HTML-integrity coverage.
- [x] 3.2 Update README, command, technical, design-system, status, and dependency documentation for the implemented authoring and fallback contract.
- [x] 3.3 Validate the OpenSpec change strictly and run focused tests followed by the repository release checks.
- [x] 3.4 Vendor Mermaid locally, regenerate managed Iris output, and verify generated HTML and assets without modifying unrelated user-owned files.
