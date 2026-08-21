## ADDED Requirements

### Requirement: safe semantic Markdown presentation
The system MUST present Markdown OpenSpec documents as semantic HTML for reading, MUST keep the exact escaped source available as a secondary disclosure, and MUST keep non-Markdown configuration artifacts in a literal code presentation.

#### Scenario: supported Markdown structures are present
- **WHEN** an OpenSpec Markdown artifact contains headings, paragraphs, emphasis, links, lists, task lists, blockquotes, tables, inline code, or fenced code
- **THEN** the Spec view MUST render those structures with readable semantic markup rather than displaying Markdown punctuation as the primary presentation

#### Scenario: user needs exact source evidence
- **WHEN** a rendered Markdown artifact is displayed
- **THEN** the user MUST be able to reveal the exact escaped source without leaving the dashboard

#### Scenario: configuration artifact is displayed
- **WHEN** the Spec view presents an OpenSpec YAML manifest or workspace configuration
- **THEN** the artifact MUST remain escaped literal code and MUST NOT be interpreted as Markdown

### Requirement: inert Markdown generation
The system MUST generate Markdown presentation without allowing repository content to inject active HTML, unsafe URL schemes, browser runtime dependencies, or implicit network requests.

#### Scenario: Markdown contains embedded HTML
- **WHEN** an artifact contains an HTML element, event handler, script, iframe, style, or other executable-looking markup
- **THEN** the generated document MUST display that input as inert text and MUST NOT add it as an active DOM element

#### Scenario: Markdown contains an unsafe link
- **WHEN** a Markdown link uses an unsafe scheme such as `javascript:` or `data:`
- **THEN** the generated document MUST not emit a navigable link for that destination

#### Scenario: dashboard opens offline
- **WHEN** a user opens the generated dashboard through `file://`
- **THEN** rendered Markdown MUST remain readable without loading a Markdown library, module, stylesheet, font, script, or other asset from the network
