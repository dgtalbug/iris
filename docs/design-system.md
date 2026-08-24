# iris design system 4.0 — "Iris Electric"

> Implemented direction, updated 2026-08-23. **Iris Electric** is iris's native design system: one token block, one component vocabulary, and one semantic color law shared by every page iris generates, so a future redesign is a token-block swap rather than a rewrite. Generated design output is owned by `src/templates/`: `tokens.ts`, `styles.ts`, `icons.ts`, `script.ts`, `shell.ts`, `common.ts`, and `pages/*.ts`, with `design.ts` as the import barrel.

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

The 3.x redesign reorganized the dashboard around the newcomer's first sixty seconds, and that information architecture is unchanged. What changed in 4.0 is the visual language: "Electra" was an interpretation made when no real system existed; Iris Electric is the real one — a measured token block, a component vocabulary, and a semantic color law that every generated page shares.

## 3. Identity: the instrument that reads a system

The Iris Electric mark is the **radar** — the instrument that sweeps a space and reports what is there — rendered in `--primary` (electric violet). It is the sidebar brand, the Overview hero mark, and the visual anchor of the workspace.

The 3.x aperture ring and per-page aperture glyphs are **retired**. The ring encoded pages-by-type as arc segments; that information now reads as a labelled badge row in the hero — one badge per type carrying the typed Lucide icon, the type name, and its count. Badges say in text what the ring said in color, which is what the accessibility floor asked of the ring anyway.

Every icon is a Lucide 0.469.0 glyph serialised to inline SVG at generation time (§9).

## 4. Tokens

`tokens.css` is generated from `src/templates/tokens.ts` and is the only place a color literal may appear; `token-lint` enforces that for hex, `rgb`, `hsl`, `oklch`, `oklab`, `lab`, `lch`, `hwb`, and `color()` alike, and rejects any `var(--x)` in `src/` that nobody declares. `color-mix()` composes declared tokens and stays legal everywhere.

### 4.1 The Iris Electric block

The base block declares `--background`, `--foreground`, `--card`, `--card-2`, `--code-bg`, `--border`, `--muted`; `--primary`, `--primary-fg`, `--accent-1..4`; `--success`, `--warning`, `--danger`, `--info`; `--glow`, `--shadow-card`; `--radius`, `--radius-sm`, `--radius-pill`, `--font-sans`, `--font-mono`.

Dark is the default theme; light is a peer, selected by `data-theme='light'` on `<html>`.

### 4.2 Contrast floors — the only edited values

iris validates every text pair at 4.5:1, every control boundary at 3:1, and every border at a 1.45:1 visibility floor, in both themes. A value that misses a floor is moved by the smallest lightness step that clears it, and nothing else changes. The shipped reconciliations:

| Token              | Value                   | Floor that set it        |
| ------------------ | ----------------------- | ------------------------ |
| dark `--border`    | `oklch(0.355 0.03 285)` | border visibility 1.45:1 |
| light `--border`   | `oklch(0.825 0.01 285)` | border visibility 1.45:1 |
| light `--accent-1` | `oklch(0.54 0.13 220)`  | text 4.5:1 on `--card`   |
| light `--accent-2` | `oklch(0.57 0.15 65)`   | text 4.5:1 on `--card`   |
| light `--accent-3` | `oklch(0.54 0.17 140)`  | text 4.5:1 on `--card`   |
| light `--accent-4` | `oklch(0.59 0.21 350)`  | text 4.5:1 on `--card`   |
| light `--success`  | `oklch(0.54 0.15 155)`  | text 4.5:1 on `--card`   |
| light `--warning`  | `oklch(0.57 0.15 70)`   | text 4.5:1 on `--card`   |
| light `--info`     | `oklch(0.54 0.13 220)`  | text 4.5:1 on `--card`   |

Badge text is 11 px — normal text under WCAG AA — which is why the accent floor is 4.5:1 and not 3:1. The 1.45 border floor is an iris decision rather than a WCAG result, and the validator reports it under its own name so it is never mistaken for one.

Dark `--primary` and `--accent-1` fall outside sRGB. Browsers render the chroma-reduced color, so the validator gamut-maps the same way (hold lightness and hue, reduce chroma until it fits) before measuring; clamping channels instead would overstate their luminance.

