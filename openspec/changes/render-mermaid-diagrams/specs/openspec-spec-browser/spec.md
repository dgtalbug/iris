## MODIFIED Requirements

### Requirement: safe semantic Markdown presentation

The system MUST present Markdown OpenSpec documents as semantic HTML for reading, MUST progressively render fenced blocks labeled exactly `mermaid` as safe offline diagrams with escaped-source fallback, MUST keep the exact escaped document source available as a secondary disclosure, and MUST keep non-Markdown configuration artifacts in a literal code presentation.

#### Scenario: supported Markdown structures are present

- **WHEN** an OpenSpec Markdown artifact contains headings, paragraphs, emphasis, links, lists, task lists, blockquotes, tables, inline code, fenced code, or Mermaid fences
- **THEN** the Spec view MUST render those structures with readable semantic markup, progressively enhance Mermaid fences when the local runtime is available, and preserve escaped fallback source rather than displaying Markdown punctuation as the primary presentation

#### Scenario: user needs exact source evidence

- **WHEN** a rendered Markdown artifact is displayed
- **THEN** the user MUST be able to reveal the exact escaped source without leaving the dashboard

#### Scenario: configuration artifact is displayed

- **WHEN** the Spec view presents an OpenSpec YAML manifest or workspace configuration
- **THEN** the artifact MUST remain escaped literal code and MUST NOT be interpreted as Markdown or submitted to the diagram runtime

### Requirement: inert Markdown generation

The system MUST generate Markdown presentation without allowing repository content or Mermaid diagram source to inject active HTML, unsafe URL schemes, executable click behavior, runtime modules, or implicit network requests.

#### Scenario: Markdown contains embedded HTML

- **WHEN** an artifact contains an HTML element, event handler, script, iframe, style, or other executable-looking markup outside or inside a Mermaid fence
- **THEN** the generated document MUST keep that input inert and MUST NOT add it as executable DOM content

#### Scenario: Markdown contains an unsafe link

- **WHEN** a Markdown link or Mermaid interaction uses an unsafe scheme such as `javascript:` or `data:`
- **THEN** the generated document MUST not emit a navigable link or executable interaction for that destination

#### Scenario: dashboard opens offline

- **WHEN** a user opens the generated dashboard through `file://`
- **THEN** rendered Markdown and diagram fallbacks MUST remain readable without loading a Markdown library, module, stylesheet, font, script, or other asset from the network
