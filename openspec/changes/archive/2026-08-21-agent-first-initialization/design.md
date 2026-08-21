## Context

See `proposal.md` for motivation and the two delta specs for observable behavior. Today `init` scaffolds the workspace and managed design/editor files, while `adopt` creates README/docs report mirrors and `sync` owns page/source hashes and stale states. The npm allowlist omits all agent templates.

The locally installed OpenSpec 1.9.0 implementation is the reference for agent setup: its initializer uses a canonical workflow template registry, resolves tool skill directories, transforms tool-specific references, and writes packaged generated skills. Its skill writer replaces complete generated files, so Iris needs a stricter preservation boundary to satisfy this change's user-edit requirements.

The installed Iris CLI must remain framework-free and locally deterministic. Initialization cannot depend on the OpenSpec package, a server, runtime network access, background monitoring, or repository-only ignored files.

## Goals / Non-Goals

**Goals:**

- Make first run and upgrades converge through `iris init`.
- Keep one auditable agent instruction source and small generated surfaces.
- Prove ownership before updating skills or deleting legacy generated pages.
- Reduce project state to data still used by render/archive navigation.
- Keep every generated dogfood file reproducible from source and the CLI.

**Non-Goals:**

- Adding new content commands, agent runtimes, prompt/slash-command adapters, network discovery, telemetry, watchers, or OpenSpec runtime integration.
- Removing or renaming `iris update`; it remains a compatible explicit managed-surface refresh, but it is no longer required for setup.
- Changing OpenSpec's `/opsx:sync`, `openspec-sync-specs`, active changes, or historical archive artifacts.
- Deleting archived adopted pages automatically; an explicit archive is treated as user-selected history.

## Decisions

### 1. One packaged canonical skill with three repository targets

Store the canonical skill template at `templates/agents/iris-workspace.md`, include `templates/agents` in the npm `files` allowlist, and resolve it relative to the installed package at runtime. Generate:

- `.agents/skills/iris-workspace/SKILL.md`
- `.claude/skills/iris-workspace/SKILL.md`
- `.github/skills/iris-workspace/SKILL.md`

The template describes the existing Iris workflow and content commands. Surface adapters may transform invocation wording or frontmatter, but they cannot carry separately authored workflow instructions.

This follows OpenSpec's canonical-template pipeline while keeping Iris's supported set deliberately small. Generating `.claude/commands` or `.github/prompts` was rejected because these are optional command-adapter surfaces, duplicate the skill contract, and are unnecessary for agent-first setup.

### 2. Hash-verified managed regions preserve user ownership

Each generated skill contains one start marker with template id, schema version, package version, and SHA-256 of the normalized managed body, plus one end marker. The installer parses markers without executing content.

- Missing target: atomically create the complete generated skill.
- Valid markers and matching body digest: replace only the managed region, preserving all prefix/suffix bytes.
- Identical desired output: do not rewrite the file.
- Unmarked target, malformed/nested/misordered markers, digest mismatch, symlink, or confinement failure: preserve the file, accumulate an actionable conflict, and continue inspecting other targets.
- After workspace generation, any conflict makes `init` return a user-error status so incomplete skill setup is observable; successfully updated surfaces and user data remain intact for a safe rerun.

Atomic sibling-temporary-file plus rename writes prevent partial truncation. This is stricter than OpenSpec's whole-file replacement and is required because Iris explicitly promises edit preservation.

### 3. `init` orchestrates migration, managed surfaces, skills, and rendering

Use this order:

1. Create missing workspace directories and user-owned baseline files.
2. Load either legacy state version 1 or normalized version 2.
3. Classify and remove only proven active generated adopted pages.
4. Save normalized state version 2 containing only `page_index` identity/type/title and active/archived status.
5. Refresh managed design assets, safe project placeholders, and the single VS Code task.
6. Install or refresh the three agent skills.
7. Render the dashboard and validate required readable outputs.
8. Report preserved legacy pages and skill collisions; return failure if agent setup is incomplete.

`update` reuses managed-surface and skill installation functions for compatibility, while documentation tells users to rerun `init` for setup and upgrades. A separate hidden update phase was rejected because it recreates the multi-command setup this change removes.