### 4.3 The iris extension block

The base system covers a single-page report. The workspace needs more, all defined as aliases onto base tokens so the semantics stay the system's:

| Extension                                                                                                                                 | Value                                                                                | Why                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `--nav-bg`                                                                                                                                | dark `oklch(0.13 0.02 285)`, light `var(--card)`                                     | the sidebar sits one step below the page in dark and reads as a white panel in light         |
| `--nav-text`, `--nav-active-text`, `--nav-active-bg`                                                                                      | `var(--muted)`, `var(--primary)`, `color-mix(… --primary 18%)`                       | the badge-fill recipe applied to the current entry                                           |
| `--selected`, `--hover`                                                                                                                   | `color-mix(… --primary 14%)`, `var(--card-2)`                                        | selection and hover across dense surfaces                                                    |
| `--type-report/-feature/-bug/-idea/-plan/-research`                                                                                       | `--accent-1` / `--accent-3` / `--danger` / `--accent-4` / `--accent-2` / `--primary` | six record types onto the accent wheel                                                       |
| `--priority-urgent/-high/-medium/-low`                                                                                                    | `--danger` / `--warning` / `--info` / `--muted`                                      | the status semantics                                                                         |
| `--code-fg`, `--code-muted`, `--code-comment`                                                                                             | constant across themes                                                               | the code block is dark in both themes, so its text cannot follow `--muted` (2.74:1 in light) |
| `--mmd-*`                                                                                                                                 | theme variables and classDef fallbacks, per theme (§10)                              | Mermaid parses colors itself and reads neither `oklch()` nor `var()`                         |
| `--size-*`, `--space-*`, `--leading-*`, `--weight-*`, `--duration-*`, `--easing`, `--nav-width`, `--nav-rail`, `--backdrop`, `--border-1` | unchanged from 3.x                                                                   | the base block defines no ramps                                                              |

Print is a third palette, declared as a `@media print` override inside the token block for the same reason every other color lives there.

### 4.4 Encoding, and why colors repeat

Type badges: report cyan, feature lime, bug red, idea pink, plan amber, research violet. Status badges: draft muted, active violet, done green, archived muted with a dashed border — the system's own treatment for a sixth category. Priority: urgent red, high amber, medium cyan, low muted. Health and command status share one scale: valid/complete/implemented/installed green, warning/incomplete/partial amber, invalid/missing red, stubbed muted.

A research badge and an active badge are both violet, and a bug badge and an error state are both red. That is accepted: the type name is always present as text, so color is never the only signal, and inventing extra hues would break §5's rule that a token means one thing everywhere.

### 4.5 Type

System stacks only: `--font-sans` and `--font-mono`. No webfont is loaded or vendored — a generated page must render identically with no network. The size, leading, and weight ramps from 3.x are retained for the workspace surfaces the base block does not size.

## 5. Semantic color mapping — the law

One token means one thing everywhere: badges, diagram nodes, chart series, and icons, in every report.

| Token                | Meaning — always, everywhere                               | Lucide icons to pair                        |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `--primary` (violet) | The subject of the report: focus component, "you are here" | `radar`, `crosshair`, `zap`                 |
| `--accent-1` (cyan)  | Services, APIs, functions, internal compute                | `server`, `cpu`, `function-square`, `globe` |
| `--accent-2` (amber) | Data stores, caches, state, persistence                    | `database`, `hard-drive`, `archive`         |
| `--accent-3` (lime)  | Async: queues, events, streams; happy paths                | `send`, `radio-tower`, `arrow-right-left`   |
| `--accent-4` (pink)  | External/third-party systems, users, vendors               | `users`, `building-2`, `plug`               |
| `--danger` (red)     | Error paths, failure modes, deprecated code                | `alert-octagon`, `bug`, `skull`             |
| `--warning`          | Caution, tech debt, race conditions                        | `alert-triangle`, `construction`            |
| `--success`          | Verified findings, accepted decisions, passing states      | `check-circle-2`, `shield-check`            |
| `--muted`            | Secondary detail, disabled, legacy                         | `minus-circle`, `history`                   |

