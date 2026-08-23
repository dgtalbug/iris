---
title: Decisions
status: active
---

# Decisions

The decision log of `iris`: what was chosen, when, and why the alternatives lost. Each row is traceable to an archived change under `openspec/changes/archive/`. Reversed decisions stay and are marked superseded.

## Decisions

| Date       | Decision                                                                                       | Why                                                                                                                                              | Status     |
| ---------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 2026-08-18 | Node.js >=22.13 with strict-ESM TypeScript and Ajv runtime validation                          | Matches the pnpm 11 baseline; an invalid contract must fail loudly rather than render a partial page                                              | accepted   |
| 2026-08-18 | Centralise design tokens and base components under a generated `iris/design` scaffold          | Deterministic `file://` rendering with no CDN, and offline vendoring stays possible                                                               | accepted   |
| 2026-08-18 | Enforce token literals with `token-lint` in CI                                                 | A colour written outside the token block is style drift that review will not reliably catch                                                       | accepted   |
| 2026-08-19 | Load base components as a classic deferred script, never a module                              | Browsers CORS-block module scripts on `file://`, which would kill interactivity in the primary viewing mode                                       | accepted   |
| 2026-08-19 | Publish strips navigation chrome via `data-iris-nav`                                           | Local HTML must be navigable; a published artifact must stand alone                                                                               | accepted   |
| 2026-08-19 | Enforce generated-link integrity with `html-check` in CI                                       | A broken reference inside generated HTML must fail the build, not the reader                                                                      | accepted   |
| 2026-08-21 | Make `iris init` the complete agent-first setup and upgrade operation                          | Removes document ingestion and hidden lifecycle coupling; one canonical offline skill reaches three agent surfaces safely                         | accepted   |
| 2026-08-21 | Read OpenSpec as bounded untrusted filesystem input, never via the OpenSpec CLI                | No runtime dependency, no server, no network; malformed input degrades to a per-path warning instead of failing the page                          | accepted   |
| 2026-08-21 | Ship the Spec record detail as a hash-addressed classic-script data bundle                     | The index, its counts, and every source path stay readable without JavaScript; only opening a record needs it                                     | accepted   |
| 2026-08-21 | Defer PNG/PDF export until a browser-pinning policy is approved                                | System Chrome is not version-stable and Playwright adds a large pinned-browser lifecycle; the CLI refuses those modes rather than mislabel HTML   | accepted   |
| 2026-08-23 | Adopt Vision "Electric" v2.0 as the design system                                              | One oklch token block with an iris extension, validated for contrast in CI, replacing the earlier Aperture palette                                | accepted   |
| 2026-08-23 | Enforce the supported Node floor inside the CLI itself                                         | `engines` is advisory for both `npx` and `pnpm dlx`, so the package manager cannot be relied on to enforce it                                     | accepted   |
| 2026-08-23 | Record a front-matter digest in the managed marker and bump the marker schema to 2             | Without it a changed skill description never reaches an installed repository; ownership must be provable before anything is rewritten             | accepted   |
| 2026-08-23 | One packaged-asset manifest shared by release verification and the install smoke test          | Two hand-written lists are how `templates/project` came to be required by one check and unverified by the other                                   | accepted   |
| 2026-08-23 | Document install as `npx`, `pnpm dlx`, and `pnpm add -g`; no `npm install -g`                  | The registry that hosts the artifact is named separately from the commands used to fetch it, so the docs stay honest without implying two channels | accepted   |
| 2026-08-23 | Keep `npm publish --provenance` rather than switching to pnpm's native OIDC publish            | Changing the publish mechanism in the release that first exercises it leaves nothing known-good to compare against                                | accepted   |
| 2026-08-23 | Ship no Homebrew formula until a published tarball URL and checksum exist                      | A formula is a claim about an artifact; there is no artifact to claim yet, and `iris` is already taken in homebrew-cask so the tap must be qualified | accepted   |
| 2026-08-23 | Hold TypeScript at 6.x                                                                         | `typescript-eslint` runs against the TS 6 API but refuses TS 7.0, tracked in typescript-eslint#10940, so the lint gate cannot run on a TS 7 tree  | accepted   |
| 2026-08-23 | Tab panels sit inside a `.card`, so panel padding is vertical only                             | The generic panel assumed a padded container that the Spec and contract pages never provided, leaving artifact prose at 2px of side padding        | accepted   |
