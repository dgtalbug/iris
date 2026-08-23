## Why

Iris has never been released: there is no git tag, no GitHub Release, `release.yml` has never run, and `@dgtalbug/iris` returns 404 on the npm registry. A 2026-08-23 audit (`iris/research/release-readiness-audit/index.md`) found that the pipeline itself is sound but the product is not yet installable or honest about how it is installed — the package ships no license text, the CLI cannot report its own version, an unsupported Node.js runtime produces a raw stack trace instead of an actionable message, and generated agent surfaces never refresh their frontmatter, so the description that decides whether an agent triggers the skill is frozen at first install.

This change makes the first public release, v0.3.0, installable and truthful through exactly three user-facing paths — `npx`, `pnpm`, and `brew` — with no `npm install -g` in user documentation, while stating plainly that the package is hosted on the npm registry.

## What Changes

- Establish the supported install and upgrade surface as `npx @dgtalbug/iris`, `pnpm dlx` / `pnpm add -g`, and (once the published tarball exists) `brew install dgtalbug/tap/iris`. Remove `npm install -g` from user-facing documentation while keeping one honest statement that the artifact is served from the npm registry, and record the two client gotchas: `pnpm setup` is required before `pnpm add -g`, and pnpm's default one-day `minimumReleaseAge` hides a fresh release.
- Add `iris --version` / `-v`, and convert argument-parsing failures into the documented one-line user error instead of an uncaught `ERR_PARSE_ARGS_UNKNOWN_OPTION` stack trace. The version string is the installed package version and is what a future Homebrew `test do` block asserts against.
- Fail fast and legibly on an unsupported Node.js runtime. `engines` is advisory for both `npx` and `pnpm dlx`, so the CLI itself must detect a runtime below the supported floor and exit with the environment-error code and an actionable message.
- Refresh generated agent-surface metadata on upgrade. Today only the bytes between the managed markers are rewritten, so a changed skill or command `description` never reaches an already-initialized repository; ownership of that metadata must become verifiable so it can be refreshed while genuinely user-edited content is still preserved and reported. **BREAKING** for the current managed-surface contract, which documents every byte outside the managed region as untouched.
- Extend release payload verification to every packaged initialization asset, including the project-doc templates that initialization requires but release verification does not currently check.
- Ship the governance and provenance files a public release needs: `LICENSE` (MIT, matching the declared license), `CHANGELOG.md` as the source of release notes, `SECURITY.md`, and `CONTRIBUTING.md`.
- Repository and pipeline hygiene: set the version to 0.3.0; make `prepack` package-manager-neutral; remove the stale `package-lock.json` in a pnpm project; raise the release workflow's Node.js version to the floor npm trusted publishing documents; make a manual workflow dispatch exercise release verification instead of skipping it; add dependency update configuration; correct stale claims in `docs/status.md` and `docs/tech.md`.

Out of scope: creating the Homebrew formula and tap (they require a published tarball URL and checksum that do not exist yet, and the canonical spec forbids shipping a channel that cannot be honored); the manual npm bootstrap publish, trusted-publisher configuration, GitHub `npm` environment, and `main` branch protection, which are performed by the package owner outside this repository; the dashboard palette, branding, theme-toggle redesign, `iris uninstall`, project-doc population, and source-disclosure removal, which the audit records as separate product gaps.

## Capabilities

### New Capabilities

None. Every behavioral change belongs to an existing capability.

### Modified Capabilities

- `brew-formula-and-installability`: the supported install and upgrade path becomes the `npx` / `pnpm` / `brew` surface with no `npm install -g` in user documentation; the CLI must report a predictable version on request; an unsupported runtime and an unrecognized invocation must fail with an actionable message and the documented exit code rather than a runtime stack trace; release payload verification must cover every packaged initialization asset.
- `agent-first-initialization`: generated agent surfaces must converge on upgrade, including the frontmatter metadata outside the managed content region, with ownership verified before any refresh so user-authored metadata is preserved and reported instead of overwritten.

## Impact

- **CLI**: `src/cli.ts` (option table, parse-failure handling, version branch), `src/index.ts` (runtime floor guard), `src/lib/command-catalog.ts` (help footer), `src/lib/errors.ts` usage for the environment-error path.
- **Agent surfaces**: `src/lib/agent-skills.ts` managed-marker format and refresh path; existing installs carry markers without frontmatter ownership metadata, so the design must decide how they are migrated. `tests/agent-skills.test.ts` currently asserts the present behavior and will change.
- **Release tooling**: `scripts/verify-release.mjs`, `scripts/install-smoke.mjs`, `.github/workflows/release.yml`, `.github/workflows/ci.yml`, new `.github/dependabot.yml`, `package.json` (`version`, `prepack`), removal of `package-lock.json`.
- **Docs**: `README.md` install/upgrade/maintainer sections, `docs/cmds.md` (common flags and exit codes), `docs/status.md`, `docs/tech.md`; new `LICENSE`, `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`.
- **External prerequisites** (owner-performed, blocking the actual publish): npm package bootstrap and trusted-publisher configuration, the protected GitHub `npm` environment, and `main` branch protection.
- **Consumers**: agents and users of already-initialized repositories see refreshed skill and command descriptions after upgrading and re-running `iris init`.
