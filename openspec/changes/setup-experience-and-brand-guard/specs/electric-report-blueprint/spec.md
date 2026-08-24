## ADDED Requirements

### Requirement: ten-section report blueprint
Research and project pages MUST be authored against a fixed ten-section
blueprint whose headings map to stable section ids, with the renderer building
navigation and omitting empty sections.

#### Scenario: research scaffold uses the blueprint
- **WHEN** a research page is scaffolded
- **THEN** it MUST contain the ten fixed sections as Markdown headings that the
  renderer maps to stable section ids

#### Scenario: empty sections are omitted
- **WHEN** a section has no content
- **THEN** the renderer MUST omit it from the table of contents and page

### Requirement: Electric Markdown components
The system MUST provide a Markdown container and fence layer that compiles
callouts, evidence citations, steps, timelines, file trees, flows, details,
meters, footnotes, and confidence badges to existing token-only CSS classes.

#### Scenario: components use design tokens only
- **WHEN** an Electric component is rendered
- **THEN** it MUST compile to existing token-based classes with no new color
  literals, so token lint and contrast validation keep passing

#### Scenario: evidence citations carry source lines
- **WHEN** an evidence component is authored with a file and line
- **THEN** it MUST render the source reference in monospace

### Requirement: additive blueprint on contract pages
Bug, feature, idea, plan, and report schemas MUST accept an optional
`sections.blueprint` object whose keys are a subset of the ten section ids,
rendered as narrative sections above the existing typed widgets.

#### Scenario: blueprint present
- **WHEN** a contract page includes `sections.blueprint`
- **THEN** the renderer MUST compose the narrative sections above the existing
  typed widgets

#### Scenario: blueprint absent
- **WHEN** a contract page omits `sections.blueprint`
- **THEN** the renderer MUST render the page exactly as before, preserving
  backward compatibility

### Requirement: offline deterministic charts
Charts MUST be rendered as CLI-generated inline SVG rather than a network-loaded
charting library, preserving the no-CDN, offline, `file://` contract.

#### Scenario: chart renders offline
- **WHEN** a report declares chart data
- **THEN** the renderer MUST emit inline SVG using fixed token-order series
  colors with no network reference
