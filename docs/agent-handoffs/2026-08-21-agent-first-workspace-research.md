# Agent-first workspace research handoff

Date: 2026-08-21
Branch baseline: clean `main` at `940d916`

## Reconciled decisions

- Remove only the Iris product commands `adopt` and `sync`. Preserve OpenSpec's
  `/opsx:sync` and `openspec-sync-specs` surfaces unchanged.
- Keep `page_index`, `archive`, `update`, rendering, session ingestion,
  publishing, exports, drafts, and navigation. Remove adopted-source hashes and
  stale-state concepts only after legacy migration has used them.
- Delete a legacy adopted page only when the state entry, safe repository-relative
  README/docs source path, page id, `adopted-doc` tag, and stored/current data
  hashes all prove it is an unmodified Iris-generated record. Preserve and warn
  on every mismatch; never infer ownership from a `doc-` prefix or tag alone.
- Make `iris init` the only documented setup and upgrade command. It scaffolds or
  refreshes the workspace, migrates proven legacy pages, installs agent skills,
  and renders the dashboard without copying README or `docs/**/*.md`.
- Follow OpenSpec 1.9.0's canonical-template-to-surface architecture as local
  evidence. Use one packaged Iris skill source and generate
  `.agents/skills/iris-workspace/SKILL.md`,
  `.claude/skills/iris-workspace/SKILL.md`, and
  `.github/skills/iris-workspace/SKILL.md`. Do not add independently maintained
  Claude commands or Copilot prompts in Phase 1.
- Generated skill regions carry Iris ownership/version/hash metadata. Refresh an
  intact managed region while preserving bytes outside it; preserve unmarked,
  malformed, or user-edited managed files and report the collision. Writes must
  be confined, symlink-safe, and atomic.
- Ship the canonical skill template in the npm tarball and prove installed,
  offline initialization from the packed artifact.
- The later Spec tab reads `openspec/` directly during explicit `init` or
  `render --all`. Its parser is deterministic, sorted, bounded, symlink-safe,
  network-free, and never executes file content.
- Spec lifecycle (active/archive), artifact completeness, parser health, and task
  progress remain independent. Task totals come only from real Markdown list
  checkboxes outside fenced code. Unknown or malformed files render as escaped
  source with path-specific diagnostics.

## Verification focus

- Phase 1: first run, rerun, upgrade, collision/edit preservation, safe legacy
  removal, archive retention, package payload, installed-offline smoke, generated
  dogfood, and the complete repository gate.
- Phase 2: every live structured/canonical/archive/legacy layout plus contract
  fixtures for nested capabilities, all delta operations, malformed/partial
  states, unsafe content, filesystem failures, keyboard access, themes,
  reduced-motion behavior, 360 px layout, and `file://` link integrity.

## Known evidence limits

- Current OpenSpec files contain only one-segment capability paths and ADDED delta
  sections. Nested paths and MODIFIED/REMOVED/RENAMED require explicit contract
  fixtures and graceful fallback; they must not be described as already observed.
- OpenSpec CLI validation does not validate archived material. Iris reports parser
  health, not OpenSpec semantic validity.
