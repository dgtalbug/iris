# iris design system 2.0 — "Aperture"

> Implemented direction, updated 2026-08-21 for the agent-first workspace. Generated design output remains owned by `src/templates/design.ts`.

## 1. The one goal

A newcomer runs `iris` in any repo, opens one HTML file, and understands the repo in one shot: what it is, how it's shaped, what's moving, where to start. Every design decision below is judged against that sentence.

## 2. Market research

### 2.1 Competitive landscape

| Tool | Model | What their UI does well | What iris does that they can't |
| --- | --- | --- | --- |
| DeepWiki | Hosted, auto-generated wiki per public repo | Zero-effort structural draft, conversational Q&A | Works offline, private, deterministic, versioned with the repo |
| Mintlify | Docs-as-code SaaS, MDX in Git | Polished reading experience, docs merge with code | No server, no account, no build pipeline |
| Backstage TechDocs | Self-hosted portal, Markdown → central hub | Single pane for a whole org | Zero infrastructure; per-repo, file:// only |
| GitBook / Docusaurus / Starlight | Doc sites | Beautiful typography, strong IA | No site build; agents write JSON contracts, not prose |
| Swimm | IDE-coupled doc monitoring | Docs validated against code changes | Explicit agent-authored contracts and rendering with no plugin or background watcher |

The gap iris occupies: **local-first, agent-writable, zero-infrastructure visual docs**. Nobody else renders straight from disk with no server. The UI must make that feel like a feature (instant, private, portable) rather than a limitation (plain, static).

### 2.2 Design takeaways from the current dev-tool landscape

- Dark-first is the standard for developer surfaces (Sentry, Supabase, Railway, Linear); light theme is derived from dark, not the reverse.
- The best dark UIs (Linear is the reference) get their quality from **contrast discipline and hierarchy** — near-black surfaces, muted borders, one accent — not from decoration or gradients.
- Hierarchy in dark mode comes from surface elevation steps, not shadows.
- Dashboards that people trust lead with a small number of legible numbers, then let users drill down; density is progressive, not uniform.