Chart series order is fixed: series 1 = `--primary`, 2 = `--accent-1`, 3 = `--accent-2`, 4 = `--accent-3`, 5 = `--accent-4`. Never repurpose. A sixth diagram category uses `--muted` with a dashed border. The workspace has no chart surface yet; when one appears it is CLI-generated inline SVG, and this order still holds.

iris's record encoding (§4.4) is the same law applied to the six record types, four priorities, and the health scale.

## 6. Report blueprint

Research pages are authored against ten fixed sections in a fixed order. The renderer maps the headings to section ids, builds the TOC and meta-row automatically, and omits a section only when it is truly empty — a reader can navigate any iris report blind because the structure never changes.

1. **`#tldr` — TL;DR** · hero card · 3–6 bullets: what was found, what to do, risk level. Each bullet carries a confidence badge: HIGH / MED / LOW.
2. **`#question` — Research question & scope** · info callout with the exact question; a "not covered" list bounds scope.
3. **`#map` — System map** · Mermaid flowchart, colors per §5, one-line caption.
4. **`#territory` — Code territory** · file tree of the relevant subtree; focus files marked, each directory annotated with its role.
5. **`#findings` — Findings** · the core. Each finding: heading + confidence badge → prose → evidence blocks citing `path/file.ts:line` → supporting code, tabs, or diagram. Deep detail folds into collapsible sections.
6. **`#numbers` — Metrics & measurements** · stat cards, plus meter bars for coverage, risk, and effort.
7. **`#paths` — Key flows** · numbered steps for the main call path; node strips or sequence diagrams per flow; error paths in danger red.
8. **`#risks` — Risks & unknowns** · warning and danger callouts; each names blast radius and a probe to resolve the unknown.
9. **`#proposal` — Proposed direction** · options as a tab group with a tradeoffs table; the recommendation as a success callout; migration phases as a timeline.
10. **`#appendix` — Appendix & citations** · collapsible raw dumps; footnotes resolve every citation marker in the body to a `file:line` or commit link.

Bug, feature, idea, plan, and project pages compose the same sections above their typed widgets when a source provides them; without them, pages render as today.

## 7. Workspace information architecture

Unchanged from 3.1: one shell over per-section pages (`index.html` Overview, `work.html`, `spec.html`, `research.html`, `commands.html`, plus `pages/<id>/`, `research/<id>/`, `project/*.html`). The Overview summarizes and links; it never embeds another section's content. `renderShell` is depth-aware, everything in the shell is marked `data-iris-nav` so publish and export strip it, and `/`, `t`, `b` keep their meanings.

What changed is the chrome: the sidebar brand is the radar mark, section entries carry Lucide icons, and the theme control is the two-button mode toggle (`data-theme-set`), which also dispatches `iris:theme`.

## 8. Component inventory

The vocabulary is Iris Electric's. Where 3.x and 4.0 both defined something, the 4.0 rule ships and iris markup moved to it:

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

Components the workspace gained with Iris Electric: `.steps`, `.evidence`, `.filetree`, `.flow`/`.node`/`.edge`, `.footnotes`, `details.ds`, `table.ds`, `pre.code` with `.tok-*`, `.confidence`, `.diagram`, `.chart-box`.

The iris layer adds only what the base system has no equivalent for: app grid, sidebar and nav items, topbar extension, crumbs, footer, page head, summary strip, Work rows/table/Kanban/drawer, Spec browser, command cards, document bodies, empty states, and the Mermaid figure.

Markdown output carries no classes, so `.doc-body table`, `.doc-body pre`, and `.doc-body code` mirror `table.ds`, `pre.code`, and the system's inline-code rule by descendant selector.

The shell is a flex row rather than a two-column grid. `publish` and `export` strip the sidebar, and a grid keeps holding its column — which squeezed a standalone artifact's content into the sidebar's width. With flex, removing the sidebar reflows the content to full width with no artifact-specific rule.

## 9. Library policy

Hard constraints, unchanged: deterministic render, works from `file://`, no network at view time, no build step, classic (non-module) scripts, publish artifacts stand alone. A generated page loads no CDN, no webfont, and no icon pack.

