# iris design system 4.0 — "Electric"

> Implemented direction, updated 2026-08-21. iris adopts **Vision "Electric" v2.0**; the upstream contract is stored verbatim at [`vision-electric-v2.md`](./vision-electric-v2.md) and §11 below records exactly what is taken verbatim and what deviates. Generated design output is owned by `src/templates/`: `tokens.ts`, `styles.ts`, `icons.ts`, `script.ts`, `shell.ts`, `common.ts`, and `pages/*.ts`, with `design.ts` as the import barrel.

## 1. The one goal

A newcomer runs `iris` in any repo, opens one HTML file, and understands the repo in one shot: what it is, how it's shaped, what's moving, where to start. Every design decision below is judged against that sentence.

## 2. Market research

### 2.1 Competitive landscape

| Tool                             | Model                                       | What their UI does well                           | What iris does that they can't                                                       |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| DeepWiki                         | Hosted, auto-generated wiki per public repo | Zero-effort structural draft, conversational Q&A  | Works offline, private, deterministic, versioned with the repo                       |
| Mintlify                         | Docs-as-code SaaS, MDX in Git               | Polished reading experience, docs merge with code | No server, no account, no build pipeline                                             |
| Backstage TechDocs               | Self-hosted portal, Markdown → central hub  | Single pane for a whole org                       | Zero infrastructure; per-repo, file:// only                                          |
| GitBook / Docusaurus / Starlight | Doc sites                                   | Beautiful typography, strong IA                   | No site build; agents write JSON contracts, not prose                                |
| Swimm                            | IDE-coupled doc monitoring                  | Docs validated against code changes               | Explicit agent-authored contracts and rendering with no plugin or background watcher |

The gap iris occupies: **local-first, agent-writable, zero-infrastructure visual docs**. Nobody else renders straight from disk with no server. The UI must make that feel like a feature (instant, private, portable) rather than a limitation (plain, static).

### 2.2 Design takeaways from the current dev-tool landscape

- Dark-first is the standard for developer surfaces (Sentry, Supabase, Railway, Linear); light theme is derived from dark, not the reverse.
- The best dark UIs (Linear is the reference) get their quality from **contrast discipline and hierarchy** — near-black surfaces, muted borders, one accent — not from decoration or gradients.
- Hierarchy in dark mode comes from surface elevation steps, not shadows.
- Dashboards that people trust lead with a small number of legible numbers, then let users drill down; density is progressive, not uniform.

