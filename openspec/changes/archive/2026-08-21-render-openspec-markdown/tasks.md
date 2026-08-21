## 1. Add the safe generation-time renderer

- [x] 1.1 Pin `markdown-it` and its TypeScript declarations, record the runtime rationale, and refresh the lockfile.
- [x] 1.2 Add a focused renderer module with embedded HTML, automatic linkification, typographic rewriting, unsafe destinations, and active remote images disabled.
- [x] 1.3 Add renderer tests for supported Markdown structure, inert HTML, safe/unsafe links, local and remote image policy, deterministic output, and exact source independence.

## 2. Integrate semantic artifact presentation

- [x] 2.1 Distinguish Markdown documents from YAML/config documents in the normalized source model without changing snapshot compatibility.
- [x] 2.2 Render Markdown as the primary artifact body, preserve parser summaries, and add a nested exact-source disclosure while keeping YAML literal-only.
- [x] 2.3 Extend Aperture token-owned styles for prose, task lists, blockquotes, tables, links, inline/fenced code, nested source, narrow screens, both themes, and print.

## 3. Prove generated safety and usability

- [x] 3.1 Extend fixtures with representative CommonMark/GFM-style structures plus script, iframe, event-handler, unsafe-link, and remote-image payloads.
- [x] 3.2 Extend generated-dashboard tests for semantic markup, inert hostile content, rejected unsafe/remote destinations, exact source, YAML literal behavior, offline assets, and classic deferred scripts.
- [x] 3.3 Run focused parser/template/navigation tests and resolve any regression in Work/Spec interaction or file-link integrity.

## 4. Document, dogfood, and verify

- [x] 4.1 Update dependency rationale, user commands, technical/design/status docs, and the installed Iris skill for rendered Markdown and source fallback behavior.
- [x] 4.2 Build the CLI and regenerate `iris/spec.json`, managed assets, and the dashboard through `iris init` and `iris render --all`; inspect the generated presentation without hand edits.
- [x] 4.3 Run lint, token lint, typecheck, the full test suite, HTML integrity, packed-install smoke, strict OpenSpec validation, and the verification workflow before spec sync/archive.
