## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The CLI entry point loads its whole module graph before any statement runs.** `src/index.ts` is a shebang plus a static `import` of `./cli.js`, and `src/cli.ts` computes `HELP_TEXT` at module scope by calling `packageVersion()`. Any runtime check placed in the body of `index.ts` therefore executes *after* the entire graph has been parsed and evaluated, and a package-layout failure surfaces as an uncaught throw during import rather than as a handled exit code.
- **Argument parsing sits outside the error boundary.** `parseArgs` is called before the `try` block in `runCli`, and it runs in strict mode, so an unknown option throws `ERR_PARSE_ARGS_UNKNOWN_OPTION` past every handler.
- **The managed-region marker format is fixed and exactly matched.** `updateManagedContent` matches `template=<id> schema=1 version=<v> sha256=<64 hex>` with an anchored regex, verifies the digest of the bytes between the markers, and then rebuilds the file as `prefix + marker + body + suffix`. The prefix — the frontmatter an agent host reads — is copied through untouched, which is precisely why a changed description never reaches an installed surface. Adding any field to that marker line is a format change the current parser rejects.
- **Nothing has ever been published.** The registry has no `@dgtalbug/iris`, so every existing generated surface was produced either by this repository's own dogfooding or by a local tarball install on the maintainer's machine. This bounds the migration problem sharply and is the main reason a simple attribution scheme is sufficient.
- **`engines` is advisory.** Both `npx` and `pnpm dlx` only warn on an unsatisfied `engines.node`, so runtime enforcement has to live in the CLI itself.

## Goals / Non-Goals

**Goals:**

- Make the first-run failure modes legible: wrong runtime, unknown flag, broken package layout each produce one actionable line and the documented exit code.
- Make generated agent surfaces converge on upgrade without ever silently overwriting a human's edit, and make the attribution decision provable rather than heuristic wherever the marker can carry proof.
- Make release verification fail on an incomplete payload by construction, so the `templates/project` omission cannot recur asset by asset.
- Keep one source of truth for the supported Node floor, the packaged asset list, and the release notes.

**Non-Goals:**

- Reshaping the generated command frontmatter beyond refreshing what it already contains (no `argument-hint`, no `mode` key) — that is additive output design and belongs with the agent-surface work, not with release readiness.
- Changing what the managed *content region* means, how conflicts are reported, or the symlink/confinement checks around it.
- Any behavior for a Homebrew formula: this change only constrains what the documentation may claim while the channel is unavailable.

## Decisions

### 1. Guard the runtime before the CLI graph loads, using a dependency-free module and a dynamic import

`src/index.ts` becomes: call `assertSupportedNode(process.versions.node)` from a new module that imports nothing, then `await import('./cli.js')`. Deferring the import means the guard runs before any other Iris module is parsed or evaluated, so the guard stays correct even if a future dependency uses syntax or APIs the old runtime cannot parse.

The floor is a constant in that module, not a value read from `package.json`. Reading the manifest would require the package-root walk — the very thing that fails on a broken layout — and would make the guard depend on the state it is supposed to diagnose. A unit test asserts the constant matches `engines.node`, so the two cannot drift.

*Alternatives considered:* a check in the body of `index.ts` with the existing static import (rejected: runs after the graph is evaluated); relying on `engines` with `engine-strict` (rejected: it is a client-side setting Iris cannot set for its users, and `pnpm dlx` ignores it for dependencies); a shell wrapper as `bin` (rejected: adds a platform-specific launcher and breaks the Windows path the smoke test covers).

### 2. Treat argument-parsing failure as an ordinary user error

Move the `parseArgs` call inside the existing `try` and translate a parse error into the same error type every other user error uses, carrying the offending token and a pointer to `iris --help`, exiting with the user-error code. Strict parsing is retained: silently accepting unknown options would turn a typo into a no-op rather than a message.

### 3. `--version` prints a bare version, and is a global flag rather than a catalog entry

`iris --version` / `-v` writes the installed package version alone, followed by a newline, and exits successfully. A bare value is what an installer check, a Homebrew `test do` block, or a support request can consume without parsing prose; the decorated `iris v<version>` form remains the first line of `--help` for humans.

It is deliberately not added to `COMMAND_GROUPS`: that catalog drives the generated Commands page, the Overview command counts, and the install-smoke usage-parity check, so registering a global flag as a command would render a command card with a status badge and inflate the counts. The help footer gains one sentence naming the flag instead.

### 4. Compute the help text lazily

`HELP_TEXT` becomes a function called inside `runCli` rather than a module-scope constant. This removes the last import-time failure: a package whose templates are missing now reports the environment error through the normal exit path instead of throwing during module evaluation. The exported symbol changes shape, so the help test moves with it.

### 5. Record frontmatter ownership in the marker, and bump the marker schema

The START marker gains a second digest covering the generated frontmatter, and `MARKER_SCHEMA` moves from `1` to `2`. On refresh, the frontmatter is replaced only when the bytes before the START marker hash to the digest the marker records; otherwise the file is preserved and reported exactly as an edited managed body is today.

Bumping the schema rather than making the field optional keeps the anchored regex honest about what it is reading. The downgrade path is safe by construction: an older Iris reading a `schema=2` file fails to match its own regex, so it preserves the file and reports it rather than corrupting it.

