# iris status report

> Snapshot date: 2026-08-21 · branch `main` · read-only audit, no code changed.

## One-line summary

iris is a working 0.1 CLI (14 of 16 documented commands implemented, 10 test suites, 7-gate CI) with **4 open spec tasks, 2 stub commands, and 7 backlog items** — but an entire milestone of work (35 files, +2,911/−803) is sitting staged and uncommitted on `main`, and the npm package is not yet published.

## What iris is (for anyone landing here cold)

A plain Node.js CLI — no server, no AI runtime, no telemetry. You (or an AI coding agent) run `iris` commands in any repository; it writes JSON contracts under `iris/pages/<id>/data.json`, validates them against `schemas/`, and renders deterministic static HTML that opens straight from disk (`iris open`). It is **not** an agent-only skill: agents are one of its users, not a requirement. The Claude `/iris *` / Copilot / Codex "skills" mentioned in docs are planned thin wrappers around this same CLI (later milestone; see README "How it runs").

## Implementation state

| Area | State |
| --- | --- |
| Commands implemented | `init`, `render`, `report` (incl. `--from-session`), `publish`, `feature`, `bug`, `idea`, `plan`, `sync`, `adopt`, `archive`, `export` (`--single` only), `open`, `update` |
| Commands stubbed (exit 1) | `promote`, `vendor` |
| Export modes missing | `--png`, `--pdf` (blocked on approving a browser renderer) |
| Tests | 10 vitest suites in `tests/` |
| CI gates | lint, token-lint, typecheck, test, html-check, smoke:install (plus frozen-lockfile install) |
| Runtime deps | `ajv` only — zero front-end framework |
| Source size | ~2,600 lines of TypeScript in `src/` |
| Distribution | `@dgtalbug/iris` 0.1.0, **not yet on the public npm registry**; Homebrew deferred until a release URL + checksum exist |

## Pending work

### Open spec tasks — 4 of 48 unchecked

Active changes live in `openspec/changes/` (archive holds completed ones).

| Change | Done | Open tasks |
| --- | --- | --- |
| brew-formula-and-installability | 6/9 | 1.1 decide primary install story · 1.3 confirm formula matches local-first goals · 2.1 add release packaging/formula |
| standalone-publish-and-export | 11/12 | 2.2 implement PNG/PDF export modes |
| project-lifecycle-automation | 15/15 | none — complete, ready to archive |
| session-ingestion-and-reporting | 15/15 | none — complete, ready to archive |

### Backlog (`BACKLOG.md`, unscheduled)

VS Code webview extension · `iris publish` to gist · session-storage report ingestion · Reaviz swap behind chart contract · MCP wrapper · brew formula · themes marketplace.

### Not yet implemented but documented

`promote`, `vendor`, full `--json` output parity, generated agent-surface shims (Claude/Copilot/Codex), permalink algorithm (M2/M3).

## Risks and repo hygiene findings

1. **35 files staged but uncommitted on `main`** (+2,911/−803): the lifecycle, session-ingestion, publish/export, and html-check milestones exist only in the git index. One hard reset loses them. Highest-priority action: commit (ideally on a feature branch + PR, matching how PR #1 was done).
2. **Spec traceability is not versioned**: `.gitignore` excludes `openspec/*`, `.claude/*`, `.agents/*`, `.github/prompts/*`, `.github/skills/*`. Task history and decisions can't be recovered from a fresh clone, and CI can't see them.
3. **Direct-to-main history**: recent commits landed on `main` without PRs; no branch protection evident.
4. **Two Dependabot branches open** (`ajv` 8.18.0, `vitest` 3.2.6) awaiting merge decisions.
5. **Dogfood dashboard is empty**: `iris/state.json` has no pages, so the shipped `iris/index.html` shows the empty state — the repo does not yet demonstrate its own product.
6. **No LICENSE file** in the repo root despite `"license": "MIT"` in package.json; no CONTRIBUTING, CODEOWNERS, SECURITY, or PR/issue templates.

## Enterprise-readiness checklist

Current gaps against common professional/enterprise repo standards:

- [ ] LICENSE file (MIT text) at repo root
- [ ] CONTRIBUTING.md (setup, test, PR expectations — Quickstart exists in README, move/expand)
- [ ] CODEOWNERS + branch protection on `main` (require PR, passing CI, review)
- [ ] PR + issue templates
- [ ] SECURITY.md with a disclosure contact
- [ ] Conventional commits enforced (commitlint) → automated changelog + release (changesets or release-please) → npm publish with provenance
- [ ] CHANGELOG.md
- [ ] Version openspec/ history (or export decisions into docs/) so traceability survives a clone
- [x] CI with lint/typecheck/tests/smoke (already strong: 7 gates including generated-HTML link integrity)
- [x] Dependabot enabled
- [x] Strict TypeScript, pinned toolchain, frozen lockfile

## Suggested next moves (in order)

1. Commit the staged milestone work via a PR; archive the two completed openspec changes.
2. Publish 0.1.0 to npm (the smoke:install gate already verifies the artifact) so `npx @dgtalbug/iris init` works anywhere — this is the whole "newbie in any repo" promise.
3. Add the enterprise hygiene files above (one small PR).
4. Dogfood: render this repo's own overview/HLD pages so `iris/index.html` demonstrates the product.
5. UI overhaul per `docs/design-system.md` (market research + full redesign direction, written alongside this report).
