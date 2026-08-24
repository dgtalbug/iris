# iris project constitution

## Problem

Developers using AI coding agents need fast, visual, versioned documentation that stays local and file-first.

## Prime Directive

Minimize prose and maximize meaningful visuals so humans understand a change in seconds.

## What iris Is / Is Not

iris is an open-source local skill + CLI that manages and renders contract data into deterministic HTML.

Non-goals (v1): no SaaS, no server, no auth, no telemetry, no MCP integration, no analysis engine, and no remote lifecycle engine.

## Ecosystem Position

Specs is lifecycle truth, GitNexus is code truth, iris is the renderer for both.

## Target Users

Developers working with Claude Code, Copilot, and Codex.

## Repo Layout iris Creates

`iris/config.yaml`, `iris/state.json`, `iris/design/*`, `iris/project/*`, `iris/pages/*`, `iris/archive/*`, `iris/index.html`.

## v1 Scope

M0 foundation + M1 design system and dashboard, then typed templates, a deterministic local lifecycle layer, and distribution milestones. Lifecycle remains repository-local: no remote orchestration, hosted sync, or background service.

## Glossary

- page: one rendered HTML artifact for a contract id
- contract: JSON data envelope + type schema
- block: typed visual unit (text, chart, flow, code, etc.)
- section slot: fixed location in a type template
- shim: generated agent-surface integration file
- mirror: read-only rendered copy of existing markdown docs
- stale: dashboard/page flag when scoped files changed since last render
