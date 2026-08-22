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
iris vendor
iris research install-check
iris render --all
iris open
```

`iris init` is the complete setup and upgrade command. It creates or safely refreshes the workspace, installs the `iris-workspace` skill for generic/Codex agents, Claude, and GitHub Copilot, generates the `/iris:*` command surfaces for Claude Code and Copilot, and renders every page. It never copies or monitors `README.md` or `docs/**/*.md`. These commands work against local files and do not require a hosted Iris service. See [the command reference](docs/cmds.md) for the complete installed command surface and preservation rules.

## The workspace

`iris/index.html` is an Overview: what the repository is, per-section counts, the most recent work, active spec changes with real task progress, and the commands that fill each area. Every generated page shares one navigation shell — a collapsible sidebar plus a breadcrumb top bar — and each section owns its own page:

| Page             | Holds                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `index.html`     | Overview: briefing, section summaries, recent work, spec movement                        |
| `work.html`      | Dense List / Table / Kanban browser over every record, with a detail drawer              |
| `spec.html`      | The OpenSpec filesystem snapshot: canonical specs, active changes, archives, task counts |
| `research.html`  | Markdown research pages with status, tags, and warnings                                  |
| `commands.html`  | Every CLI command with its real implementation status                                    |
| `project/*.html` | The managed overview, HLD, LLD, ERD, and decisions placeholders                          |

`/` focuses the visible filter, `t` toggles the theme, and `b` collapses the sidebar. Theme and sidebar state persist per browser; the initial theme comes from `iris/config.yaml`.

Every page renders from one design system — Vision "Electric" v2.0, adopted in [`docs/design-system.md`](docs/design-system.md) — in dark and light themes. Colors live in a single generated token stylesheet that CI validates for contrast, and icons are inlined as SVG at generation time, so a page needs no font, script, or network request to look right.

## Research pages are Markdown

Agents write research as plain Markdown, not JSON-escaped strings:

```bash
iris research cache-stampede-causes
# edit iris/research/cache-stampede-causes/index.md
iris render --all
```

Optional front matter (`title`, `status`, `tags`, `agent`, `updated`) sets the page header; anything missing falls back to the first heading, `draft`, or an explicit `not set` label rather than an invented value. The body renders through the same safe pipeline as OpenSpec Markdown — embedded HTML, unsafe destinations, and active images disabled — with a generated table of contents and offline Mermaid diagrams. Research pages join the Work browser as type `research` and support archive, publish, and export. Iris reads only `iris/research/`; general repository documentation is never ingested.

When a repository contains `openspec/`, the `Spec` page visualizes canonical specs, active changes, structured and legacy archives, artifacts, delta specs, and real task-checkbox progress. Markdown artifacts render as semantic offline HTML with embedded HTML disabled; an exact escaped-source disclosure remains available, while YAML stays literal code. Fenced blocks labeled `mermaid` retain escaped source and become diagrams after `iris vendor` installs the pinned local runtime. Each diagram renders independently under strict settings, so an invalid graph cannot hide its siblings or surrounding Markdown. `iris init`, bare `iris render`, and `iris render --all` explicitly refresh the generated `iris/spec.json` snapshot; page-specific renders and other lifecycle commands reuse it. The parser reads files directly without requiring the OpenSpec CLI, a server, or network access.

Use an exact Mermaid language fence in OpenSpec Markdown or an Iris contract Markdown field:

````markdown
```mermaid
flowchart LR
  Source --> Rendered[Offline diagram]
```
````

Without JavaScript or before `iris vendor`, Iris shows the escaped diagram source. Standalone `publish` and `export --single` artifacts also keep that source fallback; Iris does not claim a pre-rendered SVG snapshot without a deterministic browser renderer.

## How it runs

iris is a plain Node.js CLI — no agent, server, or AI runtime is needed to use it. You, or an AI coding agent working in your repository (Claude Code, Copilot, Codex), run `iris` commands directly. The CLI writes JSON contracts under `iris/pages/<id>/data.json` and Markdown research under `iris/research/<id>/index.md`, validates contracts against the schemas in `schemas/`, snapshots supported OpenSpec filesystem evidence into `iris/spec.json`, and renders deterministic static HTML that opens straight from disk with `iris open` — no build step or dev server.

Initialization installs one canonical `iris-workspace` skill into `.agents/skills`, `.claude/skills`, and `.github/skills`, and generates `/iris:research`, `/iris:bug`, `/iris:feature`, `/iris:idea`, `/iris:plan`, and `/iris:report` into `.claude/commands/iris/` and `.github/prompts/`. All of them are generated from two packaged templates and describe the same CLI workflow, and the skill names the moments that call for Iris so finished work reaches the workspace without being asked for. Iris refreshes only an intact hash-verified managed region, preserves user content outside it, and refuses to overwrite unmarked or edited targets.

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
