# iris technical decisions

## Stack decisions (pinned)

- Node.js >=22.13.0 + TypeScript 5.9.2 strict ESM — modern runtime + deterministic tooling. The floor is duplicated in `src/lib/runtime.ts` and pinned to `engines.node` by a test, because `engines` is advisory for `npx` and `pnpm dlx` and the CLI has to enforce it itself.
- Ajv 8.20.0 — strict JSON Schema validation with explicit errors.
- markdown-it 15.0.0 — generation-time Markdown rendering with embedded HTML disabled.
- TypeScript stays on 5.9.2: `typescript-eslint` refuses TS 7.0 outright and tracks TS >=7.1 support in typescript-eslint#10940, so the lint gate cannot run until it lands.
- Vitest 4.1.11 + ESLint 10.8.1 + Prettier 3.9.6 — test and quality baseline. `vitest.config.ts` pins the suite to `tests/`, because `tsc` also emits the compiled tests to `dist/` and Vitest 4 would otherwise collect them as a second, broken copy.
- Mermaid 11.17.0 — pinned production dependency copied locally by `iris vendor`; never loaded from a CDN at view time.
- Lucide 1.33.0 — pinned production dependency read only at generation time; icon geometry is serialised to inline SVG, so no icon script, font, or request reaches a generated page. 1.x ships each icon as its child nodes alone, so the root SVG attributes are declared in `src/templates/icons.ts` rather than read from the package; they are Lucide's own defaults, unchanged from 0.x.

## Data-contract design

Envelope schema plus per-type schemas; rendering is blocked on invalid contracts.

## Rendering model

Three editable sources produce deterministic HTML: JSON contracts at `iris/pages/<id>/data.json`, Markdown research at `iris/research/<id>/index.md`, and Markdown project docs at `iris/project/<name>.md`. Contracts and research render to a `page.html` beside their source and feed one Work projection; project docs render to `iris/project/<name>.html` as managed output.

Browsers treat every local file as its own opaque origin, so a `file://` page cannot read a sibling file: `fetch` fails with `TypeError: Failed to fetch` and `XMLHttpRequest` fails with `status 0`. A classic `<script src>` is the one local-load mechanism that still works, which is why the vendored Mermaid runtime loads that way and why the Spec section ships its record detail as a generated data bundle rather than reading Markdown at view time. The bundle escapes every `<` so no record can terminate the script element or open an HTML comment.

The workspace is a set of static `file://`-compatible pages that share one generated shell: `index.html` (Overview), `work.html`, `spec.html`, `research.html`, `commands.html`, contract pages, and project docs. The shell is depth-aware — every asset and navigation reference is relative — and is marked `data-iris-nav` so publish and export strip it. Splitting sections into separate files keeps each page small enough for an agent to read without pulling in the whole OpenSpec snapshot.

Research Markdown is read by a bounded local walker (sorted, symlink-refusing, repository-confined, 256 KB per file, 500 directories) and rendered through the same safe Markdown pipeline as OpenSpec artifacts, with opt-in heading ids so a document page can carry a table of contents. Heading ids stay opt-in because the Spec page renders many documents into one page, where generated ids would collide. Project doc sources are read the same way, limited to the five fixed file names.

The CLI command surface is declared once in `src/lib/command-catalog.ts`; `iris --help` and the generated `commands.html` both read it, and each entry carries an explicit `implemented`, `partial`, or `stubbed` status.

## OpenSpec filesystem model

Iris reads OpenSpec as bounded, untrusted local input without invoking the OpenSpec CLI. A sorted allowlisted walker recognizes `project.md`, `config.yaml`, canonical `specs/**/spec.md`, structured active/archive change artifacts and delta specs, and legacy archive Markdown. It preserves nested capability paths, refuses symlinks and escapes, caps depth/file count/file bytes/aggregate bytes, and isolates errors by path.

The parser extracts headings, requirements, scenarios, delta-operation labels, and task checkboxes outside fenced examples. A pinned generation-time `markdown-it` renderer converts Markdown to semantic HTML with embedded HTML, automatic linkification, unsafe destinations, and active images disabled; YAML is never interpreted. Exact `mermaid` fences emit escaped source-first diagram hosts. A pinned local classic script progressively renders each host independently with Mermaid strict security, click/HTML behavior disabled, fixed source/edge limits, and isolated failure. Every artifact retains bounded escaped source and actionable warnings, and Iris does not claim OpenSpec semantic validation.

