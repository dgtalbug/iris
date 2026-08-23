## 1. Tokens and validation

- [x] 1.1 Replace `TOKENS_CSS` in `src/templates/tokens.ts` with Vision §2 verbatim (oklch, dark under `:root`, light under `[data-theme='light']`) followed by the iris extension block: `--nav-bg/--nav-text/--nav-active-text/--nav-active-bg`, the six `--type-*` aliases, `--priority-*`, `--code-fg/--code-muted/--code-comment`, the per-theme `--mmd-*` sRGB fallbacks (§8.1 themeVariables and §8.2 classDef hexes), `--backdrop`, `--border-1`, and the existing size/space/leading/weight/duration/easing/nav ramps; keep the `body` and `:focus-visible` rules.
- [x] 1.2 Teach `scripts/token-contract.mjs` to parse oklch (chroma-reduction gamut mapping before luminance), hex, and `var()` chains; move `REQUIRED_TOKENS`, `THEME_REQUIRED_TOKENS`, contrast, control-boundary, and border pairs to the new names (foreground/muted on background/card/card-2; primary on background/card; type-*, success, warning, danger, info on card; nav pairs on nav-bg; code-fg/code-muted/code-comment on code-bg; primary control on the three surfaces; border floor on the three surfaces); keep the threshold-naming messages.
- [x] 1.3 Run the validator and apply the smallest lightness nudges that clear each floor (expected: dark/light `--border`; light `--accent-1..4`, `--success`, `--warning`, `--info`; `--code-comment`/`--code-muted`); note every nudged token and ratio for the docs task.
- [x] 1.4 Extend `scripts/token-lint.mjs` to ban `oklch( oklab( lab( lch( hwb( color(` literals outside the token block while leaving `color-mix(` legal, and keep the generated `iris/design/tokens.css` sync check.
- [x] 1.5 Rewrite `tests/token-contract.test.mjs` for the new names and oklch values, adding cases for oklch parsing, out-of-gamut mapping (dark `--primary`), `var()` resolution, an alpha background rejection, and the three threshold messages.

## 2. Icons

- [x] 2.1 Add `lucide@0.469.0` as a dependency with a `runtimeDependencyRationale` entry stating it is used only at generation time; confirm the package's icon-node export shape (fall back to `lucide-static` with the same serialiser if it differs).
- [x] 2.2 Create `src/templates/icons.ts`: a serialiser from icon nodes to inline `<svg class="lucide lucide-<name> …">` (decorative → `aria-hidden`, labelled → `role="img"` + `aria-label`), a named map for brand (`radar`), sections, project docs, page types, meta-row, callouts, and chrome, and a build-time throw on unknown names.
- [x] 2.3 Add `tests/icons.test.ts`: every mapped icon renders an SVG with the expected class and `viewBox`, unknown names throw, output contains no `<script>` or external reference.
- [x] 2.4 Delete the unused `src/cdn.ts`.

## 3. Component CSS

- [x] 3.1 Replace the head of `BASE_COMPONENTS_CSS` in `src/templates/styles.ts` with Vision §3 verbatim, tokenising its three literals (`pre.code` color → `--code-fg`, `.filename` → `--code-muted`, `.tok-cm` → `--code-comment`), and keep `[hidden]` and `.visually-hidden`.
- [x] 3.2 Write the iris layer against Vision tokens only: app grid, sidebar/nav (active fill + inset rule), topbar extension, crumbs, content, footer, menu button, page head/section heading, `.strip` of `.card.stat`, Work rows/table/Kanban/drawer, Spec browser, command cards, research/document `.layout` + left `.toc` + `.doc-body` descendant rules mirroring `table.ds`/`pre.code`/inline code, empty state, filter input, `.b-muted` and the dashed archived badge.
- [x] 3.3 Merge the media blocks: reduced-motion (no aperture rule; cover `.btn`, `.tab`, `.nav-item`, drawer, rows), the 48 rem shell overlay block, and print (Vision palette plus hide sidebar/topbar/drawer/footer/toc and show the Mermaid fallback).

## 4. Markup migration