Sources: [Muzli dashboard examples 2026](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/), [925 Studios SaaS dashboard patterns](https://www.925studios.co/blog/saas-dashboard-design-examples-2026), [Aniq dark dashboard designs](https://www.aniq-ui.com/en/blog/dark-mode-dashboard-designs-2026), [Sourcegraph developer onboarding](https://sourcegraph.com/blog/developer-onboarding), [repowise codebase doc tool comparison](https://www.repowise.dev/blog/comparisons/best-codebase-documentation-tools-2026), [Mintlify documentation tools](https://www.mintlify.com/library/7-best-software-documentation-tools-in-2026), [GitBook top documentation tools](https://gitbook.com/blog/top-documentation-tools-2026), [Backstage TechDocs on DeepWiki](https://deepwiki.com/backstage/backstage/2.3-techdocs).

### 2.3 What this means for iris

The 3.x redesign reorganized the dashboard around the newcomer's first sixty seconds, and that information architecture is unchanged. What changed in 4.0 is the visual language: "Electra" was an interpretation made when no real system existed, and the real one — Vision "Electric" v2.0 — is now the source. Adopting its token names and class names, rather than re-skinning iris's own, is what lets the upstream document stay a truthful reference for what iris generates.

## 3. Identity: the instrument that reads a system

Vision's mark is the **radar** — the instrument that sweeps a space and reports what is there — rendered in `--primary` (electric violet). It is the sidebar brand, the Overview hero mark, and the visual anchor of the workspace.

The 3.x aperture ring and per-page aperture glyphs are **retired**. The ring encoded pages-by-type as arc segments; that information now reads as a labelled badge row in the hero — one badge per type carrying the typed Lucide icon, the type name, and its count. Badges say in text what the ring said in color, which is what the accessibility floor asked of the ring anyway.

Every icon is a Lucide 0.469.0 glyph serialised to inline SVG at generation time (§7).

## 4. Tokens

`tokens.css` is generated from `src/templates/tokens.ts` and is the only place a color literal may appear; `token-lint` enforces that for hex, `rgb`, `hsl`, `oklch`, `oklab`, `lab`, `lch`, `hwb`, and `color()` alike, and rejects any `var(--x)` in `src/` that nobody declares. `color-mix()` composes declared tokens and stays legal everywhere.

### 4.1 The Vision block

§2 of the upstream contract is embedded with its names and oklch values: `--background`, `--foreground`, `--card`, `--card-2`, `--code-bg`, `--border`, `--muted`; `--primary`, `--primary-fg`, `--accent-1..4`; `--success`, `--warning`, `--danger`, `--info`; `--glow`, `--shadow-card`; `--radius`, `--radius-sm`, `--radius-pill`, `--font-sans`, `--font-mono`.

Dark is the default theme; light is a peer, selected by `data-theme='light'` on `<html>`.

### 4.2 Reconciliation — the only edited values

iris validates every text pair at 4.5:1, every control boundary at 3:1, and every border at a 1.45:1 visibility floor, in both themes. Upstream values that miss a floor are moved by the smallest lightness step that clears it, and nothing else changes:

| Token              | Vision v2.0            | iris                    | Ratio before | Floor that required it   |
| ------------------ | ---------------------- | ----------------------- | ------------ | ------------------------ |
| dark `--border`    | `oklch(0.30 0.03 285)` | `oklch(0.355 0.03 285)` | 1.24–1.44:1  | border visibility 1.45:1 |
| light `--border`   | `oklch(0.90 0.01 285)` | `oklch(0.825 0.01 285)` | 1.20–1.35:1  | border visibility 1.45:1 |
| light `--accent-1` | `oklch(0.60 0.13 220)` | `oklch(0.54 0.13 220)`  | 3.69:1       | text 4.5:1 on `--card`   |
| light `--accent-2` | `oklch(0.65 0.15 65)`  | `oklch(0.57 0.15 65)`   | 3.35:1       | text 4.5:1 on `--card`   |
| light `--accent-3` | `oklch(0.60 0.17 140)` | `oklch(0.54 0.17 140)`  | 3.70:1       | text 4.5:1 on `--card`   |
| light `--accent-4` | `oklch(0.60 0.21 350)` | `oklch(0.59 0.21 350)`  | 4.42:1       | text 4.5:1 on `--card`   |
| light `--success`  | `oklch(0.55 0.15 155)` | `oklch(0.54 0.15 155)`  | 4.45:1       | text 4.5:1 on `--card`   |
| light `--warning`  | `oklch(0.65 0.15 70)`  | `oklch(0.57 0.15 70)`   | 3.33:1       | text 4.5:1 on `--card`   |
| light `--info`     | `oklch(0.55 0.13 220)` | `oklch(0.54 0.13 220)`  | 4.47:1       | text 4.5:1 on `--card`   |

Badge text is 11 px — normal text under WCAG AA — which is why the accent floor is 4.5:1 and not 3:1. The 1.45 border floor is an iris decision rather than a WCAG result, and the validator reports it under its own name so it is never mistaken for one.

Dark `--primary` and `--accent-1` fall outside sRGB. Browsers render the chroma-reduced color, so the validator gamut-maps the same way (hold lightness and hue, reduce chroma until it fits) before measuring; clamping channels instead would overstate their luminance.

### 4.3 The iris extension block

Vision covers a single-page report. The workspace needs more, all defined as aliases onto Vision tokens so the semantics stay Vision's:

| Extension                                                                                                                                 | Value                                                                                | Why                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `--nav-bg`                                                                                                                                | dark `oklch(0.13 0.02 285)`, light `var(--card)`                                     | the sidebar sits one step below the page in dark and reads as a white panel in light         |
| `--nav-text`, `--nav-active-text`, `--nav-active-bg`                                                                                      | `var(--muted)`, `var(--primary)`, `color-mix(… --primary 18%)`                       | Vision's badge-fill recipe applied to the current entry                                      |
| `--selected`, `--hover`                                                                                                                   | `color-mix(… --primary 14%)`, `var(--card-2)`                                        | selection and hover across dense surfaces                                                    |
| `--type-report/-feature/-bug/-idea/-plan/-research`                                                                                       | `--accent-1` / `--accent-3` / `--danger` / `--accent-4` / `--accent-2` / `--primary` | six record types onto Vision's wheel                                                         |
| `--priority-urgent/-high/-medium/-low`                                                                                                    | `--danger` / `--warning` / `--info` / `--muted`                                      | Vision status semantics                                                                      |
| `--code-fg`, `--code-muted`, `--code-comment`                                                                                             | constant across themes                                                               | the code block is dark in both themes, so its text cannot follow `--muted` (2.74:1 in light) |
| `--mmd-*`                                                                                                                                 | §8.1 theme variables and §8.2 classDef hexes, per theme                              | Mermaid parses colors itself and reads neither `oklch()` nor `var()`                         |
| `--size-*`, `--space-*`, `--leading-*`, `--weight-*`, `--duration-*`, `--easing`, `--nav-width`, `--nav-rail`, `--backdrop`, `--border-1` | unchanged from 3.x                                                                   | Vision defines no ramps                                                                      |

Print is a third palette, declared as a `@media print` override inside the token block for the same reason every other color lives there.

### 4.4 Encoding, and why colors repeat

Type badges: report cyan, feature lime, bug red, idea pink, plan amber, research violet. Status badges: draft muted, active violet, done green, archived muted with a dashed border — Vision's own treatment for a sixth category. Priority: urgent red, high amber, medium cyan, low muted. Health and command status share one scale: valid/complete/implemented/installed green, warning/incomplete/partial amber, invalid/missing red, stubbed muted.

A research badge and an active badge are both violet, and a bug badge and an error state are both red. That is accepted: the type name is always present as text, so color is never the only signal, and inventing extra hues would break §5's rule that a token means one thing everywhere.

### 4.5 Type

System stacks only, from Vision §2: `--font-sans` and `--font-mono`. No webfont is loaded or vendored — a generated page must render identically with no network. The size, leading, and weight ramps from 3.x are retained for the workspace surfaces Vision does not size.

## 5. Workspace information architecture

Unchanged from 3.1: one shell over per-section pages (`index.html` Overview, `work.html`, `spec.html`, `research.html`, `commands.html`, plus `pages/<id>/`, `research/<id>/`, `project/*.html`). The Overview summarizes and links; it never embeds another section's content. `renderShell` is depth-aware, everything in the shell is marked `data-iris-nav` so publish and export strip it, and `/`, `t`, `b` keep their meanings.

What changed is the chrome: the sidebar brand is the radar mark, section entries carry Lucide icons, and the theme control is Vision's two-button mode toggle (`data-theme-set`), which also dispatches `iris:theme`.

## 6. Component inventory

The vocabulary is Vision's. Where Vision and iris both defined something, Vision's rule ships and iris markup moved to it:

| 3.x                                                     | 4.0                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `.surface`                                              | `.card`                                                                  |
| `.pill`, `.type-chip`, `.status-chip`, `.priority-chip` | `.badge` + `.b-*` (plus iris's `.b-muted`, `.b-archived`)                |
| `.stat-tile`, `.metric-card`                            | `.card.stat` with `.value` / `.label` / `.sub`                           |
| `.callout.warn`                                         | `.callout.c-warn` (`c-info`, `c-danger`, `c-success`) with a Lucide icon |
| `.tab-button`                                           | `.tabs .tab`                                                             |
| `.button`, `.button-primary`                            | `.btn`, `.btn-primary`, `.btn-outline`, `.btn-ghost`                     |
| `.progress`                                             | `.meter` with `.track` / `.fill`                                         |
| `.theme-toggle`                                         | `.mode-toggle`                                                           |
| `.doc-layout` + right `.doc-toc`                        | `.layout` + sticky left `.toc`                                           |
| `.timeline-item` divs                                   | `.timeline` list items with `.when` / `.what`                            |
| `.aperture`, `.aperture-glyph`, `.tp-*`                 | removed; typed Lucide icon + badge                                       |

Vision components now available that iris did not have: `.steps`, `.evidence`, `.filetree`, `.flow`/`.node`/`.edge`, `.footnotes`, `details.ds`, `table.ds`, `pre.code` with `.tok-*`, `.confidence`, `.diagram`, `.chart-box`.

The iris layer adds only what Vision has no equivalent for: app grid, sidebar and nav items, topbar extension, crumbs, footer, page head, summary strip, Work rows/table/Kanban/drawer, Spec browser, command cards, document bodies, empty states, and the Mermaid figure.

Markdown output carries no classes, so `.doc-body table`, `.doc-body pre`, and `.doc-body code` mirror `table.ds`, `pre.code`, and Vision's inline-code rule by descendant selector.

The shell is a flex row rather than a two-column grid. `publish` and `export` strip the sidebar, and a grid keeps holding its column — which squeezed a standalone artifact's content into the sidebar's width. With flex, removing the sidebar reflows the content to full width with no artifact-specific rule.

## 7. Library policy

Hard constraints, unchanged: deterministic render, works from `file://`, no network at view time, no build step, classic (non-module) scripts, publish artifacts stand alone.

| Vision asks for         | iris verdict                   | How                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lucide via CDN UMD**  | **Adopted, inverted.**         | `lucide@0.469.0` is a generation-time dependency; `src/templates/icons.ts` serialises each icon's node tree to inline SVG at render time. Zero runtime, no `<script>`, no network, survives `publish`, and an unknown name throws at build instead of leaving an invisible gap.                                 |
| **Mermaid via ESM CDN** | **Adopted, vendored.**         | The pinned 11.17.0 classic bundle is copied locally by `iris vendor`. Themed with `theme: 'base'` and `themeVariables` read from the `--mmd-*` tokens, re-rendered on `iris:theme` from each figure's retained source, strict security and complexity bounds unchanged. ESM would be CORS-blocked on `file://`. |
| **Chart.js**            | **Not included.**              | The workspace has no chart surface. If one appears, the standing decision is CLI-generated inline SVG behind a chart contract, with a vendored classic bundle as the interactive upgrade.                                                                                                                       |
| **React Flow**          | **Rejected**, as in 3.1.       | A React runtime plus a bundler plus client state breaks the zero-build, framework-free, deterministic model. Mermaid flowcharts cover the real use cases.                                                                                                                                                       |
| **Animation**           | **CSS only, meaning-bearing.** | The aperture sweep is gone with the ring. What remains: the drawer entrance and 120 ms hover/focus transitions. `prefers-reduced-motion` disables both.                                                                                                                                                         |

## 8. Motion, accessibility, and quality floor

- Contrast: 4.5:1 text, 3:1 control boundaries, 1.45:1 borders, both themes, validated in CI over oklch and token aliases.
- Color is never the only signal: every type, status, priority, and health badge carries its name as text.
- Icons are `aria-hidden` when decorative and `role="img"` with a label when they carry meaning.
- Full keyboard operability; `:focus-visible` ring in `--primary`; the tablist follows the standard tab pattern.
- `prefers-reduced-motion: reduce` disables every transition and animation.
- Print is a declared palette; chrome, drawer, and TOC are hidden and Mermaid falls back to source.
- Responsive to 360 px: Vision's 900 px rules govern grids and the TOC; iris's 48 rem rule turns the sidebar into an overlay.

## 9. Migration record

Steps 1–9 of the 3.x plan shipped as described in git history. Step 10 is this change:

10. **Electric adoption (`electric-design-system`)** — Vision §2/§3 embedded with the measured reconciliation, generation-time Lucide icons, radar identity, token-themed Mermaid that re-renders on theme change, the validator taught oklch and token aliases, and the whole workspace migrated onto Vision's vocabulary.

## 10. Open questions

- Should research pages adopt Vision's §6 report blueprint (TL;DR → question → map → findings → …) as authored structure? Deliberately out of scope here; this change gives them the component language and header anatomy only.
- Vendor payload size: Mermaid is ~3.4 MB per repo. Still explicit, still opt-in.
- Should `iris publish` output default to the light theme, since shared artifacts are often pasted where dark blocks look heavy?

## 11. Relationship to Vision "Electric" v2.0

The upstream contract is [`vision-electric-v2.md`](./vision-electric-v2.md), stored verbatim. iris follows it except where a hard constraint of this project makes it impossible.

**Verbatim:** the §2 token names and values (except §4.2), the §3 component CSS, the §5 semantic color mapping, the §8.1 theme variables and §8.2 classDef fallbacks, and Lucide 0.469.0 as the icon set.

**Deviations, each with its reason:**

| Vision rule                                                                      | iris                                                                                        | Why                                                                                                                                                                                                 |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Light theme selected by `data-mode="light"`                                      | `data-theme='light'`                                                                        | The attribute predates the adoption and is read by `iris/config.yaml`, the stored preference, the tests, and the validator. Renaming it would change user-visible configuration for no design gain. |
| Tokens and components in one inline `<style data-ds="vision-electric">` per page | `iris/design/tokens.css` + `components/base.css`, inlined into `publish`/`export` artifacts | A workspace is many pages sharing one stylesheet; inlining per page would duplicate ~30 KB per file. Standalone artifacts do get one inline block, which is Vision's actual requirement.            |
| Never edit the token block                                                       | Nine lightness values moved                                                                 | Documented in §4.2 with the measured ratio and the floor. iris's accessibility contract predates the adoption and is enforced in CI.                                                                |
| Load Lucide, Mermaid, Chart.js, React Flow from pinned CDNs                      | Lucide inlined at generation time; Mermaid vendored locally; the other two not used         | A generated page must work from `file://` with no network, and `publish` refuses any artifact containing a resource reference.                                                                      |
| `vision:mode` event on theme change                                              | `iris:theme`                                                                                | Same contract under this project's event namespace.                                                                                                                                                 |
| Report structure per the §6 blueprint                                            | Not adopted here                                                                            | iris generates a workspace, not a single report. See §10.                                                                                                                                           |
| §8.2 hexes are the only permitted literals                                       | Also the `--mmd-*` theme variables, and all of them are tokens                              | Same intent — Mermaid cannot read custom properties — expressed so that `token-lint` still sees exactly one file containing color literals.                                                         |

The swap surface is `src/templates/tokens.ts`. A future Vision version is adopted by replacing that block, re-running `pnpm token-lint` to see which values miss a floor, recording the new reconciliation here, and regenerating.
