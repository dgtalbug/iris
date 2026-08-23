---
title: Overview
status: active
---

# Overview

What `iris` is, who it is for, and what it deliberately is not.

## What this is

`iris` turns finished AI-coding work into local, versioned, visual HTML. An agent or a developer records a bug, feature, idea, plan, report, or research note as a validated JSON contract or a Markdown source, and `iris render` produces deterministic static pages that open straight from disk. It is for a developer who wants the output of agent sessions to accumulate somewhere readable instead of scrolling out of a terminal, and it is deliberately not a hosted service, a dashboard server, or a system that watches or ingests the repository on its own.

Two rules shape everything: Iris never invents content, and a generated page never reaches the network. Every page is `file://`-safe with no runtime fetch, no CDN, and no telemetry.

## How it runs

`iris` is a plain Node.js CLI (`>=22.13.0`, enforced by the CLI itself because `engines` is only advisory for `npx` and `pnpm dlx`). `src/index.ts` runs the runtime guard, then dynamically imports `src/cli.ts`, which parses arguments and dispatches to one command module per verb.

A change travels: edit `src/**` → `pnpm build` (`tsc`) emits `dist/` → `pnpm release:check` runs lint, format, token-lint, typecheck, tests, an HTML reference check, and an install smoke test that packs the real tarball and runs `iris init` twice offline → a tagged GitHub Release triggers `release.yml`, which republishes the gate and publishes to npm with provenance through OIDC.

Content travels: `iris <type> <id>` writes a source (`iris/pages/<id>/data.json` or `iris/research/<id>/index.md`) → the source is edited by hand or by an agent → `iris render` validates it against `schemas/` and writes `page.html` beside it, then refreshes the section pages.

## Where things live

| Path                 | Holds                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/cli.ts`         | Argument table, the version and help branches, and dispatch to every command                                       |
| `src/commands/`      | One module per verb: `init`, `render`, `draft`, `lifecycle` (archive/update), `publish`, `export`, `report`, `vendor`, `open` |
| `src/lib/`           | Non-rendering logic: the runtime floor, agent-surface ownership, OpenSpec parsing, project docs, state, schemas     |
| `src/templates/`     | HTML generation — design tokens, component CSS, the navigation shell, and one module per page under `pages/`        |
| `schemas/`           | The JSON Schema contracts every rendered page is validated against                                                 |
| `templates/agents/`  | The two packaged sources every generated skill and `/iris:*` command file is produced from                          |
| `templates/project/` | The Markdown skeletons `iris init` scaffolds into `iris/project/`                                                   |
| `scripts/`           | Release and quality gates: packaged-asset manifest, release verification, install smoke, token and HTML checks      |
| `iris/`              | This repository's own generated workspace — Iris dogfooding itself                                                  |
| `openspec/`          | Canonical specs and the archived change history behind them                                                        |
