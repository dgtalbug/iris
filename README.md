# iris

Visual, versioned docs from your AI coding agents. Less prose, more pictures — understand any change in seconds.

## Install

Prerequisite: Node.js 22.13.0 or newer on macOS, Linux, or Windows.

The primary install surface is the versioned npm package. After a release is published to npm, install and verify it with:

```bash
npm install -g @dgtalbug/iris
iris --help
```

Or run that published release without a global install:

```bash
npx @dgtalbug/iris --help
```

The package is not yet present in the public npm registry. Until the first release is published, contributors can verify the exact install artifact locally with `pnpm smoke:install`; the check packs the package, installs it into a temporary directory, then runs `iris --help`, `iris init`, a draft command, and `iris render` outside the repository. Homebrew remains deferred until a real release tarball URL and SHA-256 checksum exist; publishing a placeholder formula would be packaging theatre, which is still theatre even when written in Ruby.

Once installed, a minimal local-first workflow is:

```bash
mkdir my-iris-project && cd my-iris-project
iris init
iris bug install-check
iris render install-check
iris open
```

These commands work against local files and do not require a hosted Iris service. See [the command reference](docs/cmds.md) for the complete installed command surface and current implementation status.

## How it runs

iris is a plain Node.js CLI — no agent, server, or AI runtime is needed to use it. You, or an AI coding agent working in your repository (Claude Code, Copilot, Codex), run `iris` commands directly. The CLI writes JSON contracts under `iris/pages/<id>/data.json`, validates them against the schemas in `schemas/`, and renders deterministic static HTML that opens straight from disk with `iris open` — no build step or dev server.

The "skills" mentioned in the docs are planned agent-facing wrappers (Claude `/iris *` commands, Copilot prompts, Codex `$iris-*`) that will call this same CLI; they are scheduled for a later milestone. Until they ship, every documented workflow is the CLI itself.

### Upgrade

```bash
npm install -g @dgtalbug/iris@latest
iris --help
```

The package version controls the installed CLI version; rerunning the command above replaces the global install with the current published release.

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