`iris/spec.json` is a versioned deterministic generated snapshot with no timestamp. `iris init`, bare `iris render`, and `iris render --all` replace it atomically. Single-page render, report, archive, publish preparation, and update reuse the stored snapshot, so there is no watcher or hidden synchronization.

## Initialization and state model

`iris init` is the single setup and upgrade operation. Version 2 state stores only the page registry needed for active/archive navigation. Explicit `iris render <id>|--all` regenerates page HTML and the dashboard; there is no document mirroring, source monitoring, stale-source state, watcher, or background synchronization.

The initializer reads version 1 state only long enough to classify legacy active document mirrors. It removes an exact page directory only when safe path, state provenance, page identity, generated metadata, and both stored data hashes match the current bytes. Every mismatch and every archived record is preserved before state is normalized to version 2.

Agent instructions come from two packaged sources: `templates/agents/iris-workspace.md` for the skill and `templates/agents/iris-commands.md` for the generated `/iris:*` command and prompt files. One descriptor-driven installer writes every surface, so skills and commands share the same versioned managed markers, SHA-256 digests of both the managed body and the generated front matter, confinement and symlink checks, and atomic writes. Intact managed regions update atomically together with the front matter above them, so a changed skill or command `description` reaches an already-initialized repository — but only when the bytes on disk hash to the recorded digest, or, for a surface written before ownership was recorded, match verbatim what this or an earlier release generated. Unmarked, malformed, edited, symlinked, escaping, or unattributable targets are preserved and reported. An older Iris meeting a newer marker fails its own pattern match and preserves the file rather than corrupting it.

## Permalink algorithm

Reserved for M2/M3: derive host/org/repo from remote URL and emit commit-anchored blob links.

## Animation policy

Meaning-bearing only with reduced-motion fallback to static frame at frame zero.

## Distribution model

The built npm package is the primary, verified Node entrypoint on macOS, Linux, and Windows. It includes the canonical agent template, so initialization needs no network after installation. GitHub Release publication is automated through npm trusted publishing and provenance after the owner configures the external trust relationship. Contributors use pnpm locally. The installed CLI has no server or telemetry, and rendering makes no network request.

Decisions taken for the 0.3.0 release:

- **Documented install paths are `npx`, `pnpm dlx`, and `pnpm add -g`; `npm install -g` is not one of them.** The registry that hosts the artifact is named separately from the commands used to fetch it, so the documentation stays honest without implying a second distribution channel. The `pnpm setup` prerequisite and pnpm's default one-day `minimumReleaseAge` are stated next to the commands they affect, because both look like a broken release when they are not.
- **Homebrew ships nothing until a published tarball URL and checksum exist.** A formula is a claim about an artifact; there is no artifact to claim yet.
- **One packaged-asset manifest, `scripts/packaged-assets.mjs`, is read by both release verification and the install smoke test.** Two hand-written lists are how `templates/project` came to be required by one check and unverified by the other; a test asserts every packaged template and schema on disk appears in the manifest.
- **`CHANGELOG.md` is the single source of release notes,** and release verification fails when the version being released has no section, so a release cannot be cut with none.
- **The publish step keeps `npm publish --provenance`.** pnpm's native OIDC publish is a viable simplification, but changing the publish mechanism in the same release that first exercises it would leave nothing known-good to compare against; it is a follow-up once one green OIDC publish exists.
- **`prepack` is package-manager-neutral (`tsc -p tsconfig.json`)** so packing works under whichever client a consumer or CI runs, and `package-lock.json` is gone from this pnpm project.

`iris vendor` resolves Mermaid from the installed Iris dependency, checks the exact expected version, and atomically copies `mermaid.min.js` plus the upstream MIT license into `iris/design/vendor/`. Initialization writes a tiny inert placeholder at that script path so generated references remain valid before vendoring; it does not download or silently vendor the 3.4 MB bundle. Standalone publishing removes project-relative scripts and keeps Mermaid source fallback rather than embedding the runtime or claiming an SVG snapshot.

## License notes

MIT at package level; vendored third-party assets retain upstream licenses in vendor directory.

## Rejected alternatives

