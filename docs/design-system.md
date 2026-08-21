# iris design system 3.0 — "Aperture / Electra"

> Implemented direction, updated 2026-08-21 for the multi-page workspace. Generated design output is owned by `src/templates/`: `tokens.ts`, `styles.ts`, `script.ts`, `shell.ts`, `common.ts`, and `pages/*.ts`, with `design.ts` as the import barrel.

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

The current UI is not ugly because of its colors; it is generic because nothing about it is _about_ iris, and the dashboard leads with an empty list instead of answers. The redesign gives iris an identity rooted in its own name and reorganizes the dashboard around the newcomer's first sixty seconds.

## 3. Identity concept: the optical instrument

_iris_ is the aperture of an eye — the mechanism that admits exactly enough light to see — and, in Greek myth, the messenger who carries the spectrum. Both readings are load-bearing:

- **The chamber.** The interface is a dark instrument body: near-black, matte, quiet. Content panels are ground-glass viewing surfaces. Nothing in the chrome competes with the content.
- **The spectrum is meaning.** Color appears only where it encodes something: page type, status, chart series. The chrome itself stays monochrome plus one accent. If a color can be removed without losing information, it is removed.
- **Signature element: the aperture ring.** A segmented ring — one arc segment per page, colored by type, gap-separated — is simultaneously the brand mark, the dashboard's primary status visual, and the favicon. Each page carries a small single-segment aperture glyph in its type color. This is the one element allowed a moment of theater: on dashboard load the segments sweep open once (320 ms, `--easing`); with `prefers-reduced-motion` they render already open.

This keeps the existing seed (the current SVG aperture, the amber accent) and commits to it properly instead of replacing identity with a trend.

## 4. Tokens

All values live in `tokens.css`; `token-lint` continues to forbid literals elsewhere. Dark is the source theme; light is derived.

### 4.1 Color — dark (default)

| Token              | Value     | Role                                                     |
| ------------------ | --------- | -------------------------------------------------------- |
| `--bg`             | `#0e1117` | chamber — page ground                                    |
| `--surface-1`      | `#151923` | ground glass — cards, panels                             |
| `--surface-2`      | `#1b2030` | raised — table headers, inputs, code                      |
| `--surface-3`      | `#242a3b` | top elevation — menus, hover                              |
| `--line-1`         | `#2a3143` | hairline borders                                          |
| `--text-1`         | `#e7eaf2` | primary text                                              |
| `--text-2`         | `#a4adc2` | secondary text                                            |
| `--text-3`         | `#7a8399` | captions, metadata                                        |
| `--accent`         | `#6f8cff` | interactive chrome — focus, selected tab, primary button  |
| `--accent-text`    | `#93a8ff` | contrast-safe linked text                                 |
| `--accent-soft`    | `#6f8cff1f` | selected tab fill, blockquote ground                    |
| `--accent-ink`     | `#0b0e14` | text on accent                                            |
| `--nav-bg`         | `#0a0d13` | sidebar ground, one step below the page                   |
| `--nav-text`       | `#a4adc2` | sidebar entries                                           |
| `--nav-active-bg`  | `#6f8cff1f` | current section fill                                    |
| `--nav-active-text`| `#c3cfff` | current section label                                     |

The interactive accent is electric indigo, not the earlier amber. Amber survives as `--type-plan`, where it encodes meaning; using it for chrome as well made every interactive element read as a plan badge. Indigo is the convention the tools this replaces already use for selection and focus, which is worth more here than novelty. The sidebar sits one step darker than the page so the content area reads as the lit surface.


### 4.2 Color — the spectrum (encoding only)

Used exclusively for page types, statuses, and chart series. Never for decoration, never in chrome.

| Token                                     | Value                                         | Encodes                               |
| ----------------------------------------- | --------------------------------------------- | ------------------------------------- |
| `--type-report`                           | `#5CB8F0`                                     | report pages / series 1               |
| `--type-feature`                          | `#4FC98C`                                     | feature pages / series 2              |
| `--type-bug`                              | `#EF6A6A`                                     | bug pages / series 3                  |
| `--type-idea`                             | `#A78BFA`                                     | idea pages / series 4                 |
| `--type-plan`                             | `#F2B24E`                                     | plan pages / series 5                 |
| `--type-research`                         | `#2DD4BF`                                     | research pages / series 6             |
| `--ok` / `--warn` / `--danger` / `--info` | `#4FC98C` / `#F0913E` / `#EF6A6A` / `#5CB8F0` | statuses, warnings, and render errors |

Rule: a type color always appears with a second channel (label, icon, or position) — color is never the only signal (color-blind safety).

### 4.3 Color — light theme (peer, not afterthought)

