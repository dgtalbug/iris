# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Dependency updates: typescript 6.0.3, ajv 8.20.0, lucide 1.33.0, eslint 10.8.1,
  vitest 4.1.11, prettier 3.9.6, tsx 4.23.12, @types/node 26.2.0,
  typescript-eslint 8.67.0, and the checkout, setup-node, and pnpm/action-setup
  actions.
- Lucide 1.x ships each icon as its child nodes without the surrounding `svg`
  node, so the root attributes are now declared in `src/templates/icons.ts`. The
  emitted root element is unchanged; only icon geometry moves.
- Added `vitest.config.ts` limiting the suite to `tests/`, because Vitest 4 would
  otherwise also collect the compiled copies `tsc` emits under `dist/`.

## [0.3.0] - 2026-08-23

First public release. Iris is installable from the npm registry through `npx`,
`pnpm dlx`, and `pnpm add -g`.

### Added

- `iris --version` / `-v` prints the installed package version alone and exits `0`,
  so an installation can be verified without parsing the help text.
- A runtime guard that reports an unsupported Node.js release with the supported
  minimum, the runtime found, and the documented environment-error code, before
  any workspace write. `engines` is advisory for `npx` and `pnpm dlx`, so the CLI
  enforces the floor itself.
- `LICENSE` (MIT), `CHANGELOG.md`, `SECURITY.md`, and `CONTRIBUTING.md`.
- A shared packaged-asset manifest that release verification and the install smoke
  test both read, so an asset cannot be required by one check and unverified by the
  other. It now covers the `templates/project` skeletons that initialization needs.
- Dependency update configuration for the npm and GitHub Actions ecosystems.

### Changed

- Generated agent surfaces now converge on upgrade. The managed start marker records
  a digest of the generated front matter, so a changed skill or command `description`
  reaches an already-initialized repository. Front matter is refreshed only when it
  is provably the front matter Iris wrote; anything else is preserved and reported.
- An unknown option or command exits `1` with a single-line message pointing at
  `iris --help`, instead of an uncaught `ERR_PARSE_ARGS_UNKNOWN_OPTION` stack trace.
- Help text is computed per invocation, so a broken package layout reports the
  environment error instead of throwing while the CLI is being imported.
- Install documentation is built around `npx`, `pnpm dlx`, and `pnpm add -g`, and
  names the npm registry as the host for the published artifact.

### Removed

- The stale `package-lock.json` from this pnpm project.

[Unreleased]: https://github.com/dgtalbug/iris/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/dgtalbug/iris/releases/tag/v0.3.0
