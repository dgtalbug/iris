# iris status report

> Snapshot date: 2026-08-21 · branch `feat/phase-3-release-and-export-decisions` · implementation audit after stabilization, OpenSpec archival, Aperture, and release/export decisions.

## One-line summary

iris is a working 0.1 CLI with **14 of 16 documented commands implemented, 12 test suites, 7 CI gates, an npm release workflow, and 1 of 62 audited OpenSpec tasks still open**. Aperture is shipped and dogfooded; public npm publication and browser-rendered PNG/PDF remain external/design gates.

## What iris is

A plain Node.js CLI — no server, AI runtime, or telemetry. It writes JSON contracts under `iris/pages/<id>/data.json`, validates them against `schemas/`, and renders deterministic static HTML that opens directly from `file://`. Agents are supported users of the same CLI, not a runtime dependency.

## Implementation state

| Area | State |
| --- | --- |
| Commands implemented | `init`, `render`, `report` (including `--from-session`), `publish`, `feature`, `bug`, `idea`, `plan`, `sync`, `adopt`, `archive`, `export --single`, `open`, `update` |
| Commands stubbed (exit 1) | `promote`, `vendor` |
| Export modes deferred | `--png`, `--pdf`; task remains open pending a browser-pinning and determinism policy |
| Tests | 12 Vitest suites, including token-contract and release-packaging coverage |
| CI gates | lint, token-lint, typecheck, test, html-check, smoke:install, plus frozen-lockfile install |
| Runtime deps | `ajv` only; no front-end framework or remote render dependency |
| Distribution | npm-first package `@dgtalbug/iris` 0.1.0; release workflow ready, public publication not yet performed |
| Dogfood | six repository documents adopted into the Aperture dashboard; 13 generated HTML files pass link integrity |

## OpenSpec state

The five audited structured changes contain 62 tasks: **61 complete, 1 open**.

| Change | State | Open tasks |
| --- | --- | --- |
| brew-formula-and-installability | 9/9 implementation tasks complete; external release proof pending | none; Homebrew is an explicit future change after a release URL and checksum exist |
| standalone-publish-and-export | 11/12 active | 2.2 PNG/PDF export; explicitly deferred |
| project-lifecycle-automation | 15/15 archived | none |
| session-ingestion-and-reporting | 15/15 archived | none |
| design-system-aperture | 11/11 verified and archived | none |

## What changed in this audit

- The staged 35-file lifecycle/session/publish milestone was committed and merged through PR #4.
- OpenSpec history is versioned; `.claude/*` remains ignored.
- Dependabot AJV 8.18.0 and Vitest 3.2.6 updates were rebased, tested, and merged.
- Completed lifecycle/session changes were verified, synced to canonical specs, archived, and merged through PR #5.
- Aperture steps 1–3 shipped with contrast validation, accessible components, responsive dashboard IA, classic offline runtime, and real dogfood content through PR #6.
- npm-first distribution is decided. Release automation validates the tag, full test gate, package payload, OIDC trusted publishing, and provenance.
- Homebrew is deferred until a real release artifact supplies a stable URL and SHA-256.
- Browser export evaluation prefers `puppeteer-core` over Playwright for a future narrow renderer, but neither currently satisfies the deterministic local-install contract without a new browser policy.

## Remaining risks and gates

1. **npm owner gate:** `@dgtalbug/iris` is not yet public. The owner must bootstrap the package if needed, configure `release.yml` as the npm trusted publisher, protect/approve the GitHub `npm` environment, and publish a matching GitHub Release.
2. **PNG/PDF determinism:** system Chrome avoids a browser download but drifts by installed version; a pinned Playwright browser adds a separate download and large cache. Task 2.2 remains open until that trade-off is accepted.
3. **Homebrew inputs:** no formula should ship before a real release URL and checksum can be tested.
4. **Repository governance:** LICENSE, CONTRIBUTING, CODEOWNERS, SECURITY, PR/issue templates, branch protection, commitlint, changelog automation, and release notes policy remain incomplete.
5. **Deferred product scope:** `promote`, `vendor`, generated agent-surface shims, full `--json` parity, permalink work, Mermaid, and chart blocks remain later milestones.

## Enterprise-readiness checklist

- [ ] LICENSE file at repo root
- [ ] CONTRIBUTING.md
- [ ] CODEOWNERS + branch protection on `main`
- [ ] PR + issue templates
- [ ] SECURITY.md
- [ ] Conventional commits enforced with commitlint
- [ ] CHANGELOG.md / release-notes policy
- [x] Versioned OpenSpec history
- [x] CI with lint, typecheck, tests, token/HTML integrity, and packed-install smoke
- [x] Dependabot updates integrated
- [x] npm release workflow with exact tag validation, trusted-publishing OIDC, and provenance

## Suggested next moves

1. Complete the npm owner/trusted-publisher setup, run the release workflow manually as a dry verification, then publish the first matching GitHub Release.
2. Verify the public install path, then archive `brew-formula-and-installability` after the first npm release succeeds.
3. Open a dedicated browser-renderer policy change before implementing PNG/PDF.
4. Add the repository governance files and branch protection.
5. Continue Aperture later changes separately: `iris vendor`, diagram/chart blocks, then richer dogfood types.