Light is a first-class theme rather than a derived one, because the workspace is read in daylight as often as not. Ground is a cool `#f4f5f7`, cards are pure white, and the sidebar is white against that grey so the navigation reads as a panel rather than a stripe. Text inverts to `#172b4d` / `#44546f` / `#626f86`; the accent deepens to `#3b5bdb` with `#2f4ac0` for linked text; spectrum values darken to hold 4.5:1 on white. `--elevation-1` becomes a real two-layer shadow in light and stays `none` in dark, where elevation comes from surface steps.

The initial theme comes from `theme:` in `iris/config.yaml`, emitted as `data-theme` on `<html>`. The `t` toggle overrides it per browser through `localStorage`, and every generated page reads that key so the choice follows the reader across sections.

### 4.4 Type

Two tiers, because fonts must work from file:// with zero network:

- **Tier 0 (default, zero-install):** system stacks as today. `--font-sans: system-ui …`, `--font-mono: ui-monospace …`.
- **Tier 1 (after `iris vendor`):** woff2 files in `design/vendor/`, all SIL OFL:
  - Display — **Bricolage Grotesque** (`--font-display`): h1, the dashboard title, stat numbers, eyebrows. Characterful without being another Inter clone; used with restraint.
  - Body — **Inter** (`--font-sans`): everything else.
  - Mono — **JetBrains Mono** (`--font-mono`): code, ids, paths, data values.

Scale (unchanged token names, retuned): `--size-1 0.6875rem` caption · `--size-2 0.8125rem` UI · `--size-3 0.9375rem` body · `--size-4 1.25rem` section · `--size-5 1.75rem` page title · `--size-6 2.5rem` hero stat. Line-height tokens added: `--leading-tight 1.2`, `--leading-body 1.55`. Weights 400/500/700 as today.

### 4.5 Space, radius, elevation, motion

Keep the existing `--space-*`, `--radius-*` ramps. `--radius-full` covers the aperture and pills. Elevation in dark mode = surface step + 1px `--line-1` border; shadows (`--elevation-1`) apply in the light theme only. Motion tokens unchanged (`--duration-1/2/3`, `--easing`); policy in §8. Two layout tokens drive the shell: `--nav-width` (15rem) and `--nav-rail` (3.5rem), with `[data-nav='collapsed']` swapping one for the other so the collapse is a single token change rather than a second layout.

## 5. Workspace information architecture

The workspace is a set of static pages behind one shared shell, not a single scrolling dashboard. Sections are separate files so each stays small enough for an agent to read on its own and for a human to deep-link:

```
┌───────────────┬──────────────────────────────────────────────────┐
│ ◔ iris        │ iris / Work                    [filter] [theme]  │  top bar
│   <repo>      ├──────────────────────────────────────────────────┤
│               │                                                  │
│ ◔ Overview    │  WORK                                            │
│ ▤ Work     7  │  Every contract and research page in one browser │  page head
│ ▣ Spec     4  │                                                  │
│ ⌕ Research 2  │  ┌────┐┌────┐┌────┐┌────┐┌────┐                  │  summary strip
│ ▭ Commands 15 │  │ 7  ││ 3  ││ 2  ││ 2  ││ 0  │                  │
│               │  └────┘└────┘└────┘└────┘└────┘                  │
│ PROJECT DOCS  │  [List|Table|Kanban]              7 items         │  toolbar
│ ▤ overview    │  ◔ cache-stampede   active urgent 2026-08-21     │  work surface
│ ▤ hld         │  ◔ agent-notes      active  —     2026-08-21     │
│ ▤ lld  …      │                                                  │
│               │                                                  │
│ offline    ‹  │  generated by iris · works offline from file://  │
└───────────────┴──────────────────────────────────────────────────┘
```

| Page             | Owns                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `index.html`     | Overview: briefing hero + aperture ring, four section tiles, recent work, spec movement with task progress, architecture pane, project-docs strip |
| `work.html`      | Dense List / Table / Kanban browser over one projection, shared filter, detail drawer        |
| `spec.html`      | OpenSpec overview counts, project context, canonical specs, active changes, archive, warnings |
| `research.html`  | Markdown research index with status, tags, evidence, and parser warnings                     |
| `commands.html`  | Every catalog command grouped by purpose with an explicit status chip                        |
| `pages/<id>/`    | One contract page per record, same shell                                                     |
| `research/<id>/` | One research document per record: header from front matter, table of contents, safe body     |
| `project/*.html` | Managed overview, HLD, LLD, ERD, decisions placeholders                                      |

The Overview **summarizes and links**; it never embeds another section's content. That is what keeps `index.html` around 13 KB while the Spec page carries the full OpenSpec snapshot.

