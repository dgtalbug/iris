## Context

The project has evolved from a local CLI plus render-first workflow into a tool that can generate deterministic HTML docs and publish artifacts. The remaining gap is distribution: users still need a clear, repeatable install path that matches the local-first model rather than a hosted service or remote backend.

## Goals / Non-Goals

**Goals:**
- Provide a stable install flow for the `iris` CLI.
- Support a Homebrew-friendly equivalent packaging entrypoint for easy setup.
- Keep the install story simple, offline-safe, and consistent with the Node-based project runtime.
- Add release validation around the key CLI commands.

**Non-Goals:**
- A hosted SaaS runtime or cloud-managed rendering service.
- Full platform marketing or marketplace expansion.
- Broad feature work unrelated to installability, release quality, and distribution.

## Decisions

- Keep the CLI as the primary product surface: installs should provide the same command interface users already know from the repo checkout.
- Use npm as the primary distribution path on macOS, Linux, and Windows with Node.js 22.13.0 or newer. The package entrypoint is implemented, cross-platform, versioned, and already exercised from a packed artifact outside the repository.
- Defer a real Homebrew formula until a published release supplies a stable source tarball URL and SHA-256 checksum. Do not mark formula work complete or ship placeholder metadata before those inputs exist.
- Publish from GitHub Releases through `.github/workflows/release.yml`. The workflow requires an exact `v<package version>` tag, repeats the full project gate, inspects the package payload, and uses npm trusted publishing with provenance instead of a long-lived automation token.
- Validate the installation path via a focused smoke test around `iris --help` and a minimal render command.
- Keep packaging offline-safe and local-first; the installer should not require any remote backend to work.

## Risks / Trade-offs

- [Install friction] → Mitigation: keep the install syntax minimal and document the supported path clearly.
- [Version drift] → Mitigation: tie the release and formula metadata to the package version and CI validation.
- [Packaging complexity] → Mitigation: start with a single, narrow distribution path instead of expanding into a wider ecosystem.
- [First-release account gate] → Mitigation: document the one-time npm package/trusted-publisher and GitHub environment setup; the repository contains no credentials and does not claim publication before that owner action.

## Migration Plan

1. Treat npm as the supported install and upgrade path; retain Node.js 22.13.0 as the minimum runtime.
2. Validate release tags, package metadata, the packed payload, and the installed command before publication.
3. Publish from a GitHub Release using npm trusted publishing and provenance after the owner configures the external trust relationship.
4. Add Homebrew only after a real release URL and checksum can be tested end to end.

## Open Questions

None. npm-first is decided; Homebrew is explicitly deferred on missing release artifacts rather than left ambiguous.
