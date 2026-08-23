## Why

The workspace's current look — "Aperture / Electra" — was an interpretation made when no real design system existed: the 2026-08-21 redesign guessed at "Electra" as neutrals plus one electric accent. The actual system has now been supplied — Vision "Electric" v2.0, a token-and-component contract for standalone HTML research reports — and the owner wants iris to adopt it as the one visual language for every generated page, with Vision's radar identity replacing the aperture ring. Adopting it now, before more pages and agent-authored research accumulate against the interim look, keeps the redesign a single coordinated move rather than a series of partial restyles.

## What Changes

- The token stylesheet becomes Vision §2 — its names (`--background`, `--card`, `--card-2`, `--code-bg`, `--border`, `--muted`, `--primary`, `--primary-fg`, `--accent-1..4`, `--success`, `--warning`, `--danger`, `--info`, `--glow`, `--shadow-card`, `--radius`, `--radius-sm`, `--radius-pill`, `--font-sans`, `--font-mono`) and its oklch values verbatim — plus an iris extension block for what Vision does not define: navigation-shell surfaces, the six page-type colors as aliases onto Vision accents, priority colors, code-block foreground tokens, the sRGB fallback tokens Mermaid needs, and the existing size/space/motion/layout ramps. The only value edits to Vision's block are the measured lightness nudges needed to keep iris's 4.5:1 text, 3:1 control-boundary, and 1.45:1 border-visibility floors in both themes, and each is recorded.
- The component stylesheet becomes Vision §3 verbatim (cards, badges, callouts, stats, tabs, code, file tree, tables, flow, steps, timeline, meters, evidence, footnotes, collapsibles, buttons, kbd, mode toggle, diagram/chart containers, print) with its three inline color literals tokenised, plus an iris layer — written only against Vision tokens — for the app shell, Work browser, Kanban, detail drawer, Spec browser, Commands, research documents, and contract pages.
- Generated markup migrates to Vision's vocabulary: `.pill`/`.type-chip`/`.status-chip`/`.priority-chip` → `.badge.b-*`; `.stat-tile`/`.metric-card` → `.card.stat`; `.callout.warn` → `.callout.c-warn`; `.tab-button` → `.tab`; `.button` → `.btn`; `.progress` → `.meter`; `.surface` → `.card`; research and contract headers use `h1.page`, `p.subtitle`, `.meta-row`; documents use Vision's `.layout` with a sticky left `.toc`.
- Icons come from Lucide 0.469.0 (the version Vision pins), rendered at generation time as inline SVG from the npm package — zero runtime, no script, no network — replacing the hand-drawn nav paths. The brand mark is the `radar` icon in `--primary`; the Overview hero is Vision's `card.hero` with the violet glow.
- **BREAKING** (generated output only): the aperture ring, per-page aperture glyphs, `.tp-*` classes, and the `aperture-open` animation are removed; the ring's information survives as a "pages by type" badge row in the hero. Old token names (`--bg`, `--surface-*`, `--text-*`, `--accent*`, `--line-1`, `--*-soft`, `--elevation-1`, `--font-display`, `--radius-1/2/3/full`) and old component class names stop existing in `iris/design/`. Contracts, research Markdown, archives, and CLI behavior are unaffected.
- The theme toggle becomes Vision's two-button mode toggle; `data-theme`, `iris/config.yaml`'s `theme:`, the `t` shortcut, and the stored preference keep working. Theme changes dispatch an `iris:theme` event.
- Mermaid keeps the vendored classic runtime but is themed from the token set (`theme: "base"` with `themeVariables` read from the `--mmd-*` tokens) and re-renders on theme change; the agent workspace template gains Vision's semantic `classDef` snippet for authored flowcharts.
- The token contract validator learns oklch (with sRGB gamut mapping) and `var()` aliases, and its required-token and contrast-pair lists move to the new names; token-lint additionally bans `oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, and `color()` literals outside the token block.
- `docs/design-system.md` is rewritten as "iris design system 4.0 — Electric" with an explicit "relationship to Vision Electric v2.0" section (what is verbatim, what deviates and why); the supplied Vision document is stored at `docs/vision-electric-v2.md` as the upstream contract. The unused `src/cdn.ts` is deleted.

## Capabilities

### New Capabilities

None — icons, tokens, and components are all facets of the existing design-system capability.

### Modified Capabilities

- `aperture-design-system`: the token contract requirement changes from the Aperture token set to Vision's token names and oklch values plus an iris extension block, with the validator parsing oklch and `var()` aliases and the contrast pairs re-stated against the new names; the component language requirement changes to Vision's component vocabulary with generation-time Lucide icons and no aperture marks; the dashboard-hierarchy requirement's Overview scenario changes from the aperture ring to the hero badge row for pages-by-type.
- `markdown-diagram-rendering`: the offline-progressive-enhancement and presentation requirements gain that diagrams are themed from the design tokens and re-render when the theme changes, still without any remote resource.

## Impact

- `src/templates/tokens.ts`, `styles.ts`, `script.ts`, `shell.ts`, `common.ts`, `workspace.ts`, and every `pages/*.ts`; new `src/templates/icons.ts`; `src/cdn.ts` removed.
- `scripts/token-contract.mjs` and `scripts/token-lint.mjs`; `tests/token-contract.test.mjs`, `html-navigation`, `workspace-shell`, `publish-export`, `openspec-browser`, `work-board`, `research-pages` assertions that name old classes or tokens; a new icons test.
- One new generation-time dependency, `lucide@0.469.0` (ISC); no new runtime asset, CLI command, schema, or network access. `iris publish` and `iris export --single` artifacts remain self-contained — inline SVG adds no resource reference.
- `docs/design-system.md`, `docs/tech.md` (decision row), `README.md` (one line), `templates/agents/iris-workspace.md` (classDef snippet), new `docs/vision-electric-v2.md`.
- The checked-in `iris/` dogfood tree is regenerated; `iris/design/tokens.css`, `components/base.css`, and `components/base.js` change wholesale.
