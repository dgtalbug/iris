# Aperture Design System Specification

## Purpose

Define the deterministic visual language and dashboard hierarchy that lets a newcomer understand an iris-enabled repository from a single offline HTML entry point.

## Requirements

### Requirement: Aperture token contract
The system MUST generate dark and light themes from the Aperture token contract, MUST keep style literals confined to the generated token stylesheet, and MUST validate text contrast at 4.5:1 or better.

#### Scenario: generated styles are validated
- **WHEN** a contributor runs the token validation command
- **THEN** the validator MUST reject undeclared token names, forbidden style literals outside the token stylesheet, and configured foreground/background pairs below 4.5:1 in either theme

### Requirement: Aperture component language
The system MUST provide generated component styles and semantic markup for aperture marks, stat tiles, pills, callouts, timelines, keyboard hints, and command-specific empty states.

#### Scenario: meaning is communicated accessibly
- **WHEN** a generated page uses type or status color, interactive controls, or motion
- **THEN** the page MUST provide a non-color signal, visible keyboard focus, and a static reduced-motion presentation

### Requirement: newcomer-first dashboard hierarchy
The generated dashboard MUST order its primary content as briefing hero, health strip, architecture pane, work surface, and project-docs strip.

#### Scenario: repository has no generated work pages
- **WHEN** a newcomer opens the dashboard from `file://`
- **THEN** the dashboard MUST remain useful by naming the commands that populate the briefing, architecture, and work areas without making a network request

### Requirement: deterministic responsive interaction
The generated dashboard MUST retain classic deferred-script interactions for filtering and theme switching and MUST remain operable at a 360 px viewport.

#### Scenario: keyboard navigation is used
- **WHEN** the user presses `/` or `t` outside an editable field
- **THEN** `/` MUST focus the work filter and `t` MUST toggle the theme without loading external assets

#### Scenario: narrow viewport is used
- **WHEN** the dashboard viewport is 360 px wide
- **THEN** the hero, health strip, architecture pane, work surface, and docs strip MUST remain readable without horizontal page overflow
