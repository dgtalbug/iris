# iris status report

> Snapshot date: 2026-08-21 · branch `feat/agent-first-initialization` · Phase 1 implementation candidate before hosted PR checks.

## One-line summary

Iris is a working agent-first local visual-workspace CLI: `iris init` now performs complete offline project setup, installs one canonical skill across three agent surfaces, preserves user-owned files, and no longer copies or monitors general repository documentation.

## Current implementation

| Area | State |
| --- | --- |
| Commands implemented | `init`, `render`, `report` (including `--from-session`), `publish`, `feature`, `bug`, `idea`, `plan`, `archive`, `export --single`, `open`, `update` |
| Commands stubbed (exit 1) | `promote`, `vendor` |
| Retired product commands | `adopt`, `sync`; OpenSpec `/opsx:sync` remains unchanged |
| Agent surfaces | `.agents/skills/iris-workspace`, `.claude/skills/iris-workspace`, `.github/skills/iris-workspace`, generated from one packaged template |
| State | Version 2 page registry with active/archive navigation only; no adopted-source hashes or stale-source states |
| Tests | 15 Vitest suites (64 tests) plus lint, token, type, HTML, packaging, and installed-smoke gates |
| Runtime dependencies | `ajv` only; no frontend framework, server, watcher, telemetry, or OpenSpec runtime dependency |
| Distribution | npm-first `@dgtalbug/iris` 0.1.0 package; public publication still awaits owner/trusted-publisher setup |
| Dogfood | Generated through the built CLI; legacy active document mirrors are removed only by positive migration proof |

## Initialization contract

- First run and upgrades use `iris init`; `iris update` remains compatible but is not a setup prerequisite.
- The installed npm package contains every initialization template. After package installation, setup and rendering make no network requests.
- Existing configuration, intentional pages, archives, unrelated VS Code tasks, sibling skills, unmarked files, and edited managed skill content are preserved.
- Intact Iris-managed skill regions update atomically using ownership/version markers and a SHA-256 body digest.
- `README.md` and `docs/**/*.md` are never automatically copied, hashed, monitored, or converted into page records.

## OpenSpec state

- `agent-first-initialization` defines the Phase 1 implementation and verification contract.
- `standalone-publish-and-export` retains the explicitly deferred PNG/PDF browser-policy task.
- `brew-formula-and-installability` remains active until real release artifacts provide a stable URL and checksum.
- OpenSpec delta-spec synchronization tooling is preserved; only the Iris product command was retired.

## Remaining risks and gates

1. The complete local gate passes; hosted PR checks must still pass before this branch merges.
2. Public npm release still requires package-owner bootstrap, trusted-publisher configuration, and the protected GitHub `npm` environment.
3. PNG/PDF export remains unavailable until a deterministic browser-pinning policy is approved.
4. Homebrew remains deferred until a published release supplies verifiable URL/checksum inputs.
5. Repository governance files and branch-protection policy remain incomplete.
6. The OpenSpec Spec-tab browser is Phase 2 and is not implemented in this branch.
