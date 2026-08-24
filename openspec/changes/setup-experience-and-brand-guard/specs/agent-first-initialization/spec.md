## MODIFIED Requirements

### Requirement: one-command agent-first setup
The system MUST make `iris init` the complete project setup and upgrade flow for
an installed Iris CLI. Init MUST run as a staged flow — welcome, validation,
host detection, tool selection, generation, and a completion summary — and MUST
report the agent surfaces it installed. Init MUST NOT record derived tool
detection in the user-owned workspace configuration; the selected tools are
recorded in the user-global configuration instead.

#### Scenario: first initialization
- **WHEN** a user runs `iris init` in a repository with no Iris workspace
- **THEN** the system MUST detect supported agent hosts, generate the usable
  local workspace, install the selected agent-facing Iris skill surfaces, and
  render the dashboard in that operation

#### Scenario: repeated initialization
- **WHEN** a user runs `iris init` again in an initialized repository
- **THEN** the system MUST refresh Iris-managed outputs idempotently without
  requiring `iris update`, `iris adopt`, or `iris sync` as a setup step

#### Scenario: initialized repository has content commands
- **WHEN** initialization completes successfully
- **THEN** agents and users MUST still be able to use the existing draft, render,
  report, archive, publish, export, and open commands

#### Scenario: initialization installs agent surfaces
- **WHEN** `iris init` finishes installing agent surfaces
- **THEN** it MUST report how many surfaces were created, updated, and left
  unchanged, and MUST name every surface it could not write, so that the
  operator can see what was installed without inspecting the filesystem

#### Scenario: generated configuration is written
- **WHEN** the system writes the workspace configuration file
- **THEN** that file MUST NOT contain detection results derived from the
  repository's contents, so that a value frozen at creation time can never
  contradict the detection the dashboard actually reads

## ADDED Requirements

### Requirement: host detection and tool selection
The system MUST detect supported agent hosts from filesystem signals and let the
operator choose which hosts receive Iris surfaces, using a data-driven adapter
table in which each supported host is a declarative entry.

#### Scenario: interactive tool picker
- **WHEN** a user runs `iris init` in an interactive terminal
- **THEN** the system MUST present a multi-select picker with detected hosts
  pre-selected and MUST generate surfaces only for the chosen hosts

#### Scenario: non-interactive tool selection
- **WHEN** a user runs `iris init --tools <csv>` or `iris init --yes`
- **THEN** the system MUST resolve the tool set without prompting and MUST
  reject unknown host identifiers with the list of valid identifiers

#### Scenario: tools none still scaffolds
- **WHEN** a user runs `iris init --tools none`
- **THEN** the system MUST still scaffold the workspace and render, skipping only
  the agent surfaces

#### Scenario: adding a host
- **WHEN** a new agent host is supported
- **THEN** it MUST be added as a declarative adapter entry without a bespoke code
  path

### Requirement: offline non-interactive safety
Interactive setup MUST be gated on an interactive terminal and a non-CI
environment; non-interactive and CI paths MUST never prompt and MUST remain
fully offline.

#### Scenario: continuous integration
- **WHEN** `iris init --yes --tools none` runs in CI without network access
- **THEN** it MUST complete without prompting and without network access

#### Scenario: reduced motion and no color
- **WHEN** the environment requests no color or reduced motion
- **THEN** styled output MUST degrade to a static, unanimated equivalent

### Requirement: skill directories as managed surfaces
The flagship agent skill MUST ship as a directory containing a skill file and
reference documents, generated from canonical Iris-owned sources and installed
under managed-ownership markers to every selected host.

#### Scenario: skill directory installed
- **WHEN** `iris init` installs the flagship skill
- **THEN** it MUST write the skill file and its reference documents under managed
  markers to each selected host's skill location

#### Scenario: component reference matches renderer
- **WHEN** the skill's component reference is generated
- **THEN** it MUST be produced from the same canonical source as the renderer's
  container tests, so a construct the renderer rejects cannot be documented
