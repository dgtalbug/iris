## Context

The project already has a working local-first CLI and deterministic HTML render flow. The gap is productization: users need a stable install story, release metadata, and a validation path that confirms the binary works after installation.

## Goals / Non-Goals

**Goals:**
- Define the primary install path for the CLI.
- Ensure the package or release artifact exposes consistent version information.
- Add a repeatable smoke check for post-install verification.
- Keep the install story aligned with the project’s offline-safe approach.

**Non-Goals:**
- Remote hosted publishing or SaaS delivery.
- Broad platform or framework changes outside the installability/release slice.
- Reworking the render pipeline itself.

## Decisions

- Install path first: prefer a single clear install story over multiple overlapping options. This reduces confusion and keeps documentation honest.
- Versioned package metadata: every install path should expose a release and upgrade model, not just a local repo checkout.
- Smoke-check as a release gate: validate the installed binary in a clean environment before it is treated as a supported path.
- Keep the workflow local-first: installation should not require the user to hand-hold a remote service or rely on hosted infrastructure for the core workflow.

## Risks / Trade-offs

- [Ambiguous supported environments] → Mitigation: document the minimum supported Node/runtime environment and validate it explicitly.
- [Packaging drift] → Mitigation: use a single package metadata source and verify install checks against the produced artifact.
- [Installer complexity] → Mitigation: keep the release surface narrow and avoid adding hidden remote dependencies for basic use.

## Migration Plan

1. Choose the primary install story and versioning surface for the CLI.
2. Add or formalize the release metadata needed for packaging and upgrades.
3. Add the smoke-check command or script that validates a clean install.
4. Document the install, upgrade, and validation path for users and release maintainers.

## Open Questions

None at this stage; the problem is narrow and the scope is kept to installation and release validation.
