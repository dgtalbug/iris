## Context

See proposal.md for motivation. Today `src/templates/design.ts` (1,522 lines) owns tokens, component CSS, the classic script, contract-page templates, and one `dashboardHtml()` that emits a single `index.html` with Work/Spec tabs. `refreshDashboard()` in `src/commands/render.ts` builds the `DashboardPage[]` projection and writes that one file. `redesign-work-board` (complete, not yet archived) already delivered the dense List/Table/Kanban browser and drawer inside that page.

Hard constraints that shape the approach: deterministic static HTML, opens from `file://`, classic deferred scripts only, no runtime framework or new dependency, token-only CSS enforced by `token-lint`/`token-contract`, generated link integrity enforced by `html-check`, and `publish`/`export --single` must stay self-contained with nav chrome stripped via `data-iris-nav`.

## Goals / Non-Goals

**Goals:**

- Each section is its own small HTML file with its own summary strip; Overview links out instead of embedding.
- One shared shell generator so sidebar, top bar, breadcrumb, and theme behave identically on every page, including contract pages and project docs.
- A cleaner "Electra" palette that still passes the contrast validator in both themes.
- One command catalog that feeds `--help`, the Commands page, and (later) docs.
- Smaller per-page HTML so agents that read generated output spend fewer tokens.

**Non-Goals:**

- Research/Markdown pages (separate change `research-markdown-pages`, which adds its own nav entry).
- Search across pages, saved filters, drag-and-drop, persistence beyond theme and sidebar state.
- Architecture projection and chart blocks (still roadmap step 5).
- Changing contracts, schemas, `state.json` shape, or CLI command names.

## Decisions

### Multi-page static output, not a hash-routed single page

Each section is a separate generated file (`index.html`, `work.html`, `spec.html`, `commands.html`). A hash-routed shell in one file was rejected: it reproduces the "everything on the home page" problem the user named, keeps one enormous file that agents must read whole, and complicates no-JS behavior and per-section publish.

### One `renderShell()` wraps every page

A single function takes `{ current, depth, title, crumbs, topbarSlot, content }` and returns the full document. `depth` drives relative asset and navigation paths (`./` at root, `../` for `project/`, `../../` for `pages/<id>/` and `archive/<id>/`). The sidebar and top bar are marked `data-iris-nav` so the existing publish stripper removes them; the published page body keeps its own heading and back link. Contract pages (`renderPageShell`) and project placeholders adopt the same shell so the app feels continuous.

Alternative: keep contract pages on the old header-only layout. Rejected — inconsistent chrome is exactly what makes the current output feel assembled rather than designed.

### Split `design.ts` into focused modules

`src/templates/tokens.ts` (TOKENS_CSS), `shell.ts` (shell markup + nav model), `styles.ts` (component CSS), `script.ts` (classic JS), `pages/overview.ts`, `pages/work.ts`, `pages/spec.ts`, `pages/commands.ts`, `contract-page.ts`. `design.ts` becomes a thin re-export barrel so existing imports and tests keep working. `token-lint` is pointed at `tokens.ts`. This is the targeted cleanup the redesign needs; no unrelated refactor.

### Electra palette (Aperture 3)

Dark stays the default; light becomes a true peer with a white sidebar on a cool gray ground (the Jira/Trello convention). Interactive accent moves from amber to electric indigo; amber is retained only as the `plan` type color. New tokens: `--nav-bg`, `--nav-text`, `--nav-active-bg`, `--nav-active-text`, `--accent-soft`, `--type-research`, `--type-research-soft`. Final literals are fixed in `tokens.ts` and validated by `token-contract`; the intended values are:

| Token             | Dark      | Light     |
| ----------------- | --------- | --------- |
| `--bg`            | `#0e1117` | `#f4f5f7` |
| `--surface-1`     | `#151923` | `#ffffff` |
| `--surface-2`     | `#1b2030` | `#f1f2f4` |
| `--surface-3`     | `#242a3b` | `#e4e6ea` |
| `--line-1`        | `#2a3143` | `#dfe1e6` |
| `--text-1`        | `#e7eaf2` | `#172b4d` |
| `--text-2`        | `#a4adc2` | `#44546f` |
| `--text-3`        | `#7a8399` | `#626f86` |
| `--accent`        | `#6f8cff` | `#3b5bdb` |
| `--accent-text`   | `#93a8ff` | `#2f4ac0` |
| `--accent-ink`    | `#0b0e14` | `#ffffff` |
| `--nav-bg`        | `#0a0d13` | `#ffffff` |
| `--type-research` | `#2dd4bf` | `#0f766e` |

`iris/config.yaml` already carries `theme:`; generated pages emit `data-theme` from it as the initial theme, and the existing `localStorage` toggle still overrides per browser.

### Command catalog as the single source

`src/lib/command-catalog.ts` exports groups (`setup`, `content`, `render`, `lifecycle`, `share`) of entries `{ name, usage, synopsis, flags, status }` with `status ∈ implemented | partial | stubbed`. `HELP_TEXT` is generated from it (grouped), `commands.html` renders one card per entry with a textual status chip, and the Overview quick-start reads the `content` group. `docs/cmds.md` stays the long-form reference.

### Overview composition

Briefing hero (aperture ring + repo name + one line + quick-start commands) → four summary tiles linking to Work, Spec, Commands, project docs → two columns: recent work (five most recently updated records by ISO `updated`, "not set" last) and spec movement (active changes with a task progress bar) → compact architecture pane (existing empty state) → project-docs strip. Every block ends in a link to its section page.

### Work and Spec relocate unchanged

`work.html` hosts exactly the `redesign-work-board` browser, toolbar, and drawer; `spec.html` hosts the existing `specView()`. Their stat strips come from the same projections. Only the wrapper and relative paths change, which keeps the drawer/keyboard test surface stable.

### Sidebar state and theme persistence

`iris-nav` (`expanded|collapsed`) and the existing `iris-theme` keys in `localStorage`. Browsers differ on whether `file://` pages in different directories share storage; the default (expanded, config theme) is always correct, so persistence is best-effort and never required for correctness. At `≤ 40rem` the sidebar becomes an overlay opened by a top-bar menu button; without JavaScript it renders expanded above the content.

### Retiring the commands placeholder

`PROJECT_DOC_NAMES` drops `commands`; `refreshProjectPlaceholders` removes `iris/project/commands.html` only when the file carries `data-iris-managed` (same ownership rule it already uses to refresh), otherwise leaves it and reports it.

## Risks / Trade-offs

- [Tests assert on the single-page structure] → Update `html-navigation`, `work-board`, `openspec-browser`, `cli-help`, `publish-export`, `token-contract`; add shell/overview/commands tests. Work-board drawer tests move to `work.html` with no behavioral change.
- [More files to keep linked] → `html-check` already walks every generated file; add a test that every nav entry resolves at every depth.
- [Publish strips the shell but page loses context] → Published body keeps its H1, type/status, and a plain back link (already the `data-iris-nav` pattern).
- [Cross-page storage on `file://` varies by browser] → Correct defaults without storage; document as best-effort.
- [Palette change invalidates screenshots/docs] → Regenerate dogfood and update `docs/design-system.md` tokens table in the same change.
- [Aperture delta collides with `redesign-work-board`] → Archive that change first; this delta's MODIFIED blocks are written on top of its text.

## Migration Plan

1. Archive `redesign-work-board` (complete) so `openspec/specs/aperture-design-system` contains its requirements.
2. Land tokens + module split with the existing single page still rendering (tests green).
3. Add the shell and section pages; switch `refreshDashboard` to write all section files; retire the commands placeholder.
4. Update tests, regenerate `iris/`, run the release gate, update docs.

Rollback: revert the change; `iris init`/`iris update` rewrite managed surfaces, and stale section files are harmless static HTML that the next render overwrites.
