## Context

See proposal.md — Why. The constraints that shape the approach are all already enforced in the repo:

- Generated pages open from `file://` and `iris publish` / `iris export --single` must stand alone: `publish.ts` throws on any `<link>`/`<script>`/`<img>` that references a resource, module scripts are CORS-blocked on `file://`, and `docs/design-system.md` §7 has rejected React Flow. Vision's pinned CDN manifest (Lucide UMD, Mermaid ESM, Chart.js, React Flow via esm.sh) therefore cannot be used as written.
- `scripts/token-lint.mjs` bans hex/rgb/hsl literals outside `src/templates/tokens.ts`; `scripts/token-contract.mjs` requires a fixed token-name list and measures WCAG ratios — but only parses opaque 6-digit hex. Vision's tokens are oklch.
- Measured against iris's floors (throwaway script, 2026-08-21): every Vision dark value passes except the border-visibility floor (1.24–1.44:1 vs 1.45) and the inline comment color (4.13:1); in light mode `--accent-1/-2/-3/-4`, `--success`, `--warning`, `--info` land at 3.3–4.5:1 on white, `--muted` on the dark code block is 2.7:1, and borders are 1.20–1.35:1. Dark `--primary` and `--accent-1` are outside the sRGB gamut and browsers render them desaturated.
- Mermaid 11.17.0 is vendored as a classic UMD and initialised with `theme: 'neutral'`; it cannot read CSS variables or oklch strings.
- Theme state is `data-theme` on `<html>`, seeded from `iris/config.yaml` and overridden per browser in `localStorage`; tests and the validator's theme parser key on that attribute.
- The owner chose, in order: whole-workspace adoption (not research pages only), Vision's radar identity over the aperture ring, and the Vision-native approach (Vision token and class names become iris's vocabulary) over a skin-only restyle or an alias layer.

## Goals / Non-Goals

**Goals:**

- Make the supplied Vision document a truthful reference for what iris generates: same token names, same class names, same semantic color mapping, same section/header anatomy on document pages.
- Keep every existing guarantee: offline `file://`, self-contained publish, no-JS readability, 4.5:1 / 3:1 / 1.45:1 floors, reduced motion, 360 px, deterministic output.
- Leave a single swap surface (`tokens.ts`) so a future Vision v3 is a token-block replacement plus re-validation.

**Non-Goals:**

- Vision's §6 report blueprint (TL;DR, question, map, findings…) for research Markdown — a later change; this one gives research pages the component styling and header anatomy only.
- Chart.js, React Flow, or any runtime chart; webfonts; PNG/PDF export; renaming the `aperture-design-system` capability id or its requirement titles (history links stay valid; prose inside them changes).
- Changing how agents author research (still plain Markdown; only a Mermaid `classDef` snippet is added to the skill).

## Decisions

### Vision-native vocabulary rather than a skin or an alias layer

Token names and class names come from Vision; iris keeps only what Vision lacks, as an extension block (tokens) and an iris layer (CSS). A skin-only restyle would keep `--surface-1`/`.pill` and make the document a lie the moment a generated page is inspected; an alias layer (`--bg: var(--background)`, `.pill` re-pointed at `.badge`) would carry two vocabularies forever and still needs a `var()`-resolving validator. The wide diff is mechanical and lands once.

### oklch stays verbatim; the validator learns it

Alternative: convert Vision's oklch to hex once and keep the validator untouched. Rejected because the point of adopting the system is that `tokens.ts` can be swapped for the next Vision block without translation. The validator gains an oklch → linear-sRGB conversion (oklab matrices) with CSS-style gamut mapping — reduce chroma until the color is inside sRGB — before computing relative luminance; channel clamping would misreport the luminance of dark `--primary` and `--accent-1`, which are out of gamut. It also resolves `var(--x)` chains so `--type-report: var(--accent-1)` and `--info: var(--accent-1)` validate. Alpha on a background token still fails as "not opaque". `color-mix()` in component CSS is not a literal and stays legal; token-lint additionally bans `oklch( oklab( lab( lch( hwb( color(` outside the token block so Vision's two inline oklch literals (`pre.code` color, `.tok-cm`) become tokens.

### Measured reconciliation, not relaxed floors

