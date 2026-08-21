## MODIFIED Requirements

### Requirement: newcomer-first dashboard hierarchy
The generated dashboard MUST provide top-level Work and `Spec` views, preserve the Work view's briefing hero, health strip, architecture pane, work surface, and project-docs strip, and organize the Spec view as overview, canonical specs, active changes with artifacts and delta specs, and archive.

#### Scenario: repository has no generated work pages
- **WHEN** a newcomer opens the dashboard from `file://`
- **THEN** the dashboard MUST remain useful by naming the commands that populate the briefing, architecture, and work areas without making a network request

#### Scenario: user opens the Spec view
- **WHEN** a user activates the top-level tab labelled `Spec`
- **THEN** the dashboard MUST show OpenSpec overview counts and navigable canonical, active-change, and archive sections while keeping the Work view available

#### Scenario: state is communicated in the Spec view
- **WHEN** canonical, active, archived, legacy, incomplete, or invalid records are displayed
- **THEN** each state MUST have a textual or structural indicator in addition to any color encoding

### Requirement: deterministic responsive interaction
The generated dashboard MUST retain classic deferred-script interactions for top-level view selection, filtering, theme switching, and keyboard navigation and MUST remain operable at a 360 px viewport.

#### Scenario: keyboard navigation is used
- **WHEN** the user presses `/` or `t` outside an editable field
- **THEN** `/` MUST focus the relevant visible filter and `t` MUST toggle the theme without loading external assets

#### Scenario: top-level tabs are keyboard operated
- **WHEN** focus is on the Work/Spec tablist and the user presses supported arrow, Home, or End keys
- **THEN** focus and selection MUST move according to the tab pattern with visible focus and correct tab/panel semantics

#### Scenario: narrow viewport is used
- **WHEN** the dashboard viewport is 360 px wide
- **THEN** the Work and Spec views, their navigation, summaries, artifact content, warnings, and source fallbacks MUST remain readable without horizontal page overflow

#### Scenario: reduced motion is requested
- **WHEN** the user enables reduced-motion preferences
- **THEN** switching views and revealing Spec content MUST have an equivalent static presentation without meaning-bearing information loss
