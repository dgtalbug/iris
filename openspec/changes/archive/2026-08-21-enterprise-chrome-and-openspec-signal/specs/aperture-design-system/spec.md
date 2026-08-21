# aperture-design-system

## MODIFIED Requirements

### Requirement: Aperture token contract

The system MUST generate dark and light themes from the Aperture token contract, MUST keep style literals confined to the generated token stylesheet, MUST validate text contrast at 4.5:1 or better, MUST validate non-text contrast for control boundaries and border visibility, and MUST define navigation-shell surface, text, and selection tokens alongside the surface, text, accent, type, status, and priority tokens so that every generated page and the shell render from one token set.

#### Scenario: generated styles are validated

- **WHEN** a contributor runs the token validation command
- **THEN** the validator MUST reject undeclared token names, forbidden style literals outside the token stylesheet, and configured foreground/background pairs below 4.5:1 in either theme, including navigation-shell pairs

#### Scenario: theme is switched

- **WHEN** the user toggles the theme on any generated page
- **THEN** that page and its navigation shell MUST render in the selected theme from the same tokens, and the preference MUST be restored on other generated pages in that browser when local storage is available

#### Scenario: non-text surfaces are validated

- **WHEN** the token validation command checks a configured non-text pair
- **THEN** it MUST reject a control-boundary pair below 3:1 and a border pair below the declared visibility floor in either theme, and the failure message MUST state which threshold applied so a border floor is never read as a text contrast result

### Requirement: section summary strips

Each section page MUST open with a summary strip of counts derived only from generated data for that section, and the Overview page MUST summarize every section with links to the owning section page rather than embedding that section's full content. A summary MUST report the totals it holds even when the section's most active measure is zero.

#### Scenario: overview is opened

- **WHEN** a newcomer opens `iris/index.html` from `file://`
- **THEN** it MUST show the repository briefing, per-section counts, the most recently updated work records, active spec changes with task progress, and quick-start commands, each linking to the owning section page

#### Scenario: section has no data

- **WHEN** a section page has no records
- **THEN** it MUST name the exact command that populates it instead of showing an empty area

#### Scenario: a detected source has totals but no active items

- **WHEN** the Overview summarizes a source that is present and non-empty but has no active items
- **THEN** it MUST report the totals it holds and describe the absence of active items as one part of that summary, and it MUST NOT present the summary in a form a reader could mistake for the source being absent or unread

### Requirement: workspace navigation shell

Every generated Iris HTML page MUST share one navigation shell that lists the workspace sections (Overview, Work, Spec, Commands, and the project docs group), marks the current section, links each section with a relative `file://`-safe path, and can be collapsed and restored without any network request. Every section count shown in the shell MUST be a total for that section, measured the same way across sections.

#### Scenario: user moves between sections

- **WHEN** a user activates a navigation entry on any generated page
- **THEN** the browser MUST open that section's own page and the shell on that page MUST mark it as current

#### Scenario: sidebar is collapsed

- **WHEN** the user activates the collapse control or presses `b` outside an editable field
- **THEN** the shell MUST collapse to a compact rail in which every section remains reachable with an accessible label, and the same collapsed or expanded state MUST be restored on the next generated page opened in that browser when local storage is available

#### Scenario: narrow viewport

- **WHEN** the viewport is 360 px wide
- **THEN** the shell MUST present the sections behind a menu control in the top bar and the page MUST have no horizontal overflow

#### Scenario: artifact is published

- **WHEN** a page is published or exported as a standalone artifact
- **THEN** the navigation shell MUST be omitted and the page content MUST remain readable and self-contained

#### Scenario: a section holds records but has no active ones

- **WHEN** the shell shows the count for a section whose records exist but none are active
- **THEN** that count MUST reflect the records the section holds rather than the active subset, so that a populated section is never labelled zero
