## ADDED Requirements

### Requirement: generated agent command surfaces

The system MUST generate typed command files for the supported agent surfaces from the same canonical Iris source that produces the skill, covering the frequent content actions, and MUST apply its managed-ownership rules to those files.

#### Scenario: command surfaces are installed

- **WHEN** `iris init` installs agent guidance
- **THEN** it MUST generate one command file per supported content action into the Claude command directory and the GitHub prompt directory, each naming the exact Iris command, the file the agent edits, and the render step

#### Scenario: generated command content is refreshed

- **WHEN** a previously generated command file has valid ownership markers and its managed content matches the recorded digest
- **THEN** initialization MUST update only that managed content and preserve user-authored bytes outside the managed boundary

#### Scenario: command file was edited or is user-owned

- **WHEN** a target command file is unmarked, partially marked, misordered, edited so its digest no longer matches, symlinked, or outside the repository boundary
- **THEN** initialization MUST preserve the file, MUST NOT truncate or follow it, and MUST report the affected surface

#### Scenario: unrelated command content exists

- **WHEN** a supported command directory already contains unrelated commands or prompts
- **THEN** initialization MUST leave that content unchanged

## MODIFIED Requirements

### Requirement: canonical multi-agent skill installation

The system MUST generate supported agent skill files from one canonical Iris-owned skill source rather than maintaining independent instruction copies, and that source MUST state when to use Iris in conversational terms and map common user intents to the exact command and generated destination.

#### Scenario: supported skill surfaces are installed

- **WHEN** `iris init` installs agent guidance
- **THEN** it MUST provide the `iris-workspace` skill to the generic/Codex, Claude, and GitHub Copilot repository skill locations

#### Scenario: unrelated agent content exists

- **WHEN** a supported skill directory already contains sibling skills or unrelated files
- **THEN** initialization MUST leave that content unchanged

#### Scenario: agent decides whether Iris applies

- **WHEN** an agent reads the installed skill while deciding how to record completed work
- **THEN** the skill MUST name the situations that call for Iris and map each supported intent to its command and generated output location without requiring the agent to read any other file
