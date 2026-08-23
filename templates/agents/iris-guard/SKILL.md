# Iris guard

The authoring-time provenance guard. Everything an agent writes into an Iris workspace — page sources, project docs, research drafts, contract prose, diagram labels — is an Iris artifact in Iris's own voice. Run this self-check against every draft before `iris render`.

## The rules, in order

1. **Everything written into the workspace is an Iris artifact in Iris's own voice.** No external tool, framework, library, service, or design-system names in titles, prose, tables, callouts, footnotes, or diagram labels. The page describes the user's system, not the tools that built the page.
2. **The design language is Iris Electric, full stop.** Never name an upstream, inspiration, or third-party design language; there is nothing to credit inside a generated page.
3. **If you are unsure whether a name is allowed, it is not.** Describe the capability, not the source: "the vendored diagram runtime", "the generated icon set", "the workspace renderer".
4. **Before `iris render`, grep the draft for the denylist below and fix what you find.** A hit is rewritten in Iris's voice or removed; it is never shipped and never argued through.

## The self-check

From the repository root, scan every source you drafted or edited:

```bash
grep -rniE 'deepwiki|mintlify|backstage|gitbook|docusaurus|starlight|swimm|vision[ -]?electric|electra|shadcn|react[ -]?flow|chart\.js|echarts|\bd3\b|highlight\.js|font[ -]?awesome|heroicons|lucide|claude|copilot|cursor|gemini|codex|openai|anthropic|chatgpt|gpt-?[0-9]' iris/project iris/research iris/pages
```

- Any hit in prose, a heading, a table, a callout, or a diagram label: rewrite it in Iris's voice and grep again until the output is empty.
- Legitimate syntax is exempt: the ` ```mermaid ` fence tag, file paths, and the vendored runtime's own filenames are how the workspace works, not prose.
- When a hit looks legitimate and is not on that list, rule 3 still applies: describe the capability, not the source.

The CLI runs the same denylist in its own provenance scan after init and on `render --all`; a draft that passes this self-check passes that scan, and a page that would fail it never renders.
