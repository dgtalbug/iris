## MODIFIED Requirements

### Requirement: Aperture token contract

The system MUST generate dark and light themes from one token stylesheet whose color, shape, and type tokens are the Vision "Electric" v2.0 token set — its token names and its oklch values — followed by an iris extension block that MUST define navigation-shell surface, text, and selection tokens, the six page-type colors as aliases onto Vision accent and status tokens, priority colors, code-block foreground tokens, the sRGB fallback tokens diagram rendering needs, and the size, space, motion, and layout ramps. The system MUST keep style literals confined to that token stylesheet, MUST validate text contrast at 4.5:1 or better, MUST validate non-text contrast for control boundaries and border visibility, and MUST record every value that deviates from the upstream Vision block together with the floor that required it, so that every generated page and the shell render from one token set and a future restyle is a token-block swap rather than a rewrite.

#### Scenario: generated styles are validated

- **WHEN** a contributor runs the token validation command
- **THEN** the validator MUST accept oklch, hex, and token-alias values (mapping out-of-gamut oklch into sRGB the way browsers do before measuring), MUST reject undeclared token names, MUST reject style literals outside the token stylesheet — hex, rgb, hsl, oklch, oklab, lab, lch, hwb, and color() alike — and MUST reject configured foreground/background pairs below 4.5:1 in either theme, including page-type, status, navigation-shell, and code-block pairs

#### Scenario: theme is switched

- **WHEN** the user toggles the theme on any generated page, by the mode toggle or the keyboard shortcut
- **THEN** that page and its navigation shell MUST render in the selected theme from the same tokens, the mode toggle MUST show which theme is active, the page MUST notify its own diagram code so diagrams re-theme, and the preference MUST be restored on other generated pages in that browser when local storage is available

#### Scenario: non-text surfaces are validated

- **WHEN** the token validation command checks a configured non-text pair
- **THEN** it MUST reject a control-boundary pair below 3:1 and a border pair below the declared visibility floor in either theme, and the failure message MUST state which threshold applied so a border floor is never read as a text contrast result

#### Scenario: an upstream value cannot meet a floor

- **WHEN** a Vision token value fails a validated text, control-boundary, or border floor in one theme
- **THEN** the token stylesheet MUST carry the smallest lightness adjustment that meets the floor, that adjustment MUST be recorded with the floor that required it, and every other Vision value MUST remain verbatim

### Requirement: Aperture component language

The system MUST provide generated component styles and semantic markup in the Vision "Electric" component vocabulary — cards and hero cards, badges, callouts, stat cards, tabs, code blocks, file trees, tables, flow strips, steps, timelines, meters, evidence blocks, footnotes, collapsibles, buttons, keyboard hints, the mode toggle, and diagram containers — plus an iris layer written only against the same tokens for the navigation shell, page headers, summary strips, command cards, compact work rows, Kanban columns and cards, detail drawers, document layouts with a table of contents, and command-specific empty states. Every icon MUST be an inline SVG emitted at generation time that inherits its color from the semantic icon classes, with no icon script, icon font, or network request. The workspace brand mark is the radar icon in the primary color; no aperture ring or aperture glyph is generated.

#### Scenario: meaning is communicated accessibly

- **WHEN** a generated page uses type, status, or priority color, interactive controls, selection, current-section marking, or motion
- **THEN** the page MUST provide a non-color signal such as label text or a typed icon, visible keyboard focus, semantic state, and a static reduced-motion presentation

#### Scenario: a page type is shown

- **WHEN** a work record's type appears in a row, card, table, drawer, or page header
- **THEN** it MUST be rendered as a badge and/or typed icon in that type's token color with the type name as text, and the six type colors MUST be the documented aliases onto Vision accent and status tokens

#### Scenario: a published artifact is inspected

- **WHEN** a page is published or exported as a standalone artifact
- **THEN** every icon MUST remain visible as inline SVG and the artifact MUST contain no external icon, font, or script reference

### Requirement: newcomer-first dashboard hierarchy

The generated workspace MUST consist of an Overview page at `iris/index.html`, a Work page with the dense List/Table/Kanban browser and detail drawer, a Spec page presenting an index of canonical specs, active changes, and the archive with each record addressable in place, a Research page, a Commands page, and the project docs, all reachable through the shared navigation shell; the Overview MUST preserve the briefing hero, per-section summary, architecture pane, and project-docs strip, and the hero MUST present pages-by-type counts as labelled badges with typed icons rather than as a ring graphic.

#### Scenario: repository has no generated work pages

- **WHEN** a newcomer opens the Overview from `file://`
- **THEN** it MUST remain useful by naming the commands that populate the briefing, architecture, and work areas without making a network request, and the pages-by-type row MUST state that no pages exist and name the command that creates one

#### Scenario: repository has generated work pages

- **WHEN** a newcomer opens the Work page with one or more page contracts
- **THEN** the page MUST provide compact List, Table, and Kanban representations plus a detail drawer without requiring navigation away from that page

#### Scenario: user opens the Spec view

- **WHEN** a user activates the `Spec` navigation entry
- **THEN** the Spec index MUST show OpenSpec overview counts and navigable canonical, active-change, and archive listings while the shell keeps every other section reachable

#### Scenario: state is communicated in the Spec view

- **WHEN** canonical, active, archived, legacy, incomplete, or invalid records are displayed
- **THEN** each state MUST have a textual or structural indicator in addition to any color encoding

#### Scenario: a spec detail page is opened

- **WHEN** a user opens a canonical spec, change, or legacy record from the index
- **THEN** the page MUST keep the navigation shell and the Spec section current, present that record's content, and provide a way back to the index
