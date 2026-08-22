/**
 * Vision "Electric" v2.0 §3 component CSS, then the iris layer for surfaces
 * Vision does not define (the app shell, the Work browser, the Spec browser).
 * Where both define a class the Vision rule is the one that ships and iris
 * markup uses Vision's vocabulary. Colors come only from the token block; the
 * three literals in upstream §3 are tokenised as --code-fg/--code-muted/--code-comment.
 */
export const BASE_COMPONENTS_CSS = `
/* vision-ds components · v2.0 */
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  background: var(--background);
  color: var(--foreground);
  line-height: 1.65;
  font-size: 15px;
  transition: background 0.35s ease, color 0.35s ease;
}
code, pre, kbd, .mono { font-family: var(--font-mono); }
/* Class display values would otherwise defeat the hidden attribute. */
[hidden] { display: none !important; }
.visually-hidden { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* lucide icons */
.lucide { width: 16px; height: 16px; stroke-width: 2; vertical-align: -3px; flex-shrink: 0; }
.icon-lg .lucide, .lucide.lg { width: 22px; height: 22px; }
.ic-primary { color: var(--primary); }
.ic-1 { color: var(--accent-1); } .ic-2 { color: var(--accent-2); }
.ic-3 { color: var(--accent-3); } .ic-4 { color: var(--accent-4); }
.ic-success { color: var(--success); } .ic-warning { color: var(--warning); }
.ic-danger { color: var(--danger); } .ic-muted { color: var(--muted); }

/* typography */
h1.page { font-size: 30px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 8px; text-wrap: balance; }
p.subtitle { color: var(--muted); font-size: 15.5px; margin-bottom: 12px; }
.meta-row { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12.5px; color: var(--muted); margin-bottom: 28px; align-items: center; }
.meta-row span { display: inline-flex; align-items: center; gap: 5px; }
h2.section {
  font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--muted); margin: 40px 0 16px;
  display: flex; align-items: center; gap: 10px;
}
h2.section::after { content: ""; flex: 1; height: 1px; background: var(--border); }
h3 { font-size: 17px; font-weight: 650; letter-spacing: -0.01em; margin: 22px 0 8px; }
h4 { font-size: 14px; font-weight: 650; margin: 16px 0 6px; }
p + p { margin-top: 10px; }
a { color: var(--primary); text-decoration-color: color-mix(in oklch, var(--primary) 40%, transparent); }
strong { font-weight: 650; }
hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }
.eyebrow { font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); }
.mono { font-family: var(--font-mono); font-size: var(--size-2); }

/* cards & grids */
.card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 22px; box-shadow: var(--shadow-card);
}
.card.hero { border-color: color-mix(in oklch, var(--primary) 40%, var(--border)); box-shadow: var(--glow); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

/* stat / metric card */
.stat .value { font-size: 26px; font-weight: 700; color: var(--primary); font-family: var(--font-mono); }
.stat .label { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.stat .delta { font-size: 12px; font-family: var(--font-mono); }
.stat .delta.up { color: var(--success); } .stat .delta.down { color: var(--danger); }

/* badges */
.badge {
  display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 650;
  padding: 3px 10px; border-radius: var(--radius-pill); letter-spacing: 0.02em; vertical-align: middle;
}
.b-primary { background: color-mix(in oklch, var(--primary) 18%, transparent); color: var(--primary); border: 1px solid color-mix(in oklch, var(--primary) 40%, transparent); }
.b-1 { background: color-mix(in oklch, var(--accent-1) 18%, transparent); color: var(--accent-1); border: 1px solid color-mix(in oklch, var(--accent-1) 40%, transparent); }
.b-2 { background: color-mix(in oklch, var(--accent-2) 18%, transparent); color: var(--accent-2); border: 1px solid color-mix(in oklch, var(--accent-2) 40%, transparent); }
.b-3 { background: color-mix(in oklch, var(--accent-3) 18%, transparent); color: var(--accent-3); border: 1px solid color-mix(in oklch, var(--accent-3) 40%, transparent); }
.b-4 { background: color-mix(in oklch, var(--accent-4) 18%, transparent); color: var(--accent-4); border: 1px solid color-mix(in oklch, var(--accent-4) 40%, transparent); }
.b-success { background: color-mix(in oklch, var(--success) 18%, transparent); color: var(--success); border: 1px solid color-mix(in oklch, var(--success) 40%, transparent); }
.b-warning { background: color-mix(in oklch, var(--warning) 18%, transparent); color: var(--warning); border: 1px solid color-mix(in oklch, var(--warning) 40%, transparent); }
.b-danger { background: color-mix(in oklch, var(--danger) 18%, transparent); color: var(--danger); border: 1px solid color-mix(in oklch, var(--danger) 40%, transparent); }

/* confidence chips */
.confidence { font-family: var(--font-mono); font-size: 10.5px; }

/* callouts */
.callout {
  border-radius: var(--radius); padding: 13px 16px; font-size: 13.5px; margin: 12px 0;
  border: 1px solid; display: flex; gap: 10px; align-items: flex-start;
}
.callout .lucide { flex-shrink: 0; margin-top: 2px; }
.callout strong.label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
.c-info { background: color-mix(in oklch, var(--info) 10%, transparent); border-color: color-mix(in oklch, var(--info) 35%, transparent); }
.c-info strong.label, .c-info > .lucide { color: var(--info); }
.c-warn { background: color-mix(in oklch, var(--warning) 10%, transparent); border-color: color-mix(in oklch, var(--warning) 35%, transparent); }
.c-warn strong.label, .c-warn > .lucide { color: var(--warning); }
.c-success { background: color-mix(in oklch, var(--success) 10%, transparent); border-color: color-mix(in oklch, var(--success) 35%, transparent); }
.c-success strong.label, .c-success > .lucide { color: var(--success); }
.c-danger { background: color-mix(in oklch, var(--danger) 10%, transparent); border-color: color-mix(in oklch, var(--danger) 35%, transparent); }
.c-danger strong.label, .c-danger > .lucide { color: var(--danger); }

/* tabs */
.tabs { margin: 14px 0; }
.tabs .tablist { display: flex; gap: 4px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.tabs .tab {
  all: unset; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;
  padding: 8px 16px; color: var(--muted); border-bottom: 2px solid transparent;
  margin-bottom: -1px; display: inline-flex; align-items: center; gap: 6px;
}
.tabs .tab:hover { color: var(--foreground); }
.tabs .tab[aria-selected='true'] { color: var(--primary); border-bottom-color: var(--primary); }
.tabs .tabpanel { padding: 16px 2px; }

/* code blocks */
pre.code {
  background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px; font-size: 12.5px; line-height: 1.7; overflow-x: auto;
  color: var(--code-fg); margin: 12px 0;
}
pre.code .filename {
  display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--code-muted);
  margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.tok-kw { color: var(--accent-4); font-weight: 600; }
.tok-fn { color: var(--accent-1); }
.tok-str { color: var(--accent-3); }
.tok-num { color: var(--accent-2); }
.tok-cm { color: var(--code-comment); font-style: italic; }
.tok-hl { background: color-mix(in oklch, var(--primary) 20%, transparent); border-radius: 3px; padding: 1px 2px; }

/* file tree */
.filetree { font-family: var(--font-mono); font-size: 12.5px; line-height: 1.9; }
.filetree .dir { color: var(--accent-1); font-weight: 600; }
.filetree .file { color: var(--foreground); }
.filetree .note { color: var(--muted); font-size: 11.5px; padding-left: 12px; font-style: italic; }
.filetree .hot { color: var(--primary); font-weight: 600; }

/* tables */
table.ds { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
table.ds th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); padding: 8px 12px; border-bottom: 1px solid var(--border); }
table.ds td { padding: 9px 12px; border-bottom: 1px solid color-mix(in oklch, var(--border) 55%, transparent); }

/* static flow */
.flow { display: flex; align-items: center; flex-wrap: wrap; gap: 0; padding: 8px 0; }
.node {
  padding: 10px 18px; border-radius: 10px; font-size: 12.5px; font-weight: 600;
  border: 1.5px solid; background: var(--card-2); white-space: nowrap; margin: 6px 0;
  display: inline-flex; align-items: center; gap: 7px;
}
.n-primary { border-color: var(--primary); color: var(--primary); box-shadow: 0 0 14px color-mix(in oklch, var(--primary) 25%, transparent); }
.n-1 { border-color: var(--accent-1); color: var(--accent-1); }
.n-2 { border-color: var(--accent-2); color: var(--accent-2); }
.n-3 { border-color: var(--accent-3); color: var(--accent-3); }
.n-4 { border-color: var(--accent-4); color: var(--accent-4); }
.n-danger { border-color: var(--danger); color: var(--danger); }
.edge { width: 42px; height: 1.5px; background: var(--border); position: relative; flex-shrink: 0; }
.edge::after {
  content: ""; position: absolute; right: 0; top: -3.25px;
  border-left: 7px solid var(--muted); border-top: 4px solid transparent; border-bottom: 4px solid transparent;
}

/* numbered steps */
.steps { counter-reset: step; list-style: none; padding: 0; }
.steps li { counter-increment: step; position: relative; padding: 0 0 18px 44px; }
.steps li::before {
  content: counter(step); position: absolute; left: 0; top: 0;
  width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
  font-size: 12.5px; font-weight: 700; font-family: var(--font-mono);
  background: color-mix(in oklch, var(--primary) 18%, transparent);
  color: var(--primary); border: 1px solid color-mix(in oklch, var(--primary) 40%, transparent);
}
.steps li::after { content: ""; position: absolute; left: 13.5px; top: 30px; bottom: 2px; width: 1.5px; background: var(--border); }
.steps li:last-child::after { display: none; }

/* timeline */
.timeline { list-style: none; padding: 0; }
.timeline li { position: relative; padding: 0 0 20px 28px; }
.timeline li::before {
  content: ""; position: absolute; left: 0; top: 6px; width: 10px; height: 10px;
  border-radius: 50%; background: var(--primary); box-shadow: 0 0 8px color-mix(in oklch, var(--primary) 50%, transparent);
}
.timeline li.past::before { background: var(--muted); box-shadow: none; }
.timeline li.warn::before { background: var(--warning); box-shadow: none; }
.timeline li.danger::before { background: var(--danger); box-shadow: none; }
.timeline li::after { content: ""; position: absolute; left: 4.25px; top: 20px; bottom: 0; width: 1.5px; background: var(--border); }
.timeline li:last-child::after { display: none; }
.timeline .when { font-size: 11.5px; font-family: var(--font-mono); color: var(--muted); }
.timeline .what { font-size: 13.5px; }

/* meters */
.meter { margin: 8px 0; }
.meter .meter-head { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
.meter .meter-head .val { font-family: var(--font-mono); color: var(--muted); }
.meter .track { height: 8px; border-radius: 999px; background: var(--card-2); border: 1px solid var(--border); overflow: hidden; }
.meter .fill { height: 100%; border-radius: 999px; background: var(--primary); }
.meter.m-success .fill { background: var(--success); }
.meter.m-warning .fill { background: var(--warning); }
.meter.m-danger .fill { background: var(--danger); }

/* evidence block */
.evidence {
  border-left: 3px solid var(--accent-1); background: color-mix(in oklch, var(--accent-1) 6%, transparent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 10px 14px; margin: 10px 0; font-size: 13px;
}
.evidence .src { font-family: var(--font-mono); font-size: 11.5px; color: var(--accent-1); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }

/* footnotes */
sup.fn a { font-family: var(--font-mono); font-size: 10.5px; text-decoration: none; color: var(--accent-1); }
.footnotes { font-size: 12.5px; color: var(--muted); border-top: 1px solid var(--border); margin-top: 40px; padding-top: 16px; }
.footnotes li { margin: 6px 0; }
.footnotes code { font-size: 11.5px; }

/* collapsible */
details.ds { border: 1px solid var(--border); border-radius: var(--radius); margin: 10px 0; background: var(--card); }
details.ds summary { cursor: pointer; padding: 12px 16px; font-weight: 600; font-size: 13.5px; display: flex; align-items: center; gap: 8px; }
details.ds[open] summary { border-bottom: 1px solid var(--border); }
details.ds .body { padding: 14px 16px; }

/* buttons, kbd, toggle */
.btn { all: unset; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; padding: 8px 18px; border-radius: 10px; transition: all 0.2s; display: inline-flex; align-items: center; gap: 7px; }
.btn-primary { background: var(--primary); color: var(--primary-fg); }
.btn-primary:hover { box-shadow: var(--glow); transform: translateY(-1px); }
.btn-outline { border: 1px solid var(--border); color: var(--foreground); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-ghost { color: var(--muted); }
.btn-ghost:hover { color: var(--foreground); background: var(--card-2); }
kbd { font-size: 11px; padding: 2px 7px; border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 6px; background: var(--card-2); }
.mode-toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.mode-toggle button { all: unset; cursor: pointer; padding: 6px 14px; font-size: 12.5px; font-weight: 550; color: var(--muted); font-family: inherit; display: inline-flex; align-items: center; gap: 6px; }
.mode-toggle button.active { background: var(--primary); color: var(--primary-fg); }

/* diagram & chart containers */
.diagram {
  background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 20px; margin: 14px 0; overflow-x: auto;
}
.diagram .caption { font-size: 12px; color: var(--muted); margin-top: 10px; text-align: center; }
.chart-box { position: relative; height: 300px; }
.chart-box.tall { height: 420px; }
/* end vision-ds components */

/* iris layer — the workspace shell Vision does not define */
/*
 * Flex rather than a two-column grid: publish strips the sidebar, and a grid
 * would keep holding its column and squeeze the content into the remainder.
 */
.app { display: flex; align-items: stretch; min-height: 100vh; }
.app > * { min-width: 0; }
.sidebar { flex: 0 0 var(--nav-width); position: sticky; top: 0; height: 100vh; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; overflow: hidden; background: var(--nav-bg); border-right: 1px solid var(--border); transition: width var(--duration-2) var(--easing); }
.sidebar-brand { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-3) var(--space-3); color: var(--foreground); text-decoration: none; }
.sidebar-brand .lucide { width: 22px; height: 22px; color: var(--primary); }
.sidebar-brand strong { font-weight: var(--weight-bold); letter-spacing: -0.01em; white-space: nowrap; }
.sidebar-brand small { display: block; color: var(--muted); font-family: var(--font-mono); font-size: var(--size-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-scroll { overflow: auto; padding: 0 var(--space-2) var(--space-2); }
.nav-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.nav-group { padding: var(--space-4) var(--space-3) var(--space-2); }
.nav-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); color: var(--nav-text); text-decoration: none; font-size: var(--size-2); font-weight: var(--weight-medium); white-space: nowrap; border-left: 3px solid transparent; transition: background var(--duration-1) var(--easing), color var(--duration-1) var(--easing); }
.nav-item:hover { background: var(--hover); color: var(--foreground); }
.nav-item[aria-current='page'] { background: var(--nav-active-bg); color: var(--nav-active-text); border-left-color: var(--primary); }
.nav-item .lucide { color: currentColor; }
.nav-count { margin-left: auto; font-family: var(--font-mono); font-size: var(--size-1); font-style: normal; color: var(--muted); }
.sidebar-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); padding: var(--space-3); border-top: 1px solid var(--border); }
.sidebar-version { font-size: var(--size-1); color: var(--muted); font-family: var(--font-mono); white-space: nowrap; }
.nav-collapse { all: unset; cursor: pointer; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); color: var(--muted); font-family: inherit; }
.nav-collapse:hover { background: var(--hover); color: var(--foreground); }
[data-nav='collapsed'] .sidebar-version { display: none; }
[data-nav='collapsed'] .nav-item { justify-content: center; padding-inline: 0; border-left-width: 0; }
[data-nav='collapsed'] .nav-item span, [data-nav='collapsed'] .nav-count, [data-nav='collapsed'] .sidebar-brand span, [data-nav='collapsed'] .nav-group { display: none; }
[data-nav='collapsed'] .sidebar-brand { justify-content: center; padding-inline: 0; }
[data-nav='collapsed'] .sidebar-foot { justify-content: center; }

.main { flex: 1 1 auto; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; min-height: 100vh; }
.main > * { min-width: 0; }
.topbar {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  padding: 14px 28px;
  background: color-mix(in oklch, var(--background) 82%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.crumbs { display: flex; align-items: center; gap: var(--space-2); font-size: 12.5px; color: var(--muted); flex-wrap: wrap; }
.crumbs a { color: var(--muted); text-decoration: none; }
.crumbs a:hover { color: var(--primary); }
.crumbs b { color: var(--foreground); font-weight: var(--weight-medium); }
.topbar-spacer { flex: 1; }
.menu-button { display: none; }
.content { padding: 32px 28px 64px; display: grid; gap: var(--space-5); align-content: start; }
.content > * { min-width: 0; }
.footer { display: flex; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; padding: var(--space-4) 28px; border-top: 1px solid var(--border); color: var(--muted); font-size: var(--size-1); }

/* page furniture */
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap; }
.page-head p { color: var(--muted); max-width: 68ch; }
.page-head-actions { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; font-size: var(--size-1); color: var(--muted); }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-3); }
.section-heading h2 { font-size: var(--size-4); }
.strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: 14px; }
a.stat:hover { border-color: color-mix(in oklch, var(--primary) 45%, var(--border)); }
.stat { display: grid; gap: 2px; text-decoration: none; color: inherit; padding: 16px 18px; }
.stat .sub { font-size: var(--size-1); color: var(--muted); }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-3); }
.card-head a { font-size: var(--size-2); text-decoration: none; }
.card-body { display: grid; gap: var(--space-2); }
.hero { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: var(--space-5); align-items: start; }
.hero-copy { display: grid; align-content: start; }
.hero-mark { display: flex; align-items: center; gap: var(--space-2); }
.hero-mark .lucide { width: 26px; height: 26px; color: var(--primary); }
.hero-types { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-3); }
.hero-quickstart { display: grid; gap: var(--space-2); align-content: start; }
.hero-quickstart code { font-family: var(--font-mono); font-size: var(--size-1); }
.doc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 14px; }
.doc-card { display: grid; gap: var(--space-1); text-decoration: none; color: inherit; }
.doc-card:hover { border-color: color-mix(in oklch, var(--primary) 45%, var(--border)); }
.doc-card .lucide { color: var(--primary); }
.doc-card-label { font-weight: var(--weight-bold); }
.doc-card-purpose { font-size: var(--size-2); color: var(--muted); }
.empty-state { border: 1px dashed var(--border); border-radius: var(--radius); padding: 22px; color: var(--muted); font-size: var(--size-2); }
.empty-state h2 { font-size: var(--size-3); color: var(--foreground); margin-bottom: var(--space-2); }
.empty-state code, .hero-quickstart code, .page-head code { background: var(--card-2); padding: 2px 7px; border-radius: 6px; font-size: 0.86em; color: var(--accent-1); font-family: var(--font-mono); }

/* badge variants iris adds to Vision's set */
.b-muted { background: color-mix(in oklch, var(--muted) 14%, transparent); color: var(--muted); border: 1px solid color-mix(in oklch, var(--muted) 35%, transparent); }
.b-archived { background: transparent; color: var(--muted); border: 1px dashed color-mix(in oklch, var(--muted) 55%, transparent); }

/* filters and toolbars */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.filter-wrap { display: flex; align-items: center; gap: var(--space-2); }
.filter-input { background: var(--card-2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--foreground); font-family: inherit; font-size: var(--size-2); padding: var(--space-2) var(--space-3); min-width: 14rem; }
.filter-input::placeholder { color: var(--muted); }
.work-result-count { font-size: var(--size-1); color: var(--muted); font-family: var(--font-mono); }

/* work browser */
.work-surface { display: grid; gap: var(--space-3); }
.list { display: grid; }
.work-list-row + .work-list-row { border-top: 1px solid color-mix(in oklch, var(--border) 55%, transparent); }
.work-row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto auto auto; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); text-decoration: none; color: inherit; transition: background var(--duration-1) var(--easing); }
.work-row:hover, .work-row:focus-visible { background: var(--hover); }
.work-row-primary { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; min-width: 0; }
.work-row-title { font-weight: var(--weight-medium); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.work-row-id, .work-meta { font-family: var(--font-mono); font-size: var(--size-1); color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.work-table-wrap { overflow-x: auto; }
.work-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.work-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); padding: 8px 12px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--card); }
.work-table td { padding: 9px 12px; border-bottom: 1px solid color-mix(in oklch, var(--border) 55%, transparent); }
.work-table tbody tr:hover { background: var(--hover); }
.work-table tbody tr:last-child td { border-bottom: 0; }
.work-title-cell a, .work-table-title { color: inherit; text-decoration: none; font-weight: var(--weight-medium); }
.work-title-cell a:hover, .work-table-title:hover { color: var(--primary); }
.kanban { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; align-items: start; }
.kanban-col { background: var(--card-2); border: 1px solid var(--border); border-radius: var(--radius); padding: var(--space-3); display: grid; gap: var(--space-2); align-content: start; }
.kanban-col-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); font-weight: var(--weight-bold); }
.kanban-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-3); display: grid; gap: var(--space-2); text-decoration: none; color: inherit; }
.kanban-card:hover, .kanban-card:focus-visible { border-color: color-mix(in oklch, var(--primary) 45%, var(--border)); }
.kanban-card-head, .kanban-card-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); flex-wrap: wrap; }
.kanban-card-head .mono { color: var(--muted); }
.kanban-card-title { font-size: var(--size-2); font-weight: var(--weight-medium); }
.kanban-empty { font-size: var(--size-1); color: var(--muted); }

.work-list-row.compact .work-row { grid-template-columns: auto minmax(0, 1fr) auto; padding: var(--space-2) 0; }

/* work drawer */
.work-drawer-shell { position: fixed; inset: 0; z-index: 60; display: grid; grid-template-columns: minmax(0, 1fr) auto; }
.work-drawer-backdrop { all: unset; cursor: pointer; background: var(--backdrop); }
.work-drawer { width: min(30rem, 100vw); background: var(--card); border-left: 1px solid var(--border); display: grid; grid-template-rows: auto minmax(0, 1fr); overflow: hidden; animation: drawer-enter var(--duration-2) var(--easing); }
.work-drawer-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-4); border-bottom: 1px solid var(--border); }
.work-drawer-body { overflow: auto; padding: var(--space-4); display: grid; gap: var(--space-4); align-content: start; }
.work-drawer-title { font-size: var(--size-4); }
.work-drawer-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-3); margin: 0; }
.work-drawer-meta dt { font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); }
.work-drawer-meta dd { margin: 0; font-size: var(--size-2); }
.work-drawer-section h3 { font-size: var(--size-2); text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin: 0 0 var(--space-1); }
.work-drawer-actions { display: flex; gap: var(--space-2); }

/* document layout (research, spec records) */
.layout { display: grid; grid-template-columns: 230px 1fr; gap: 40px; align-items: start; }
.toc { position: sticky; top: 72px; font-size: 13px; max-height: calc(100vh - 100px); overflow-y: auto; }
.toc .toc-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; font-weight: 700; }
.toc ol { list-style: none; margin: 0; padding: 0; }
.toc a { display: block; color: var(--muted); text-decoration: none; padding: 4px 10px; border-left: 2px solid var(--border); }
.toc a:hover, .toc a.active { color: var(--primary); border-left-color: var(--primary); }
.toc .toc-3 a { padding-left: 22px; }

/* Markdown output carries no classes, so document bodies mirror table.ds and pre.code by descent. */
.doc-body { display: grid; gap: var(--space-3); align-content: start; }
.doc-body > * { min-width: 0; }
.doc-body h1, .doc-body h2 { font-size: var(--size-4); letter-spacing: -0.01em; margin-top: var(--space-3); }
.doc-body h3, .doc-body h4 { font-size: var(--size-3); margin-top: var(--space-2); }
.doc-body ul, .doc-body ol { padding-left: 22px; margin: 8px 0; }
.doc-body li { margin: 4px 0; }
.doc-body code { background: var(--card-2); padding: 2px 7px; border-radius: 6px; font-size: 0.86em; color: var(--accent-1); }
.doc-body pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; font-size: 12.5px; line-height: 1.7; overflow-x: auto; color: var(--code-fg); }
.doc-body pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
.doc-body table { width: 100%; border-collapse: collapse; font-size: 13px; display: block; overflow-x: auto; }
.doc-body th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); padding: 8px 12px; border-bottom: 1px solid var(--border); }
.doc-body td { padding: 9px 12px; border-bottom: 1px solid color-mix(in oklch, var(--border) 55%, transparent); }
.doc-body blockquote { border-left: 3px solid var(--accent-1); background: color-mix(in oklch, var(--accent-1) 6%, transparent); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding: 10px 14px; }
.doc-body hr { margin: var(--space-3) 0; }
.doc-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12.5px; color: var(--muted); align-items: center; }
.task-checkbox { accent-color: var(--primary); }
.task-list-item { list-style: none; margin-left: -18px; }
.spec-image-reference { font-family: var(--font-mono); font-size: var(--size-1); color: var(--muted); }

/* document pieces without a Vision equivalent */
.doc-single { display: grid; gap: var(--space-3); }
.page-title-row { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); flex-wrap: wrap; }
.doc-checklist { display: grid; gap: var(--space-1); padding-left: 22px; color: var(--muted); font-size: var(--size-2); }
.project-links { display: flex; flex-wrap: wrap; gap: var(--space-2); font-size: var(--size-2); }
.project-strip { display: grid; gap: var(--space-2); }
.spec-holdings-line { font-size: var(--size-2); }
.spec-source-details summary { cursor: pointer; font-size: var(--size-2); color: var(--muted); }

/* spec browser */
.spec-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.spec-stack { display: grid; gap: var(--space-4); }
.spec-list { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--space-2); }
.spec-path, .spec-meta { font-family: var(--font-mono); font-size: var(--size-1); color: var(--muted); }
.spec-warning { font-size: var(--size-2); }
.spec-card-header { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
.spec-artifact { display: grid; gap: var(--space-2); }
.spec-source pre, .spec-source-details pre { max-height: 28rem; overflow: auto; }
.spec-detail-region { display: grid; gap: var(--space-4); }
.change-row { display: grid; gap: var(--space-2); padding: var(--space-2) 0; }
.change-row + .change-row { border-top: 1px solid color-mix(in oklch, var(--border) 55%, transparent); }
.change-row-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); }
.spec-holdings { display: grid; gap: var(--space-2); }

/* commands */
.command-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 14px; }
.command-card { display: grid; gap: var(--space-2); align-content: start; }
.command-card-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
.command-usage { font-family: var(--font-mono); font-size: var(--size-1); color: var(--muted); }
.command-flags { display: grid; gap: var(--space-1); font-size: var(--size-2); color: var(--muted); }

/* mermaid figures */
.mermaid-figure { display: grid; gap: var(--space-2); min-width: 0; }
.mermaid-status { font-size: var(--size-1); color: var(--muted); }
/*
 * The host must be laid out before the renderer will touch it: renderFigure
 * skips any host with no client rects, so visibility follows the host's own
 * state and never the figure's, which is only set after a successful render.
 */
.mermaid-host { display: none; min-width: 0; overflow: auto; }
.mermaid-host[data-render-state='measuring'],
.mermaid-host[data-render-state='pending'],
.mermaid-host[data-render-state='rendered'] { display: block; }
.mermaid-host svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
.mermaid-figure[data-render-state='rendered'] .mermaid-fallback,
.mermaid-figure[data-render-state='rendered'] .mermaid-status { display: none; }
.mermaid-fallback { background: var(--code-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; font-size: 12.5px; overflow: auto; max-height: 24rem; margin: 0; white-space: pre; color: var(--code-fg); }
.mermaid-figure[data-render-state='error'] { border-color: var(--danger); }
.mermaid-figure[data-render-state='error'] .mermaid-status { color: var(--danger); }

@keyframes drawer-enter { from { transform: translateX(100%); } to { transform: translateX(0); } }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  body, .sidebar, .nav-item, .work-row, .work-table tbody tr, .kanban-card, .work-drawer, .stat, .doc-card, .btn, .tabs .tab, .mode-toggle button { animation: none !important; transition: none !important; }
  .btn-primary:hover { transform: none; }
}
@media (max-width: 900px) {
  .grid-2, .grid-3 { grid-template-columns: 1fr; }
  .grid-4 { grid-template-columns: 1fr 1fr; }
  .layout { grid-template-columns: 1fr; }
  .toc { display: none; }
  .hero { grid-template-columns: minmax(0, 1fr); }
  .spec-grid { grid-template-columns: minmax(0, 1fr); }
  .kanban { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 48rem) {
  .sidebar { position: fixed; inset: 0 auto 0 0; width: var(--nav-width); z-index: 70; transform: translateX(-100%); transition: transform var(--duration-2) var(--easing); }
  [data-nav-open] .sidebar { transform: translateX(0); }
  [data-nav='collapsed'] { --nav-width: 15rem; }
  .menu-button { display: inline-flex; }
  .topbar { padding: 10px 16px; }
  .topbar .filter-input { min-width: 0; flex: 1 1 6rem; }
  .topbar .mode-toggle kbd { display: none; }
  .content { padding: 20px 16px 48px; }
  .footer { padding: var(--space-4) 16px; }
  .page-head p { max-width: none; }
  .grid-4 { grid-template-columns: 1fr; }
  .work-row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .work-row .work-updated, .work-row .work-agent { display: none; }
  .work-table .col-agent, .work-table .col-updated, .work-table .col-priority, .work-table .col-type { display: none; }
  .work-title-cell { max-width: 12rem; }
  .work-drawer { width: 100%; border-left: 0; }
  .work-drawer-meta { grid-template-columns: minmax(0, 1fr); }
  .work-drawer-shell { grid-template-columns: minmax(0, 1fr); }
}
@media print {
  .sidebar, .topbar, .footer, .toc, .work-drawer-shell, kbd, .mode-toggle { display: none !important; }
  .app { display: block; }
  .main { display: block; }
  .content { width: 100%; padding: 0; }
  .card { box-shadow: none; break-inside: avoid; }
  .layout { grid-template-columns: minmax(0, 1fr); }
  a { color: inherit; text-decoration: underline; }
  .doc-body pre, .doc-body table, .spec-source, pre.code { max-height: none; overflow: visible; }
  .mermaid-host { display: none !important; }
  .mermaid-fallback { display: block !important; max-height: none; overflow: visible; white-space: pre-wrap; }
  /* Printing has no tab interaction, so every panel must render, not just the selected one. */
  .tabs .tabpanel[hidden] { display: block !important; }
}
`;
