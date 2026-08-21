## Why

The project already has a deterministic CLI, strict JSON schema validation, and a tokenized offline dashboard, but it still lacks the type-aware rendering and distribution layer that turns those contracts into shareable, reliable outputs. Without a typed template registry and publish/report path, the tool remains a local scaffold instead of a usable documentation workflow.

## What Changes

- Add a typed template registry for the core report, feature, bug, idea, and plan contract types.
- Make rendering schema-driven and deterministic, with validation failures preventing partial page output.
- Add a local publish/export flow for standalone HTML artifacts that work without a server.
- Add supporting report extraction from local agent session data.
- Keep the install and publish story local-first and offline-safe.

## Capabilities

### New Capabilities
- typed-templates-and-distribution: define the contract-driven template mapping, deterministic rendering flow, and local distribution/reporting workflow for iris pages.

### Modified Capabilities
- None

## Impact

- CLI surface: render, publish, and report flows under `iris`
- Runtime behavior: validation gates before page generation and offline-safe artifact export
- Repo structure: template registry, page rendering rules, and docs for command usage
- Distribution model: static, portable outputs without remote render or server dependencies
