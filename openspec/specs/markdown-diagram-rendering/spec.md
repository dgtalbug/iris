# markdown-diagram-rendering Specification

## Purpose
Provide safe, offline visual rendering for Mermaid fences in Iris Markdown while retaining readable source evidence whenever rendering is unavailable or invalid.

## Requirements

### Requirement: explicit Mermaid fence rendering

The system SHALL recognize only fenced Markdown code blocks whose normalized language identifier is exactly `mermaid` as diagrams and SHALL leave every other fenced block as literal code.

#### Scenario: Markdown contains a Mermaid fence

- **WHEN** rendered Markdown contains a closed fenced block labeled `mermaid`
- **THEN** the generated HTML SHALL contain a diagram host and the exact escaped diagram source as its fallback

#### Scenario: another code fence resembles a diagram

- **WHEN** rendered Markdown contains an unlabeled fence or a fence with another language identifier
- **THEN** the generated HTML SHALL preserve it as literal code and SHALL NOT submit it to the diagram runtime

### Requirement: offline progressive enhancement

The system MUST render Mermaid diagrams using only a pinned local classic-script asset and MUST keep the Markdown readable through `file://` with no server, runtime module, or network request.

#### Scenario: local Mermaid asset is installed

- **WHEN** a generated Iris page containing a valid Mermaid fence opens from `file://` and the vendored runtime exists
- **THEN** the page SHALL replace the diagram host with an accessible inline SVG without requesting a remote resource

#### Scenario: local Mermaid asset is absent or JavaScript is unavailable

- **WHEN** a generated page cannot load or execute the local diagram runtime
- **THEN** each diagram SHALL retain its readable escaped-source fallback and the rest of the Markdown SHALL remain usable

### Requirement: isolated safe failure

The system MUST process each Mermaid fence independently under strict untrusted-content settings, MUST disable diagram click behavior and active HTML, and MUST preserve a diagram's escaped source when parsing or rendering that diagram fails.

#### Scenario: one document contains valid and invalid diagrams

- **WHEN** a Markdown document contains a valid Mermaid fence and a separate invalid Mermaid fence
- **THEN** the valid diagram SHALL render, the invalid diagram SHALL show an actionable local error and its escaped source, and neither outcome SHALL hide the surrounding document

#### Scenario: diagram source requests active behavior

- **WHEN** Mermaid source includes HTML labels, click callbacks, links, scripts, or configuration intended to weaken the renderer
- **THEN** the rendered page MUST keep active HTML and click behavior disabled and MUST NOT execute repository-authored JavaScript

### Requirement: bounded and accessible diagram presentation

The system MUST give each diagram an accessible name, MUST bound accepted source and graph complexity, and MUST keep both rendered output and fallback source usable in light, dark, print, reduced-motion, and 360-pixel layouts.

#### Scenario: diagram renders successfully

- **WHEN** a Mermaid fence becomes an inline SVG
- **THEN** the diagram SHALL expose a non-empty accessible label and fit its content region without forcing page-level horizontal overflow

#### Scenario: diagram input exceeds a configured bound

- **WHEN** Mermaid source or graph complexity exceeds the renderer's configured limit
- **THEN** that diagram SHALL fail locally with its escaped source and an actionable error while other content remains available

### Requirement: explicit local asset installation

The system SHALL provide an idempotent `iris vendor` operation that copies the pinned Mermaid browser bundle and upstream license from the installed Iris package into the workspace without fetching from the network.

#### Scenario: user vendors diagram assets

- **WHEN** a user runs `iris vendor` in an initialized Iris workspace
- **THEN** the command SHALL install or refresh the exact pinned Mermaid runtime and license under `iris/design/vendor/` and report the installed version

#### Scenario: user vendors before initialization

- **WHEN** a user runs `iris vendor` without an initialized Iris workspace
- **THEN** the command SHALL fail with an actionable instruction to run `iris init` and SHALL NOT create a partial workspace