The only edits to Vision's values are lightness nudges to the first value that clears a floor: dark `--border` L 0.30 → 0.345 and light `--border` 0.90 → 0.84 (border floor); light `--accent-1/-2/-3/-4`, `--success`, `--warning`, `--info` lowered to ≈0.54–0.59 (4.5:1 on `--card`); `--code-comment` (ex `.tok-cm`) set to L 0.62 and `--code-muted` (filename line) to 0.65 in both themes, because the code block is dark in both. Relaxing the floors was rejected: 11 px badge text is normal text under WCAG AA, and the 1.45 border floor is a deliberate iris decision with its own test. Exact nudged values are set by running the validator during implementation and recorded in `docs/design-system.md`.

### `data-theme` is kept; `data-mode` is not adopted

Vision switches on `data-mode="light"`; iris on `data-theme='light'`. The attribute is internal — config, stored preference, tests, and the validator's theme parser all use `data-theme` — so the token block's light selector is written as `[data-theme='light']`. This is the single selector-level deviation from §2 and is documented.

### Extension token mapping

| Token | Value | Why |
| --- | --- | --- |
| `--nav-bg` | dark `oklch(0.13 0.02 285)`, light `var(--card)` | sidebar sits one step below the page in dark, reads as a white panel in light — same intent as before |
| `--nav-text`, `--nav-active-text`, `--nav-active-bg` | `var(--muted)`, `var(--primary)`, `color-mix(in oklch, var(--primary) 18%, transparent)` | Vision's badge-fill recipe applied to the active entry |
| `--type-report` / `-feature` / `-bug` / `-idea` / `-plan` / `-research` | `--accent-1` cyan / `--accent-3` lime / `--danger` / `--accent-4` pink / `--accent-2` amber / `--primary` violet | six types onto Vision's wheel; research = primary follows Vision's own meta-row convention (`badge b-primary` is the doc-type badge); `--success` stays reserved for done/verified |
| status draft / active / done / archived | `--muted` / `--primary` / `--success` / `--muted` with dashed border | Vision §5: success = accepted, muted = legacy; "6th category uses muted with a dashed border" |
| `--priority-urgent` / `-high` / `-medium` / `-low` | `--danger` / `--warning` / `--info` / `--muted` | Vision status semantics |
| `--code-fg`, `--code-muted`, `--code-comment` | constant across themes | the code block is dark in both themes |
| `--mmd-*` | §8.1 themeVariables and §8.2 classDef hexes per theme | Vision's "only permitted literals", relocated into the one file token-lint exempts |
| `--size-*`, `--space-*`, `--leading-*`, `--weight-*`, `--duration-*`, `--easing`, `--nav-width`, `--nav-rail`, `--backdrop`, `--border-1` | unchanged | Vision has no ramps; iris's stay |

Type/status collisions inside one row (a violet research badge next to a violet active badge) are accepted: the contract already requires the type name as text, and iris's previous palette overloaded bug/danger and feature/ok the same way. Dedicated extra hues were rejected — the wheel is full and Vision's semantics are the point.

### Icons at generation time from the pinned package

`lucide@0.469.0` (ISC; the version Vision §7 pins; ESM entry `dist/esm/lucide.js`) is added as a dependency and imported only by the CLI at render time. `src/templates/icons.ts` serialises an icon's node array into `<svg class="lucide lucide-<name> …" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">…</svg>`; decorative use gets `aria-hidden`, labelled use gets `role="img"` + `aria-label`. Unknown names throw at build so output never silently degrades. Alternatives: vendoring Lucide's UMD and calling `createIcons()` at view time (adds a 300 KB runtime, a `<script>` publish would have to strip, and a no-JS gap); hand-copying paths as today (drifts, unlicensed-looking). If the package's export shape differs from expectation at install time, `lucide-static` SVG files are the fallback with the same serialiser; either way the CLI, not the browser, does the work. Icon names are resolved against the installed package and aliases in the icons test.

### Vision §3 verbatim plus an iris layer; Vision wins collisions

