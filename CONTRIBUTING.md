# Contributing

## Setup

Iris is a pnpm project on Node.js >=22.13.0 (the CLI enforces that floor itself).

```bash
pnpm install
pnpm build
```

## Before you open a pull request

```bash
pnpm release:check
```

That runs the same gates CI does: `lint`, `format`, `token-lint`, `typecheck`, `test`,
`html-check`, and `smoke:install`. The smoke check packs the package, installs it into a
temporary directory, and runs `iris init` twice with no network access, so it is the slow
one — run it before pushing rather than on every save.

Use pnpm, not npm, for anything that touches dependencies. `pnpm-lock.yaml` is the only
lockfile this project keeps.

## Changes go through OpenSpec

Behavioral work is planned in `openspec/` before it is implemented. A change carries a
proposal, delta specs, a design, and a task list; implementation follows the tasks and
the specs are synced back on archive.

```bash
openspec list                 # active changes
openspec status --change <name>
openspec validate <name>
```

Fixes that change no specified behavior — a typo, a flaky test, a comment — do not need a
change proposal.

## Conventions

- Add a `CHANGELOG.md` entry under `Unreleased` for anything a user would notice.
  Release verification fails if the version being released has no section.
- Comments explain a non-obvious _why_ — a constraint, an invariant, a surprise. Spec and
  task traceability lives in `openspec/` and the changelog, never inline in the code.
- Any asset the installed CLI reads at runtime must be listed in
  `scripts/packaged-assets.mjs`, or release verification will not know to check it.
- Generated agent surfaces are written from `templates/agents/`. Changing a generated
  `description` is a user-visible change: it now reaches already-initialized repositories
  on the next `iris init`.

## Releasing

Maintainers only. Set the version in `package.json`, add the matching `CHANGELOG.md`
section, tag `v<version>`, and publish a GitHub Release with `--notes-file CHANGELOG.md`.
The release workflow verifies the tag against the package metadata and publishes to the
npm registry with provenance through a trusted publisher.
