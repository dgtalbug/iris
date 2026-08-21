## Context

The project has evolved from a local CLI plus render-first workflow into a tool that can generate deterministic HTML docs and publish artifacts. The remaining gap is distribution: users still need a clear, repeatable install path that matches the local-first model rather than a hosted service or remote backend.

## Goals / Non-Goals

**Goals:**
- Provide a stable install flow for the `iris` CLI.
- Support a Homebrew formula or equivalent packaging entrypoint for easy setup.
- Keep the install story simple, offline-safe, and consistent with the Node-based project runtime.
- Add release validation around the key CLI commands.

**Non-Goals:**
- A hosted SaaS runtime or cloud-managed rendering service.
- Full platform marketing or marketplace expansion.
- Broad feature work unrelated to installability, release quality, and distribution.

## Decisions

- Keep the CLI as the primary product surface: installs should provide the same command interface users already know from the repo checkout.
- Prefer a minimal distribution path that works well with the current project layout: Homebrew formula first, with the Node package entrypoint as the underlying compatibility layer.
- Validate the installation path via a focused smoke test around `iris --help` and a minimal render command.
- Keep packaging offline-safe and local-first; the installer should not require any remote backend to work.

## Risks / Trade-offs

- [Install friction] → Mitigation: keep the install syntax minimal and document the supported path clearly.
- [Version drift] → Mitigation: tie the release and formula metadata to the package version and CI validation.
- [Packaging complexity] → Mitigation: start with a single, narrow distribution path instead of expanding into a wider ecosystem.

## Migration Plan

1. Define the target install path and packaging contract for the CLI.
2. Add release/version metadata and ensure the built command resolves correctly.
3. Add smoke checks for the installed command and minimal render flow.
4. Document the install steps and expected upgrade behavior.

## Open Questions

None at this stage; the next step is to formalize the install path and keep it deliberately narrow.