Sources: [Muzli dashboard examples 2026](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/), [925 Studios SaaS dashboard patterns](https://www.925studios.co/blog/saas-dashboard-design-examples-2026), [Aniq dark dashboard designs](https://www.aniq-ui.com/en/blog/dark-mode-dashboard-designs-2026), [Sourcegraph developer onboarding](https://sourcegraph.com/blog/developer-onboarding), [repowise codebase doc tool comparison](https://www.repowise.dev/blog/comparisons/best-codebase-documentation-tools-2026), [Mintlify documentation tools](https://www.mintlify.com/library/7-best-software-documentation-tools-in-2026), [GitBook top documentation tools](https://gitbook.com/blog/top-documentation-tools-2026), [Backstage TechDocs on DeepWiki](https://deepwiki.com/backstage/backstage/2.3-techdocs).

### 2.3 What this means for iris

The current UI is not ugly because of its colors; it is generic because nothing about it is *about* iris, and the dashboard leads with an empty list instead of answers. The redesign gives iris an identity rooted in its own name and reorganizes the dashboard around the newcomer's first sixty seconds.

## 3. Identity concept: the optical instrument

*iris* is the aperture of an eye — the mechanism that admits exactly enough light to see — and, in Greek myth, the messenger who carries the spectrum. Both readings are load-bearing:

- **The chamber.** The interface is a dark instrument body: near-black, matte, quiet. Content panels are ground-glass viewing surfaces. Nothing in the chrome competes with the content.
- **The spectrum is meaning.** Color appears only where it encodes something: page type, status, chart series. The chrome itself stays monochrome plus one accent. If a color can be removed without losing information, it is removed.
- **Signature element: the aperture ring.** A segmented ring — one arc segment per page, colored by type, gap-separated — is simultaneously the brand mark, the dashboard's primary status visual, and the favicon. Each page carries a small single-segment aperture glyph in its type color. This is the one element allowed a moment of theater: on dashboard load the segments sweep open once (320 ms, `--easing`); with `prefers-reduced-motion` they render already open.

This keeps the existing seed (the current SVG aperture, the amber accent) and commits to it properly instead of replacing identity with a trend.

## 4. Tokens

All values live in `tokens.css`; `token-lint` continues to forbid literals elsewhere. Dark is the source theme; light is derived.

### 4.1 Color — dark (default)

| Token | Value | Role |
| --- | --- | --- |
| `--bg` | `#0B0E14` | chamber — page ground |
| `--surface-1` | `#12161F` | ground glass — cards, panels |
| `--surface-2` | `#1A1F2B` | raised — headers within cards, inputs |
| `--surface-3` | `#232936` | top elevation — menus, hover |
| `--line-1` | `#252B39` | hairline borders |
| `--text-1` | `#E9EBF1` | primary text |
| `--text-2` | `#A6ADBF` | secondary text |
| `--text-3` | `#6E7689` | captions, disabled |
| `--accent` | `#F2B24E` | lamplight amber — interactive chrome only (links, focus, active tab, primary button) |
| `--accent-ink` | `#141008` | text on accent |

Amber stays as the single interactive accent deliberately: dev-tool dark UIs are saturated with blue and green accents; warm light against a cool-black chamber is both rarer and true to the optics metaphor (light entering the aperture).

### 4.2 Color — the spectrum (encoding only)

Used exclusively for page types, statuses, and chart series. Never for decoration, never in chrome.

| Token | Value | Encodes |
| --- | --- | --- |
| `--type-report` | `#5CB8F0` | report pages / series 1 |
| `--type-feature` | `#4FC98C` | feature pages / series 2 |
| `--type-bug` | `#EF6A6A` | bug pages / series 3 |
| `--type-idea` | `#A78BFA` | idea pages / series 4 |
| `--type-plan` | `#F2B24E` | plan pages / series 5 |
| `--ok` / `--warn` / `--danger` / `--info` | `#4FC98C` / `#F0913E` / `#EF6A6A` / `#5CB8F0` | statuses, warnings, and render errors |

Rule: a type color always appears with a second channel (label, icon, or position) — color is never the only signal (color-blind safety).

### 4.3 Color — light theme (derived)

Daylight version of the same instrument: `--bg #F6F5F1` (warm paper, not blue-white), surfaces step down toward white, text inverts to `#191D26` / `#4B5163` / `#7A8093`, accent deepens to `#B87A16` for contrast, spectrum values darken ~15% lightness to hold 4.5:1 on light ground. Toggle mechanism (`data-theme`) is unchanged.

Implementation note: `#B87A16` and the tertiary text values remain palette tokens, but automated contrast checks showed they do not reach 4.5:1 as small text on every surface. Components therefore use the contrast-safe `--accent-text` token for linked text and `--text-2` for readable captions; `--accent` remains the focus/border chrome color.

### 4.4 Type

Two tiers, because fonts must work from file:// with zero network:

- **Tier 0 (default, zero-install):** system stacks as today. `--font-sans: system-ui …`, `--font-mono: ui-monospace …`.
- **Tier 1 (after `iris vendor`):** woff2 files in `design/vendor/`, all SIL OFL:
  - Display — **Bricolage Grotesque** (`--font-display`): h1, the dashboard title, stat numbers, eyebrows. Characterful without being another Inter clone; used with restraint.
  - Body — **Inter** (`--font-sans`): everything else.
  - Mono — **JetBrains Mono** (`--font-mono`): code, ids, paths, data values.

Scale (unchanged token names, retuned): `--size-1 0.6875rem` caption · `--size-2 0.8125rem` UI · `--size-3 0.9375rem` body · `--size-4 1.25rem` section · `--size-5 1.75rem` page title · `--size-6 2.5rem` hero stat. Line-height tokens added: `--leading-tight 1.2`, `--leading-body 1.55`. Weights 400/500/700 as today.

### 4.5 Space, radius, elevation, motion

Keep the existing `--space-*`, `--radius-*` ramps. Add `--radius-full` for the aperture and pills. Elevation in dark mode = surface step + 1px `--line-1` border; shadows (`--elevation-1`) only in light theme and menus. Motion tokens unchanged (`--duration-1/2/3`, `--easing`); policy in §8.

## 5. Dashboard information architecture

The dashboard uses peer Work and `Spec` top-level tabs. Work leads with answers in the order a newcomer asks them; Spec exposes the repository's OpenSpec workspace without ingesting general documentation:

```
┌──────────────────────────────────────────────────────────┐
│ ◔ iris · <repo name>                      [theme] [⌕ /]  │  identity bar
├──────────────────────────────────────────────────────────┤
│  [ Work ] [ Spec ]                                      │  primary views
├──────────────────────────────────────────────────────────┤
│  ╭───────╮   WHAT THIS REPO IS                           │
│  │ ◔ 12  │   Agent-first workspace guidance              │  briefing hero
│  │ pages │   run: `pnpm dev` · test: `pnpm test`         │  + aperture ring
│  ╰───────╯   entry points: src/cli.ts · docs/            │
├──────────────────────────────────────────────────────────┤
│  [ 12 pages ] [ 2 archived ] [ 4 active ] [ 6 project ]  │  health strip
├──────────────────────────────────────────────────────────┤
│  ARCHITECTURE                                            │
│  ┌────────────────────────────────────────────────────┐  │  hld diagram
│  │              (mermaid flowchart)                   │  │  (vendored)
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│  WORK   [List | Board]                 filter…           │
│  ◔ bug-cache-stampede   bug    active  2026-08-19        │  work surface
│  ◔ session-review       report ok     2026-08-18        │
├──────────────────────────────────────────────────────────┤
│  project docs: overview · hld · lld · erd · commands …   │  docs strip
│  generated by iris · works offline from file://          │
└──────────────────────────────────────────────────────────┘
```

The `Spec` view uses this hierarchy:

```text
Overview → project/config context → canonical specs → active changes → archive
```

Canonical, active, structured archive, legacy archive, incomplete, and invalid states always carry text or structural labels. Proposal, design, tasks, and delta specs use native disclosure controls with escaped source fallbacks. Long paths stay contained at 360 px; tab selection uses correct ARIA relationships and arrow/Home/End keyboard behavior. Motion is optional and becomes immediate under reduced-motion preferences.

- **Briefing hero** is the "one shot": agent-first workspace guidance plus explicit content/render commands. The empty state points to an intentional page command and `iris render --all`; general repository documentation is not ingested.
- **Health strip**: four stat tiles maximum. Numbers in display face; each tile links to its filtered view.
- **Architecture pane** renders the HLD page's diagram inline when it exists; otherwise a one-line empty state.
- **Work surface** keeps today's List/Board tabs and filter; cards gain the type-colored aperture glyph, status pill, and relative date.
- Keyboard: `/` focuses filter, `t` toggles theme, arrow keys move the list. Focus rings use `--accent`.

Page templates keep the same anatomy: identity bar (back to dashboard) → page header with aperture glyph, id, type, status, dates → typed section slots → evidence/footer. Published artifacts drop the identity bar (existing `data-iris-nav` stripping).

## 6. Component inventory

Tokens-only styling, one class per component, no utility soup — `base.css` stays small and auditable.

| Component | Notes |
| --- | --- |
| `aperture` | ring (dashboard) and glyph (cards/pages); SVG, segments driven by rendered data |
| `stat-tile` | display-face number, caption label, optional delta arrow, links to filtered view |
| `card` | surface-1, hover raises to surface-2, aperture glyph + title + meta row |
| `pill` | status/type badge; spectrum background at 15% alpha, full-strength text |
| `tabs`, `filter-input`, `theme-toggle` | keep current behavior, restyle to tokens |
| `board-col` | column header shows count; drag is out of scope (static render) |
| `diagram` | mermaid host block with code fallback (§7) |
| `chart` | CLI-generated inline SVG (§7); legend uses spectrum tokens |
| `timeline` | vertical, for report/session evidence (checkpoints, tool activity) |
| `code` | mono, surface-2, copy affordance; language label eyebrow |
| `callout` | info/warn/danger left-rule variants |
| `table` | hairline rows, sticky header, right-aligned numerics in mono |
| `empty-state` | always states the exact command that fills it |
| `kbd` | keyboard hints in footer/filter |

## 7. Library policy — mermaid, React Flow, charts (the direct answer)

Hard constraints these decisions obey: deterministic render, works from `file://`, no network at view time, no build step, classic (non-module) scripts, publish artifacts must stand alone.

| Ask | Verdict | How |
| --- | --- | --- |
| **Mermaid** | **Yes — adopt.** | Vendor the standalone `mermaid.min.js` (~2.8 MB, works from file:// as a classic script) into `design/vendor/` via the `iris vendor` command (already spec'd, currently stubbed). Diagram blocks store mermaid source in the contract; the page initializes mermaid with theme variables mapped from tokens. Covers flowcharts (HLD/LLD), sequence, state, and ER — replacing hand-built diagram markup for the project pages. Fallback when vendor assets are absent: render the source in a `code` block with a "run `iris vendor`" callout. |
| **React Flow** | **No — rejected.** | It is a React library: requires the React runtime, a bundler, and client-side state. That breaks the zero-build, framework-free, deterministic model (same grounds Reaviz was rejected on in `docs/tech.md`). If an interactive draggable node graph is ever genuinely needed, the framework-free path is vendored Cytoscape.js (~400 KB UMD) — but mermaid flowcharts cover the actual v1 use cases. |
| **Charts** | **Yes — CLI-generated SVG first.** | The chart block's primary renderer is deterministic inline SVG produced at `iris render` time from the contract data (bar, line, donut; spectrum tokens for series; `<title>` elements for accessibility). Zero runtime, works in published single-file artifacts, diffs cleanly in git. A vendored uPlot (~50 KB) can layer tooltips/zoom onto the same data later as progressive enhancement — the SVG remains the no-JS fallback. This preserves the "Reaviz swap behind chart contract" backlog idea: the contract is the interface, renderers are swappable. |
| **Animations** | **Yes — CSS only, meaning-bearing.** | Existing policy in `docs/tech.md` stands: animation only where it carries meaning, `prefers-reduced-motion` falls back to frame zero. Budget: the aperture opening sweep on dashboard load and 120 ms hover/focus transitions on cards, tabs, and pills. Nothing else. No scroll-triggered effects, no parallax, no JS animation libraries. |

Publish/export note: `iris publish` output must stay self-contained. Charts are already inline SVG, so they survive. For diagram blocks, publish inlines the pre-rendered SVG snapshot if one was captured at render time, else the source in a code block — the 2.8 MB mermaid script is not embedded in shared artifacts.

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
4. **`iris vendor`** — implement the stubbed command: mermaid.min.js, Lucide sprite, tier-1 fonts, pinned versions + checksums from `src/cdn.ts`.
5. **Diagram + chart blocks** — mermaid host block on project pages; CLI-side SVG chart renderer behind the chart contract.
6. **Dogfood** — run `iris init` and `iris render --all` so the shipped `iris/` tree is generated from intentional page contracts without repository-document ingestion.

Each step is an OpenSpec change; each keeps CI green independently.

## 10. Open questions

- Vendor payload size: mermaid alone is ~2.8 MB per repo. Acceptable for a dev tool, but worth a `--minimal` vendor mode (fonts + icons only)?
- Should render-time mermaid→SVG snapshots (needed for fully-visual published artifacts) wait for the PNG/PDF browser-renderer decision, since both need headless Chromium?
- Light-theme default for `iris publish` output? Shared artifacts are often pasted into docs/wikis where dark blocks look heavy.