`BASE_COMPONENTS_CSS` is Vision §3 (with the three literals tokenised) followed by an iris layer written only in Vision tokens. Where both define a class (`.card`, `.topbar`, `.tabs`, `.grid-2`, `.timeline`, `.callout`, `kbd`), Vision's rule is the one that ships and iris markup migrates. Markdown output (`markdown-it`, `html: false`) cannot carry Vision classes, so `.doc-body table`, `.doc-body pre`, and `.doc-body code` mirror `table.ds` / `pre.code` / inline-code rules by descendant selector rather than by renderer rules — reversible later if the blueprint change wants per-element classes. Research documents and Spec detail use Vision's `.layout` with the sticky left `.toc` (replacing iris's right-hand `doc-toc`). Breakpoints: Vision's 900 px rules govern grids and the TOC; iris's 48 rem rule governs the sidebar overlay — two breakpoints for two different concerns.

### Theme toggle and event

The toggle becomes Vision's two-button `.mode-toggle` (`[data-theme-set="dark|light"]`); `t` still flips. After any change the script syncs the active button and dispatches `iris:theme` on `document` with the mode — Vision's `vision:mode` under iris's event namespace — so Mermaid (and any later chart code) re-themes from one signal.

### Mermaid themed from tokens, re-rendered on toggle

`setupMermaid` initialises with `theme: 'base'` and `themeVariables` built by reading the `--mmd-*` tokens through `getComputedStyle`, keeping strict security, disabled HTML labels, and the size/edge bounds. Each figure keeps its source (already present in the escaped fallback); on `iris:theme` the runtime is re-initialised for the new theme and every rendered figure is reset to its source and run again, with the existing error path. Mermaid's color parser accepts hex, not oklch or CSS variables, which is why the fallbacks are hex tokens; normalising oklch through a canvas `fillStyle` round-trip was rejected as browser-dependent. The figure wrapper takes Vision's `.diagram` styling; the status line and no-JS fallback stay. The agent workspace template gains the §8.2 `classDef` snippet so authored flowcharts use the semantic colors.

### Hero replaces the ring with a badge row

`overview.ts` renders `card.hero`: radar mark, project name as `h1.page`, the briefing as `p.subtitle`, quick-start commands, and a pages-by-type row — one `.badge` per type with the typed icon, label, and count, `aria-label="N pages by type"`, and an empty state naming `iris research <id>`. `apertureRing`/`apertureGlyph`, the `.aperture*` CSS, `.tp-*`, and the `aperture-open` keyframes are deleted; the per-row glyph becomes the typed Lucide icon.

### Spec bookkeeping

The capability id `aperture-design-system` and its requirement titles are kept so archive history and links stay valid; the prose inside the requirements changes. `docs/design-system.md` is retitled "iris design system 4.0 — Electric" and gains a section stating what is verbatim from Vision and what deviates, and the supplied Vision document is stored at `docs/vision-electric-v2.md` as the upstream contract. `src/cdn.ts`, unused since the offline policy, is deleted so the codebase does not advertise CDNs it never loads.

## Risks / Trade-offs

- [oklch and `color-mix()` need a 2023+ browser] → All evergreen browsers support both; iris already assumes a modern browser for `file://` module-free scripts. No fallback colors are generated; accepted.
- [Light-mode accents are slightly darker than Vision's] → Recorded in `docs/design-system.md` with the measured ratios; a future Vision block is re-validated the same way.
- [Token rename breaks `styles.ts` until markup migrates] → The branch is the CI unit; commits are sequenced but only the whole branch must be green.
- [Package export shape of `lucide` at generation time] → Verified at install; `lucide-static` fallback with the same serialiser; the icons test fails fast on any missing name.
- [Re-rendering Mermaid on toggle costs time on diagram-heavy pages] → Only figures already rendered are re-run, sequentially, under the same bounds; failure falls back to source per figure.
- [Large regenerated-dogfood diff] → Expected and one-time; `html-check` and the publish test guard correctness.
- [Same hue for a research type badge and an active status badge] → Text label is always present; accepted per the contract's non-color-signal rule.

## Migration Plan

1. Branch `feat/electric-design-system` from `main` (the uncommitted dogfood regeneration and the untracked `iris/pages/report-from-agent-sessions/` on `main` are left in place; regeneration rewrites the HTML and includes that page).
2. Tokens + validator + lint; icons module + dependency; component CSS; template/shell/script migration — green together at step 4.
3. Tests, docs, delta specs; `pnpm build && node dist/src/index.js update && node dist/src/index.js render --all` to regenerate `iris/`; `pnpm release:check`.
4. PR; `/opsx:archive electric-design-system` after merge.

Rollback: revert the branch; user workspaces regenerate `iris/design/*` from whichever CLI version runs `iris init`/`render --all` next, and the vendored Mermaid bundle is untouched either way.
