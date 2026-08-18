# M2 typed templates + distribution

- Proposed: move iris from scaffold/design-system baseline into a typed, contract-first rendering layer with distribution tooling for local publishing and shareable artifacts.
- Status: proposed

## Problem

The repo now has a strict CLI shell, valid JSON contract envelopes, and a tokenized offline dashboard. That foundation is sufficient to render deterministic HTML, but the project still lacks the template layer that turns each contract type into a reliable visual structure and the distribution surface that makes the render useful outside a single local repo.

## Scope

1. Typed template registry
   - Define the canonical contract-to-template mapping for the core page types already modeled in the schema set.
   - Ensure every template is deterministic, offline, and driven by contract data rather than ad hoc HTML.
   - Require a contract schema validation gate before render.

2. Template authoring model
   - Add a reusable `template` abstraction with fixed section slots for text, metrics, timeline, code, charts, markdown, and flow views.
   - Keep layout decisions in versioned template files instead of generator logic.
   - Preserve reduced-motion behavior and the existing tokens-first design system.

3. Distribution tooling
   - Deliver a CLI path for publishing a rendered page as a portable static artifact.
   - Add a local `iris publish` flow for gist-like or single-file publish targets without requiring a server.
   - Support `iris report --from-session` as a structured extraction workflow for agent session artifacts.

4. Package and installability
   - Harden the local distribution story for a CLI install workflow (`brew` and local package install path).
   - Keep all rendering and publish steps fully offline and file:// compatible.

5. Quality gates
   - Add contract-based template tests for each major type.
   - Add snapshot-style render validation to prevent template regressions.
   - Keep the existing token lint and typecheck gates in CI.

## Acceptance criteria

- Every supported contract type resolves to one typed template with a fixed, documented section structure.
- Rendering fails fast when a contract is invalid, with clear schema errors and no partial output.
- A published page can be generated as a standalone artifact without any server-side dependency.
- `iris publish` and `iris report --from-session` are documented and runnable from a clean repo state.
- The package install story remains local-first and offline-safe.
- Dashboard, archive, and report outputs all use the same tokenized foundation and visual language.

## Out of scope

- SaaS hosting or remote render services.
- Authentication or user accounts.
- Telemetry or remote analytics.
- Generic AI analysis engine features.
- Any feature that depends on a live network at render time.

## Dependencies

- Completed M0 scaffold and schema validation baseline.
- Completed M1 tokenized design system and dashboard foundation.
- Existing contract schemas and CLI command structure.

## Notes

This milestone should stay narrow: the goal is not a big platform rewrite, but a clean contract-to-template rendering layer that makes iris genuinely sharable and distributable without abandoning the local-first design philosophy.