- MCP server: rejected for v1 local-file scope.
- Reaviz: rejected to avoid extra runtime weight and contract lock-in.
- IconScout primary icons: rejected (secondary only) to keep Lucide as default.
- Lucide's browser UMD and `createIcons()`: rejected in favour of generation-time serialisation, which keeps published artifacts free of scripts and makes an unknown icon name a build failure rather than an invisible gap.
- React Flow and Chart.js from Vision's pinned manifest: rejected; a React runtime breaks the zero-build model and the workspace has no chart surface.
- SaaS dashboard: rejected to preserve offline local-first model.
- Bundling GitNexus: rejected because GitNexus remains external source-of-truth.
- Hand-written agent HTML: rejected in favor of strict contract-to-template flow.

## Decision log (append-only)

| date       | decision                                                                                                                             | why                                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-18 | Start with Node22.13 + TS strict ESM and Ajv runtime validation                                                                      | Matches pnpm 11 requirements and keeps a modern runtime baseline                                                                                   |
| 2026-08-18 | Centralize design tokens and base components under `iris/design` scaffold                                                            | Enables deterministic file:// rendering and easy vendor/offline mode                                                                               |
| 2026-08-18 | Enforce token literals through token-lint script in CI                                                                               | Prevents style drift outside tokens.css                                                                                                            |
| 2026-08-18 | Keep OpenSpec milestone records under `openspec/changes/archive`                                                                     | Dogfoods lifecycle traceability from day zero                                                                                                      |
| 2026-08-19 | Preserve user-owned editor tasks while updating only iris-managed surfaces                                                           | Lifecycle updates must not clobber user content                                                                                                    |
| 2026-08-19 | Load base components as a classic deferred script instead of a module                                                                | Browsers CORS-block module scripts on file://, killing interactivity                                                                               |
| 2026-08-19 | Dashboard links every page; publish strips nav chrome via data-iris-nav                                                              | Local HTML must be navigable, published artifacts must stand alone                                                                                 |
| 2026-08-19 | Enforce generated-link integrity with html-check in CI                                                                               | A broken reference in generated HTML must fail the build                                                                                           |
| 2026-08-21 | Ship Aperture steps 1–3 with contrast-safe text aliases and no remote loaders                                                        | Preserves the specified palette, 4.5:1 readable text, and strict offline classic-script rendering while vendor/diagram/chart work remains deferred |
| 2026-08-21 | Make npm the primary install path and gate publication on an exact release tag, full checks, OIDC trusted publishing, and provenance | The cross-platform packed CLI is already verified; Homebrew lacks the release URL and checksum required for an honest formula                      |
| 2026-08-21 | Defer PNG/PDF export; prefer puppeteer-core only after accepting a browser-pinning and determinism policy                            | System Chrome avoids downloads but is not version-stable; Playwright's supported pinned browser adds a separate large download lifecycle           |
| 2026-08-21 | Make `iris init` the complete agent-first setup and upgrade operation                                                                | Removes document ingestion and hidden lifecycle coupling while shipping one canonical offline agent skill safely to three supported surfaces       |
| 2026-08-21 | Persist a bounded OpenSpec snapshot for the dashboard Spec tab                                                                       | Keeps explicit refresh semantics while allowing every dashboard regeneration to remain deterministic and offline                                   |
| 2026-08-21 | Render OpenSpec Markdown at generation time with embedded HTML disabled                                                              | Improves readability without adding browser runtime or weakening exact-source evidence                                                             |
| 2026-08-21 | Render exact Mermaid fences through an explicitly vendored strict classic runtime with source fallback                               | Adds useful offline diagrams without remote loaders, runtime modules, active diagram behavior, or all-or-nothing failure                           |
| 2026-08-21 | Adopt Vision "Electric" v2.0 token and class names as iris's own vocabulary                                                          | Makes the upstream contract a truthful reference for generated output and reduces a future restyle to a token-block swap                           |
| 2026-08-21 | Keep oklch tokens and teach the contrast validator gamut mapping and token aliases instead of converting to hex                      | Preserves that swap surface; browsers render out-of-gamut colors chroma-reduced, so the validator must measure the color that is actually shown    |
| 2026-08-21 | Move nine upstream lightness values to meet iris's 4.5:1, 3:1, and 1.45:1 floors, recording each                                     | Badge text is normal text under WCAG AA; the accessibility contract predates the adoption and is enforced in CI                                    |
| 2026-08-21 | Serialise Lucide icons to inline SVG at generation time rather than loading its browser runtime                                      | A generated page must work from file:// with no network, and publish refuses any artifact containing a resource reference                          |
| 2026-08-21 | Retire the aperture ring and glyphs for Vision's radar mark and a pages-by-type badge row                                            | The badge row states in text what the ring encoded in color, which the accessibility floor required of the ring anyway                             |