*Alternatives considered:* attributing frontmatter structurally — treating any block whose keys match what Iris emits as Iris-owned (rejected: a user who edits only the description text would keep the expected key set, so the check would overwrite the exact edit it exists to protect); moving the frontmatter inside the managed region (rejected: agent hosts require frontmatter to be the first bytes of the file, and it would make every existing surface a marker-mismatch conflict); leaving frontmatter frozen and shipping descriptions in the body (rejected: hosts read the frontmatter description to decide whether to load the skill at all).

### 6. Migrate pre-`fm` surfaces by reconstruction, and treat a miss as a conflict

A surface written before this change has a valid body digest but no frontmatter digest. For those, attribution is by reconstruction: the frontmatter is refreshed when it matches byte-for-byte either what the current release generates for that surface or one of a small committed table of the shapes earlier revisions generated. Anything else is preserved and reported, and the operator can delete the file and re-run `iris init` to regenerate it.

This is sufficient precisely because nothing was ever published (see Context): the only surfaces in existence came from this repository and one local install, so the table is short and a miss costs a warning rather than data. Once a surface is rewritten, its marker carries the digest and later upgrades use the exact path from Decision 5.

### 7. One packaged-asset manifest shared by verification and the smoke test

`scripts/verify-release.mjs` and `scripts/install-smoke.mjs` each carry their own hand-written list of files that must be in the payload, which is how `templates/project` came to be required by one and unchecked by the other. Both read one manifest module instead, and a test asserts that every packaged template on disk appears in it — so adding a template that nothing verifies fails the suite rather than shipping.

The manifest lives with the scripts, not in `src/`, because release verification runs against a packed tarball and must not depend on a built `dist/`.

### 8. Release notes come from `CHANGELOG.md`; the workflow keeps `npm publish`

`CHANGELOG.md` in Keep a Changelog form is the single source for the GitHub Release body, which the maintainer passes with `--notes-file`. Verification asserts the file carries a section for the version being released, so a release cannot be cut with no notes.

The publish step keeps `npm publish --provenance` with the globally installed npm, and only the workflow's Node version rises to the floor that npm's trusted-publishing documentation states. Switching to pnpm's native OIDC publish is a viable simplification but would change the publish mechanism in the same release that first exercises it; it is a follow-up once one green OIDC publish exists.

### 9. Documentation states the channel and the host separately

The install section presents a no-install invocation (`npx`), a persistent install (`pnpm add -g`, with the `pnpm setup` prerequisite), and — only once it exists — the tap command, while naming the npm registry as where the artifact is hosted. This keeps the user-facing surface free of `npm install -g` without implying the package is distributed anywhere else, and it is why the spec separates "which commands are documented" from "which registry hosts the artifact".

## Risks / Trade-offs

- **A frontmatter refresh overwrites a deliberate human edit** → attribution is by digest for anything written by this release onward, and by exact reconstruction for older files; anything unattributable is preserved and reported, never rewritten.
- **The legacy reconstruction table misses a shape and reports a conflict on a file Iris did write** → the failure is a warning plus an unchanged file; the fix is to delete and re-run `init`. Chosen deliberately over guessing, and cheap because nothing was ever published.
- **A user on an older Iris hits a `schema=2` file after this ships** → the file is preserved and reported as an invalid marker, not corrupted. Documented as expected downgrade behavior.
- **The hardcoded Node floor drifts from `engines.node`** → a test asserts equality; it fails the release gate, not the user.
- **Adding `--version` changes the CLI surface the smoke test compares** → parity is computed from the same build on both sides, so help text stays equal by construction; an explicit assertion that `--version` equals the packed version is added rather than assumed.
- **Removing `package-lock.json`** → nothing in the repo, CI, or the scripts references it, and npm consumers resolve from `package.json`; the risk is limited to a contributor who ran `npm ci` locally.
- **Documentation promises a command that fails on release day** → pnpm's default freshness window and Homebrew's cooldown are stated next to the commands, and the brew line ships only after the tap exists.
- **The change touches the release pipeline and the pipeline has never run** → the first execution is a manual dispatch that now performs verification, and the publish step remains gated on a real release event.

## Migration Plan

1. Land the repository work in one branch: runtime guard and CLI surface, frontmatter ownership plus the legacy table, the shared asset manifest, governance files, version `0.3.0`, `CHANGELOG.md`, pipeline and documentation updates.
2. Regenerate this repository's own agent surfaces with the new build so the dogfood surfaces carry `schema=2` markers, and confirm a second `iris init` reports them unchanged.
3. Run the full release gate, merge, and let a manual workflow dispatch prove verification end to end without publishing.
4. The owner performs the external prerequisites (npm bootstrap and trusted publisher, protected environment, branch protection) — see `proposal.md` — Impact.
5. Cut the release; verify the published artifact resolves through `npx` and `pnpm dlx`, and that `iris --version` matches the tag.

**Rollback:** everything before step 5 is a revert of ordinary commits. After a publish, the registry version is not withdrawn — a defect is corrected by releasing a patch, so step 3's dispatch and the smoke test are the real gate. A user who has already upgraded can downgrade by version; their generated surfaces remain readable because the older CLI preserves markers it does not recognize.

## Open Questions

- Whether the owner's one-time bootstrap publishes a prerelease under a separate dist-tag or publishes `0.3.0` directly. Both leave this change's repository work identical; it only affects the sequence the owner runs by hand.
- Whether the eventual formula-bump automation lives in this repository's release workflow or in the tap repository. It is deferred with the rest of the Homebrew work and does not constrain anything here.
