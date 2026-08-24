## MODIFIED Requirements

### Requirement: lifecycle-aware project bootstrap
The system MUST provide one project bootstrap flow that creates or refreshes the
local structure needed for page generation, dashboard rendering, managed
updates, and supported agent skill use without ingesting general repository
documentation. Machine-local bookkeeping MUST live in the user-global state home
rather than the committed workspace, leaving the repository tree to authored
sources and generated output.

#### Scenario: user initializes the project
- **WHEN** a user runs `iris init` in a repository
- **THEN** the system MUST create or safely refresh the required `iris/`
  structure, scaffold managed task metadata, install supported agent skills,
  render the dashboard, and place machine-local state in the user-global home

#### Scenario: repository contains README or docs markdown
- **WHEN** a user runs `iris init` in a repository containing `README.md` or
  `docs/**/*.md`
- **THEN** the system MUST NOT automatically copy, mirror, hash, monitor, or
  create Iris page records from those files

## ADDED Requirements

### Requirement: machine state relocation
The system MUST store the derived page registry and spec snapshot in the
user-global state home keyed by project identity, and MUST migrate any existing
in-repo machine state safely.

#### Scenario: state moves out of the workspace
- **WHEN** a project is initialized or updated after this change
- **THEN** the page registry and spec snapshot MUST resolve under the
  user-global project directory rather than the committed `iris/` tree

#### Scenario: migration is atomic and safe
- **WHEN** an existing in-repo page registry is migrated
- **THEN** the system MUST move it atomically, regenerating derived caches, and
  MUST NOT rewrite history or lose state on failure

#### Scenario: committed sources are preserved
- **WHEN** machine state is relocated
- **THEN** authored sources and generated output MUST remain in the repository
  so that a fresh clone still renders and reviews the project's knowledge

#### Scenario: project identity survives a moved checkout
- **WHEN** a project's checkout path changes but its git remote is unchanged
- **THEN** the system MUST reconcile identity by remote and retain the project's
  machine state