- [x] 4.1 `shell.ts`: radar brand mark, Lucide section and project-doc icons, mono badge counts, Vision topbar with the two-button `.mode-toggle` (`data-theme-set`) and `t` hint, `data-iris-nav` retained; remove the hand-drawn `ICONS` map.
- [x] 4.2 `common.ts`: remove `apertureGlyph`/`apertureRing`; add `typeIcon` and `typeBadge`/`statusBadge`/`priorityBadge` emitting `.badge.b-*` with the type icon; `statTile` → `.card.stat`; `progressBar` → `.meter`; update `design.ts` exports.
- [x] 4.3 `pages/overview.ts`: `card.hero` with radar, `h1.page`, `p.subtitle`, quick start, and the pages-by-type badge row with `aria-label` and empty state; `grid-4` stats; `grid-2` Recent work / Spec movement with `.meter`; Architecture card; project docs as a `grid-3` of icon cards.
- [x] 4.4 `pages/work.ts`: stat cards, Vision `.tabs .tab`, rows/table/Kanban/drawer class migration, typed icons at row start, badges.
- [x] 4.5 `pages/research.ts`: index rows; document header as `h1.page` + `.meta-row` (iconed id/agent/updated/tags, type and status badges); body in `.layout` with the sticky left `.toc`.
- [x] 4.6 `pages/contract-page.ts` and the project-doc placeholder: the same header anatomy; sections as `.card`; timeline → Vision `.timeline`; tasks → `table.ds`; steps → `.steps`; metrics → `.card.stat`; callouts with icons.
- [x] 4.7 `pages/spec.ts` and `pages/spec-detail.ts`: `table.ds`, `details.ds`, `pre.code`, callouts, `.layout`/`.toc` in detail records.
- [x] 4.8 `pages/commands.ts`: `.card` grid with status badges.
- [x] 4.9 `lib/markdown.ts`: the Mermaid figure takes the `diagram` class; status line and escaped fallback unchanged.
- [x] 4.10 `script.ts`: theme set/flip with active-button sync and an `iris:theme` dispatch; Mermaid `theme: 'base'` with `themeVariables` read from `--mmd-*`, source retained per figure, re-initialise and re-render on `iris:theme`, security and bounds unchanged.

## 5. Tests

- [x] 5.1 Update `html-navigation` (hero anatomy, badge row, reduced-motion block), `workspace-shell` (selectors, mode toggle, `iris:theme`), `work-board`, `research-pages`, `openspec-browser`, `lifecycle`, and `publish-export` (inline SVG present, still zero resource references) for the new markup.
- [x] 5.2 Add a `markdown-renderer`/script assertion that Mermaid setup reads `--mmd-` tokens and listens for `iris:theme`.

## 6. Documentation, agent surface, and spec

- [x] 6.1 Store the supplied Vision "Electric" v2.0 document verbatim at `docs/vision-electric-v2.md`.
- [x] 6.2 Rewrite `docs/design-system.md` as "iris design system 4.0 — Electric": keep the goal and market research; replace identity, tokens (Vision §2 + reconciliation table with measured ratios + extension table), component inventory (Vision vocabulary), library policy (generation-time icons; Mermaid themed; no Chart.js/React Flow), quality floor (oklch validator), migration step 10, and add "Relationship to Vision Electric v2.0".
- [x] 6.3 Add a `docs/tech.md` decision row and dependency line, one README line naming the design system, and the §8.2 `classDef` snippet to `templates/agents/iris-workspace.md`; regenerate the managed agent surfaces.
- [x] 6.4 Check `docs/status.md` for design-version statements and update them.

## 7. Regenerate and verify

- [x] 7.1 `pnpm build && node dist/src/index.js update && node dist/src/index.js render --all`; confirm `iris/design/tokens.css`, `components/base.css`, and `components/base.js` regenerate and `iris/design/vendor/` is untouched.
- [x] 7.2 `pnpm release:check` (lint, token-lint, typecheck, vitest, html-check, smoke) and `openspec validate electric-design-system --strict`.
- [x] 7.3 Open Overview, Work, Research (index and a document with a Mermaid fence), Spec, and a contract page from `file://` in both themes and at 360 px; publish one page and open the standalone artifact; record anything that needs a follow-up.
