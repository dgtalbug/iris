## MODIFIED Requirements

### Requirement: offline progressive enhancement

The system MUST render Mermaid diagrams using only a pinned local classic-script asset, MUST theme every rendered diagram from the design-token set so it matches the page's active theme, MUST re-render diagrams when the theme changes, and MUST keep the Markdown readable through `file://` with no server, runtime module, or network request.

#### Scenario: local Mermaid asset is installed

- **WHEN** a generated Iris page containing a valid Mermaid fence opens from `file://` and the vendored runtime exists
- **THEN** the page SHALL replace the diagram host with an accessible inline SVG colored from the active theme's diagram tokens without requesting a remote resource

#### Scenario: local Mermaid asset is absent or JavaScript is unavailable

- **WHEN** a generated page cannot load or execute the local diagram runtime
- **THEN** each diagram SHALL retain its readable escaped-source fallback and the rest of the Markdown SHALL remain usable

#### Scenario: theme is changed while diagrams are rendered

- **WHEN** the user switches the page theme after diagrams have rendered
- **THEN** each rendered diagram SHALL be re-rendered from its retained source in the colors of the new theme without a page reload or remote request, and a diagram that fails to re-render SHALL fall back to its escaped source exactly as on first render

### Requirement: bounded and accessible diagram presentation

The system MUST give each diagram an accessible name, MUST bound accepted source and graph complexity, MUST present each diagram inside the design system's diagram container, and MUST keep both rendered output and fallback source usable in light, dark, print, reduced-motion, and 360-pixel layouts.

#### Scenario: diagram renders successfully

- **WHEN** a Mermaid fence becomes an inline SVG
- **THEN** the diagram SHALL expose a non-empty accessible label, SHALL sit inside the diagram container with its status line, and SHALL fit its content region without forcing page-level horizontal overflow

#### Scenario: diagram input exceeds a configured bound

- **WHEN** Mermaid source or graph complexity exceeds the renderer's configured limit
- **THEN** that diagram SHALL fail locally with its escaped source and an actionable error while other content remains available