| Library                  | Decision                        | How                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lucide 0.469.0**       | **Inlined at generation time.** | `src/templates/icons.ts` serialises each icon's node tree to inline SVG at render time. Zero runtime, no `<script>`, no network, survives `publish`, and an unknown name throws at build instead of leaving an invisible gap.          |
| **Mermaid 11 (11.17.0)** | **Vendored.**                   | The pinned classic bundle is copied locally by `iris vendor`. Themed per §10, re-rendered on `iris:theme` from each figure's retained source, strict security and complexity bounds unchanged. ESM would be CORS-blocked on `file://`. |
| **Chart.js**             | **Not included.**               | The workspace has no chart surface. If one appears, the standing decision is CLI-generated inline SVG behind a chart contract, with a vendored classic bundle as the interactive upgrade.                                              |
| **React Flow**           | **Rejected**, as in 3.1.        | A React runtime plus a bundler plus client state breaks the zero-build, framework-free, deterministic model. Mermaid flowcharts cover the real use cases.                                                                              |
| **Animation**            | **CSS only, meaning-bearing.**  | The aperture sweep is gone with the ring. What remains: the drawer entrance and 120 ms hover/focus transitions. `prefers-reduced-motion` disables both.                                                                                |

**Icon usage:** every icon is a Lucide glyph, colored via the semantic `.ic-*` classes only — no emoji as icons, no other icon packs.

## 10. Mermaid theming

Mermaid parses colors itself and reads neither `oklch()` nor `var()`, so it gets sRGB fallbacks: the `--mmd-*` tokens, declared per theme inside the token block, are the only color literals outside the base palettes — expressed as tokens so `token-lint` still sees exactly one file containing color literals. Figures render with `theme: 'base'` and `themeVariables` read from those tokens, and re-render on `iris:theme`. Diagram choice: flowchart for architecture, sequence for call paths, state for lifecycle and status machines, ER for schemas.

## 11. Motion, accessibility, and quality floor

- Contrast: 4.5:1 text, 3:1 control boundaries, 1.45:1 borders, both themes, validated in CI over oklch and token aliases.
- Color is never the only signal: every type, status, priority, and health badge carries its name as text.
- Icons are `aria-hidden` when decorative and `role="img"` with a label when they carry meaning.
- Full keyboard operability; `:focus-visible` ring in `--primary`; the tablist follows the standard tab pattern.
- `prefers-reduced-motion: reduce` disables every transition and animation.
- Print is a declared palette; chrome, drawer, and TOC are hidden and Mermaid falls back to source.
- Responsive to 360 px: the 900 px rules govern grids and the TOC; iris's 48 rem rule turns the sidebar into an overlay.

| ✅ Do                                                      | ❌ Don't                           |
| ---------------------------------------------------------- | ---------------------------------- |
| Cite every finding with an evidence block and `file:line`  | Unattributed claims                |
| Confidence badge on every TL;DR bullet and finding         | Presenting guesses as facts        |
| `.tabs` for options / before-after / per-language variants | Duplicated near-identical sections |
| Highlight the 2–5 lines that matter                        | 100-line unhighlighted code walls  |
| Fixed §5 palette semantics in every visual                 | Per-page color improvisation       |

## 12. Migration record

Steps 1–9 of the 3.x plan shipped as described in git history.

10. **Electric adoption (`electric-design-system`)** — the v2.0 token block and component CSS landed with the measured contrast reconciliation, generation-time Lucide icons, radar identity, token-themed Mermaid that re-renders on theme change, the validator taught oklch and token aliases, and the whole workspace migrated onto the Electric vocabulary.
11. **Iris Electric rename and provenance guard (`setup-experience-and-brand-guard`)** — the design language is named Iris Electric, iris's native system; the ten-section blueprint became the native authoring structure, and the provenance lint keeps user-facing output free of external tool and source names.

## 13. Open questions

- Vendor payload size: Mermaid is ~3.4 MB per repo. Still explicit, still opt-in.
- Should `iris publish` output default to the light theme, since shared artifacts are often pasted where dark blocks look heavy?

## 14. Redesign path

A future token revision lands by replacing the block in `src/templates/tokens.ts`, re-running `pnpm token-lint` to see which values miss a floor, recording the new reconciliation in §4.2, and regenerating. Class names, section ids, and §5 semantics stay stable.
