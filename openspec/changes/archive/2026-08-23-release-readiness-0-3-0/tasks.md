## 1. Runtime guard and CLI failure modes

- [x] 1.1 Add a dependency-free `src/lib/runtime.ts` exporting the supported Node floor as a constant and a pure `assertSupportedNode(version)` that returns the actionable message (supported minimum, runtime found, what to do) rather than printing it
- [x] 1.2 Rewrite `src/index.ts` to run the guard first and then `await import('./cli.js')`, exiting with the environment-error code and the message on stderr, writing nothing to the workspace
- [x] 1.3 Add a unit test asserting the floor constant equals `engines.node` in `package.json`, so the two cannot drift
- [x] 1.4 Add unit tests for `assertSupportedNode` covering a version below the floor, exactly at the floor, and above it
- [x] 1.5 Move the `parseArgs` call in `src/cli.ts` inside the existing `try` and translate parse failures into the user-error `IrisError`, naming the unrecognized token and pointing at `iris --help`
- [x] 1.6 Add tests asserting an unknown option and an unknown command both exit 1 with a single-line message and no stack trace

## 2. Version reporting

- [x] 2.1 Add `version: { type: 'boolean', short: 'v' }` to the option table in `src/cli.ts` and handle it before the help branch, printing the bare installed version and exiting 0
- [x] 2.2 Replace the module-scope `HELP_TEXT` constant with a function evaluated inside `runCli`, so a broken package layout reports the environment error instead of throwing during module import
- [x] 2.3 Add one sentence naming `iris --version` to the help footer in `src/lib/command-catalog.ts`, without adding a `COMMAND_GROUPS` entry
- [x] 2.4 Update `tests/cli-help.test.ts` for the new help accessor and add a case asserting `--version` and `-v` exit 0 and print exactly the package version
- [x] 2.5 Add a `--version` assertion to `scripts/install-smoke.mjs` comparing the installed CLI's output to the packed `package.json` version
- [x] 2.6 Document `iris --version` in the Common section of `docs/cmds.md` alongside the exit-code contract

## 3. Agent surface metadata ownership

- [x] 3.1 Extend the START marker in `src/lib/agent-skills.ts` with a frontmatter digest field and bump `MARKER_SCHEMA` to 2, updating `startMarker` and the anchored marker regex in `updateManagedContent`
- [x] 3.2 Teach the refresh path to replace the bytes before the START marker when they hash to the recorded frontmatter digest, and to preserve and report the surface as a conflict when they do not
- [x] 3.3 Add the legacy attribution path for `schema=1` markers: refresh the frontmatter when it matches byte-for-byte what the current release generates for that surface, or an entry in a committed table of pre-0.3.0 generated shapes; otherwise preserve and report
- [x] 3.4 Populate that table from the frontmatter shapes this repository has actually generated, with a comment recording why the set is closed (no published release preceded this change)
- [x] 3.5 Apply the same ownership handling to generated Claude command files and Copilot prompt files so their descriptions refresh with the skill's
- [x] 3.6 Update `tests/agent-skills.test.ts:75-92`, which currently asserts that all bytes outside the managed region survive a refresh, to the new contract
- [x] 3.7 Add tests for: stale generated metadata is refreshed and reported as updated; edited metadata is preserved and reported; a `schema=1` surface with recognizable metadata migrates and gains a recorded digest; a `schema=1` surface with unrecognizable metadata is preserved and reported
- [x] 3.8 Add a test asserting an unchanged rerun after migration reports every surface unchanged, so the migration converges rather than rewriting on every `init`
- [x] 3.9 Correct the managed-region paragraph in `docs/cmds.md` that currently promises every byte outside the region is preserved

## 4. Packaged asset verification

- [x] 4.1 Add a shared packaged-asset manifest under `scripts/` listing every asset the installed CLI reads at runtime, including `templates/project/*.md`
- [x] 4.2 Consume the manifest in `scripts/verify-release.mjs`, replacing its hand-written `requiredFiles` and `requiredTemplates` lists, and fail naming any missing asset
- [x] 4.3 Consume the same manifest in `scripts/install-smoke.mjs`, replacing its inline required-path list
- [x] 4.4 Add a test asserting every packaged template on disk appears in the manifest, so adding an unverified template fails the suite
- [x] 4.5 Extend `tests/release-packaging.test.ts` to cover a payload missing a required asset

## 5. Release metadata and governance files

- [x] 5.1 Add `LICENSE` at the repository root with the MIT text matching the declared license
- [x] 5.2 Add `CHANGELOG.md` in Keep a Changelog form with a `0.3.0` section summarizing the release
- [x] 5.3 Add `SECURITY.md` and `CONTRIBUTING.md` covering vulnerability reporting and the pnpm/`release:check`/OpenSpec contributor flow
- [x] 5.4 Set `package.json` version to `0.3.0` and change `prepack` to a package-manager-neutral command
- [x] 5.5 Remove the stale `package-lock.json` and add it to `.gitignore`
- [x] 5.6 Extend `scripts/verify-release.mjs` to fail when `CHANGELOG.md` has no section for the version being released, and cover it in `tests/release-packaging.test.ts`

## 6. Pipeline

- [x] 6.1 Raise the Node version used by the publish job in `.github/workflows/release.yml` to the floor npm's trusted publishing documents, leaving the CI floor unchanged
- [x] 6.2 Make the release-verification step run on `workflow_dispatch` with a fallback tag derived from `package.json`, so a manual dry run exercises it
- [x] 6.3 Change the concurrency group to a constant so releases serialize across tags
- [x] 6.4 Add `pnpm format` to `release:check` and CI, and add a second Node version to the CI matrix
- [x] 6.5 Add `.github/dependabot.yml` covering the npm and github-actions ecosystems
- [x] 6.6 Update `tests/release-packaging.test.ts` assertions about the workflow to match the edited file

## 7. Documentation

- [x] 7.1 Rewrite the README install and upgrade sections around `npx`, `pnpm dlx`, and `pnpm add -g`, removing `npm install -g` and stating that the artifact is hosted on the npm registry
- [x] 7.2 State the `pnpm setup` prerequisite and pnpm's release-freshness delay next to the commands they affect
- [x] 7.3 Remove the README statement that the package is not yet published, and correct the release-maintainer section to match the workflow's actual behavior
- [x] 7.4 Refresh `docs/status.md`: current branch, no active OpenSpec change, accurate test counts, and remaining risks reduced to the external prerequisites
- [x] 7.5 Correct the stale dependency pins in `docs/tech.md` and record the distribution decisions from this change in its decision table

## 8. Verification

- [x] 8.1 Rebuild and regenerate this repository's own agent surfaces so the dogfood surfaces carry `schema=2` markers, then run `iris init` again and confirm every surface reports unchanged
- [x] 8.2 Run `pnpm release:check` and confirm every gate passes on the merged result
- [x] 8.3 Verify from a packed tarball in a scratch directory: `--version` matches the package, an unknown flag exits 1 with one line, `init` twice is idempotent offline, and the generated skill carries the current description
- [x] 8.4 Confirm `npm pack --dry-run` lists `LICENSE` and every manifest asset