- **Shell.** Sidebar (sections + project docs, current entry marked with `aria-current` and an inset accent rule) and a top bar carrying the breadcrumb, an optional filter slot, and the theme toggle. The sidebar collapses to a `--nav-rail` icon strip via the footer control or `b`, and the state persists in `localStorage`. Below 48rem it becomes an overlay opened from a top-bar menu button. Everything in the shell is marked `data-iris-nav`, so publish and export strip it and the page body still stands alone.
- **Depth-aware paths.** `renderShell` takes a `depth` and derives every asset and navigation href from it (`./`, `../`, `../../`), so the same shell serves root sections, project docs, and nested record pages.
- **Keyboard.** `/` focuses the visible filter, `t` toggles theme, `b` toggles the sidebar, arrow keys move between work items, and the layout tablist follows the standard tab pattern. Focus rings use `--accent`.
- **No JavaScript.** The sidebar renders expanded and fully linked, the default List view is readable, and every work item keeps its full-page link.

### 5.1 Jira-inspired Work research

The Work redesign borrows information-density and context-preserving interaction principles, not Atlassian branding, fonts, icons, or exact styling:

- Jira's list view prioritizes type, key, summary, priority, created/updated, status, and assignee fields for scanning ([Atlassian: list view](https://support.atlassian.com/jira-software-cloud/docs/what-is-the-list-view/)). Iris maps only fields backed by its contracts.
- Jira boards organize work by status columns, while configurable compact card fields help busy backlogs remain legible ([Atlassian: boards](https://support.atlassian.com/jira-software-cloud/docs/what-is-a-jira-software-board/), [Atlassian: board and backlog view](https://support.atlassian.com/jira-software-cloud/docs/customize-your-view-of-the-board-and-backlog/)). Iris keeps its four real statuses and deliberately omits drag-and-drop.
- Jira's side panel preserves list context and provides close, keyboard, and full-page paths ([Atlassian: side panel](https://support.atlassian.com/jira-software-cloud/docs/view-content-in-a-side-panel/)). Iris implements one reusable offline drawer with stronger explicit focus and hash behavior.
- Aperture retains its own tokens and identity; Atlassian's guidance is used only as a density and interaction reference ([Atlassian Design System: typography](https://atlassian.design/foundations/typography/applying-typography/), [design tokens](https://atlassian.design/foundations/tokens/design-tokens/)).

Page templates keep the same anatomy: identity bar (back to dashboard) → page header with aperture glyph, id, type, status, dates → typed section slots → evidence/footer. Published artifacts drop the identity bar (existing `data-iris-nav` stripping).

## 6. Component inventory

Tokens-only styling, one class per component, no utility soup — `base.css` stays small and auditable.

| Component                              | Notes                                                                            |
| -------------------------------------- | -------------------------------------------------------------------------------- |
| `sidebar` / `nav-item`                 | workspace shell: sections, project docs, current marking, collapsed rail        |
| `topbar` / `crumbs`                    | breadcrumb, filter slot, theme toggle; stripped from published artifacts        |
| `page-head`                            | eyebrow, H1, one-line description, optional actions — opens every section page  |
| `progress`                             | task-completion bar for OpenSpec changes; label carried by `aria-label`         |
| `command-card`                         | one catalog command: name, status chip, synopsis, usage, flags                  |
| `doc-layout` / `doc-toc` / `doc-body`  | research document with sticky table of contents; stacks below 48 rem            |
| `aperture`                             | ring (overview) and glyph (cards/pages); SVG, segments driven by rendered data  |
| `stat-tile`                            | display-face number, caption label, optional delta arrow, links to filtered view |
| `work-row` / `work-table` / `kanban`   | three compact peer representations over one honest Work projection               |
| `work-drawer`                          | modal right-side preview, full-screen at 360 px, with full-page escape hatch     |
| `pill`                                 | status/type badge; spectrum background at 15% alpha, full-strength text          |
| `tabs`, `filter-input`, `theme-toggle` | keep current behavior, restyle to tokens                                         |
| `kanban-col`                           | four real status columns with counts; drag remains out of scope                  |
| `diagram`                              | mermaid host block with code fallback (§7)                                       |
| `chart`                                | CLI-generated inline SVG (§7); legend uses spectrum tokens                       |
| `timeline`                             | vertical, for report/session evidence (checkpoints, tool activity)               |
| `code`                                 | mono, surface-2, copy affordance; language label eyebrow                         |
| `callout`                              | info/warn/danger left-rule variants                                              |
| `table`                                | hairline rows, sticky header, right-aligned numerics in mono                     |
| `empty-state`                          | always states the exact command that fills it                                    |
| `kbd`                                  | keyboard hints in footer/filter                                                  |

## 7. Library policy — mermaid, React Flow, charts (the direct answer)

Hard constraints these decisions obey: deterministic render, works from `file://`, no network at view time, no build step, classic (non-module) scripts, publish artifacts must stand alone.

| Ask            | Verdict                              | How                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mermaid**    | **Adopted for Markdown fences.**     | `iris vendor` copies the pinned 11.17.0 classic bundle (~3.4 MB) and license from the installed package into `design/vendor/` without network access. Exact `mermaid` fences emit source-first hosts; the browser renders each independently with strict security, HTML/click behavior disabled, explicit complexity bounds, accessible SVG labeling, and escaped fallback. Automatic HLD projection into the Architecture pane remains separate future work.                                                                                                     |
| **React Flow** | **No — rejected.**                   | It is a React library: requires the React runtime, a bundler, and client-side state. That breaks the zero-build, framework-free, deterministic model (same grounds Reaviz was rejected on in `docs/tech.md`). If an interactive draggable node graph is ever genuinely needed, the framework-free path is vendored Cytoscape.js (~400 KB UMD) — but mermaid flowcharts cover the actual v1 use cases.                                                                                                                                                             |
| **Charts**     | **Yes — CLI-generated SVG first.**   | The chart block's primary renderer is deterministic inline SVG produced at `iris render` time from the contract data (bar, line, donut; spectrum tokens for series; `<title>` elements for accessibility). Zero runtime, works in published single-file artifacts, diffs cleanly in git. A vendored uPlot (~50 KB) can layer tooltips/zoom onto the same data later as progressive enhancement — the SVG remains the no-JS fallback. This preserves the "Reaviz swap behind chart contract" backlog idea: the contract is the interface, renderers are swappable. |
| **Animations** | **Yes — CSS only, meaning-bearing.** | Existing policy in `docs/tech.md` stands: animation only where it carries meaning, `prefers-reduced-motion` falls back to frame zero. Budget: the aperture opening sweep on dashboard load and 120 ms hover/focus transitions on cards, tabs, and pills. Nothing else. No scroll-triggered effects, no parallax, no JS animation libraries.                                                                                                                                                                                                                       |

Publish/export note: `iris publish` output stays self-contained. It strips project scripts and retains Mermaid source fallback; Iris does not yet capture or claim a pre-rendered SVG snapshot, and the 3.4 MB runtime is not embedded in shared artifacts.

## 8. Motion, accessibility, and quality floor

- Contrast: 4.5:1 minimum for text on every surface in both themes; spectrum-on-surface pairs validated in CI (extend `token-lint` with a contrast check).
- Color never the sole signal (§4.2 rule); every SVG gets `role="img"` + label; charts get `<title>`/`<desc>`.
- Full keyboard operability; visible `:focus-visible` ring (`--accent`); existing tab/tablist ARIA kept.
- `prefers-reduced-motion: reduce` → all transitions/animations to 0; aperture renders open.
- Print stylesheet for pages (publish artifacts double as printable one-pagers).
- Responsive to 360 px: health strip wraps 2×2, board becomes vertically stacked columns, hero stacks ring above copy.

## 9. Migration plan (no code in this doc — sequencing for when work starts)

1. **Tokens 2.0** — replace `tokens.css` values with §4; extend `token-lint` for the new names + contrast check. Everything else keeps working.
2. **Components 2.0** — restyle `base.css` to §6; add stat-tile, pill, callout, timeline, kbd. Update `src/templates/design.ts` markup accordingly; `html-check` guards links.
3. **Dashboard IA** — reorder `index.html` template to §5 (briefing hero, health strip, work surface); use agent-first guidance rather than inferred repository-document content.
4. **`iris vendor` + Markdown Mermaid fences** — implemented for the pinned Mermaid runtime and license; font/icon vendoring remains separate.
5. **Architecture projection + chart blocks** — project the relevant HLD Mermaid fence into the Architecture pane and add a CLI-side SVG chart renderer behind the chart contract.
6. **Dogfood** — run `iris init` and `iris render --all` so the shipped `iris/` tree is generated from intentional page contracts without repository-document ingestion.
7. **Workspace shell (`dashboard-shell-redesign`)** — Electra tokens, module split, one shell over per-section pages, generated command reference. Done.
8. **Markdown research (`research-markdown-pages`)** — a second editable source: `iris/research/<id>/index.md` with bounded front matter, document template, section page, and Work-browser inclusion. Done.
9. **Conversational agent surfaces (`agent-surface-triggers`)** — intent-mapped skill plus generated `/iris:*` commands and Copilot prompts from one managed-surface installer. Done.

Each step is an OpenSpec change; each keeps CI green independently.

## 10. Open questions

- Vendor payload size: Mermaid alone is ~3.4 MB per repo. It is explicit today; a later multi-asset vendor command may need selective flags.
- Should render-time mermaid→SVG snapshots (needed for fully-visual published artifacts) wait for the PNG/PDF browser-renderer decision, since both need headless Chromium?
- Light-theme default for `iris publish` output? Shared artifacts are often pasted into docs/wikis where dark blocks look heavy.
