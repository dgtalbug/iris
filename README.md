# iris

Visual, versioned docs from your AI coding agents. Less prose, more pictures — understand any change in seconds.

## Install

Prerequisite: Node.js 22.13.0 or newer on macOS, Linux, or Windows.

The primary install surface is the versioned npm package. After a release is published to npm, install and verify it with:

```bash
npm install -g @dgtalbug/iris
iris --help
```

Or initialize a repository from that published release without a global install:

```bash
npx @dgtalbug/iris init
```

The package is not yet present in the public npm registry. Until the first release is published, contributors can verify the exact install artifact locally with `pnpm smoke:install`; the check packs the package, inspects its initialization assets, installs it into a temporary directory, runs `iris init` twice without runtime network access, verifies all supported agent skills, then creates and renders a page outside the repository. Homebrew remains deferred until a real release tarball URL and SHA-256 checksum exist; publishing a placeholder formula would be packaging theatre, which is still theatre even when written in Ruby.

Once installed, a minimal local-first workflow is:

```bash
mkdir my-iris-project && cd my-iris-project
iris init
iris bug install-check
iris render install-check
iris open
```

`iris init` is the complete setup and upgrade command. It creates or safely refreshes the workspace, installs `iris-workspace` skills for generic/Codex agents, Claude, and GitHub Copilot, and renders the dashboard. It never copies or monitors `README.md` or `docs/**/*.md`. These commands work against local files and do not require a hosted Iris service. See [the command reference](docs/cmds.md) for the complete installed command surface and preservation rules.

When a repository contains `openspec/`, the dashboard's top-level `Spec` tab visualizes canonical specs, active changes, structured and legacy archives, artifacts, delta specs, and real task-checkbox progress. Markdown artifacts render as semantic offline HTML with embedded HTML disabled; an exact escaped-source disclosure remains available, while YAML stays literal code. `iris init`, bare `iris render`, and `iris render --all` explicitly refresh the generated `iris/spec.json` snapshot; page-specific renders and other lifecycle commands reuse it. The parser reads files directly without requiring the OpenSpec CLI, a server, or network access.

## How it runs

iris is a plain Node.js CLI — no agent, server, or AI runtime is needed to use it. You, or an AI coding agent working in your repository (Claude Code, Copilot, Codex), run `iris` commands directly. The CLI writes JSON contracts under `iris/pages/<id>/data.json`, validates them against the schemas in `schemas/`, snapshots supported OpenSpec filesystem evidence into `iris/spec.json`, and renders deterministic static HTML that opens straight from disk with `iris open` — no build step or dev server.

Initialization installs one canonical `iris-workspace` skill into `.agents/skills`, `.claude/skills`, and `.github/skills`. The generated files all describe the same CLI workflow. Iris refreshes only an intact hash-verified managed region, preserves user content outside it, and refuses to overwrite unmarked or edited targets.

### Upgrade

```bash
npm install -g @dgtalbug/iris@latest
iris init
```

The package version controls the installed CLI version. Rerun `iris init` in each repository after upgrading so managed workspace assets and agent skills converge safely; no separate setup command is required.

### Release maintainers

1. Update `package.json` to the intended version and merge the fully verified change.
2. Create a GitHub Release whose tag is exactly `v<package version>`.
3. The `release.yml` workflow repeats the full release gate, verifies tag/package alignment, inspects the tarball, and publishes the public package with provenance.

The workflow uses npm trusted publishing through GitHub OIDC and the protected `npm` environment; it stores no long-lived publish token. Before the first automated release, the package owner must bootstrap `@dgtalbug/iris` on npm if necessary, configure `dgtalbug/iris` + `release.yml` as its trusted publisher, and approve the GitHub `npm` environment. A manual workflow run is verification-only and never publishes.

## Quickstart for contributors

```bash
pnpm install
pnpm build
node dist/src/index.js --help
```