### 4. Legacy cleanup requires a complete positive proof

Only an active `iris/pages/<id>` directory is eligible. The migration requires all of:

- a legacy state entry whose source kind is Markdown;
- a normalized, repository-relative source exactly `README.md` or below `docs/` with a Markdown extension and no traversal;
- a non-symlink page directory confined below `iris/pages`;
- parseable `data.json` whose `id` equals the registry id and whose tags contain `adopted-doc`;
- a valid page id;
- registry `data_hash` and `content_hashes["pages/<id>/data.json"]` both matching SHA-256 of the exact current data bytes.

The migration removes only that page directory, registry entry, and corresponding legacy hashes. Missing fields, malformed data, unsafe paths, or any mismatch preserves the page and emits a warning. Prefixes, titles, prose, or tags alone never prove ownership. Archived records are normalized but preserved.

This narrow conjunction trades aggressive cleanup for data safety. Users can manually archive or remove a preserved ambiguous page after review.

### 5. Remove product sync state without weakening ordinary rendering

Version 2 state keeps `page_index` because rendering registers active pages and archive navigation needs historical entries. Remove `source`, `data_hash`, `content_hashes`, `last_synced_sha`, and the `stale` status after migration. Rendering writes registry identity/status directly and `archive` retains only ordinary registry metadata.

Remove README briefing extraction and stale display/count logic from the dashboard template. Empty-state and project-placeholder copy points to `iris init`, agent skills, and explicit content/render commands. Generic report Markdown fields and session-ingestion source evidence remain unrelated and unchanged.

### 6. Package and generated-output verification are release contracts

Extend package verification and the installed smoke test to inspect `npm pack --json`, install the tarball into an unrelated temporary directory, run `iris init` without the source checkout as an asset provider, and assert the canonical template plus all three generated skills exist. The smoke test also reruns init and uses an existing content command to prove the installed workflow remains usable.

Tracked `iris/` dogfood is regenerated by building the CLI and running its migration/init/render path. No generated HTML, CSS, JavaScript, state, or adopted page is hand-edited.

## Risks / Trade-offs

- [Ambiguous legacy record survives] → Preserve it with an actionable warning; data safety outranks cosmetic cleanup.
- [State migration fails after partial filesystem work] → Classify before deletion, use exact confined targets, save normalized state after successful removals, and cover rerun idempotence.
- [Skill collision leaves setup incomplete] → Preserve the file, finish safe independent work, return a user error, and name the exact resolution path.
- [Three generated files drift] → Generate all from one packaged template and test normalized surface parity.
- [Ignored repository agent files hide package omissions] → Treat the packed tarball file list and installed smoke as the release evidence.
- [Broad sync removal damages OpenSpec tooling] → Scope code/docs searches to the `iris sync` product surface and assert OpenSpec skill/command files remain present.
- [Generated dogfood deletions resemble hand editing] → Perform them only through the built CLI migration and verify the final tree with tests and HTML integrity checks.

## Migration Plan

1. Add version-tolerant state loading and conservative adopted-page classification tests before removing legacy metadata consumers.
2. Add the packaged canonical skill and managed-region installer with collision, atomicity, confinement, rerun, and upgrade tests.
3. Reorder `init` around migration, skill installation, and final render; keep `update` delegating to the shared safe refresh path.
4. Remove CLI routes, adoption/sync implementation, stale/source/hash state, template copy, and coupled tests while retaining archive/update behavior.
5. Update documentation and package verification.
6. Build the CLI, run `iris init` against this repository to migrate the six proven active dogfood mirrors, and run `iris render --all`; inspect the resulting diff instead of editing generated files.
7. Run focused tests, strict OpenSpec verification, spec sync/archive, and the complete repository gate before the single commit and PR.

Rollback before merge is the branch diff. After release, a preserved legacy page can be recovered from version control; user-owned or ambiguous pages are never automatically deleted. Version 2 state intentionally cannot recreate retired adopted-source monitoring, so rollback to an older CLI requires restoring the previous state file from version control or backup.
