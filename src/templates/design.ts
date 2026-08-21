import { CDN } from '../cdn.js';

export const TOKENS_CSS = `:root {
  --bg: hsl(228 26% 8%);
  --surface-1: hsl(227 22% 12%);
  --surface-2: hsl(226 19% 16%);
  --surface-3: hsl(225 16% 22%);
  --text-1: hsl(40 24% 94%);
  --text-2: hsl(228 12% 74%);
  --text-3: hsl(228 10% 56%);
  --accent: hsl(40 92% 62%);
  --accent-ink: hsl(228 26% 10%);
  --ok: hsl(152 52% 50%);
  --warn: hsl(28 92% 58%);
  --danger: hsl(357 78% 62%);
  --info: hsl(199 84% 62%);
  --chart-1: hsl(199 84% 62%);
  --chart-2: hsl(276 70% 63%);
  --chart-3: hsl(152 52% 50%);
  --chart-4: hsl(40 92% 62%);
  --chart-5: hsl(12 83% 65%);
  --chart-6: hsl(324 75% 62%);
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --size-1: 0.6875rem;
  --size-2: 0.875rem;
  --size-3: 1rem;
  --size-4: 1.25rem;
  --size-5: 2rem;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2.5rem;
  --radius-1: 0.375rem;
  --radius-2: 0.625rem;
  --radius-3: 1rem;
  --border-1: 1px solid hsl(228 14% 24%);
  --elevation-1: 0 0.25rem 0.75rem hsl(228 50% 3% / 0.35);
  --duration-1: 120ms;
  --duration-2: 220ms;
  --duration-3: 320ms;
  --easing: cubic-bezier(0.22, 0.61, 0.36, 1);
}

[data-theme='light'] {
  --bg: hsl(42 38% 96%);
  --surface-1: hsl(40 30% 99%);
  --surface-2: hsl(42 28% 93%);
  --surface-3: hsl(42 22% 87%);
  --text-1: hsl(232 20% 14%);
  --text-2: hsl(230 12% 32%);
  --text-3: hsl(230 8% 48%);
  --accent: hsl(34 90% 40%);
  --accent-ink: hsl(40 30% 99%);
  --border-1: 1px solid hsl(40 16% 80%);
  --elevation-1: 0 0.25rem 0.75rem hsl(40 20% 60% / 0.25);
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text-1);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
`;

export const BASE_COMPONENTS_CSS = `
.page-shell { max-width: 70rem; margin: 0 auto; padding: var(--space-5); }
.surface { background: var(--surface-1); border: var(--border-1); border-radius: var(--radius-2); box-shadow: var(--elevation-1); }
a { color: var(--accent); }
h1 { font-size: var(--size-5); font-weight: var(--weight-bold); letter-spacing: -0.02em; margin: 0; }
h2 { font-size: var(--size-4); margin: 0 0 var(--space-3); letter-spacing: -0.01em; }
.eyebrow { font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-3); }
.mono { font-family: var(--font-mono); font-size: var(--size-2); }

.header { display: grid; gap: var(--space-4); margin-bottom: var(--space-5); }
.topbar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.crumbs { display: flex; align-items: center; gap: var(--space-2); }
.crumbs a { color: var(--text-2); text-decoration: none; font-family: var(--font-mono); font-size: var(--size-2); }
.crumbs a:hover { color: var(--accent); }
.theme-toggle { background: var(--surface-2); border: var(--border-1); color: var(--text-2); border-radius: 999px; padding: var(--space-1) var(--space-3); cursor: pointer; font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; }
.theme-toggle:hover { color: var(--text-1); border-color: var(--accent); }

.hero { display: flex; align-items: center; gap: var(--space-5); padding: var(--space-5); }
.hero-copy { display: grid; gap: var(--space-2); }
.hero-line { margin: 0; color: var(--text-2); font-family: var(--font-mono); font-size: var(--size-2); }
.header-bar { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); flex-wrap: wrap; }

.aperture { flex: none; }
.aperture .seg { stroke: currentColor; fill: none; stroke-width: 7; stroke-linecap: butt; transition: stroke-width var(--duration-2) var(--easing); }
.aperture .seg:hover { stroke-width: 10; }
.aperture .ring-empty { stroke: var(--surface-3); fill: none; stroke-width: 2; stroke-dasharray: 4 6; }
.aperture-count { font-family: var(--font-mono); font-size: 1.375rem; font-weight: var(--weight-bold); fill: var(--text-1); }
.aperture-label { font-family: var(--font-mono); font-size: 0.5rem; letter-spacing: 0.16em; text-transform: uppercase; fill: var(--text-3); }

.type-chip { display: inline-flex; align-items: center; padding: var(--space-1) var(--space-2); border-radius: 999px; background: var(--surface-2); font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-2); }
.status-chip { font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; }
.st-draft { color: var(--text-3); }
.st-active { color: var(--info); }
.st-done { color: var(--ok); }
.st-archived { color: var(--text-3); }
.st-stale { color: var(--danger); }

.toolbar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.tabs { display: flex; gap: var(--space-2); }
.tab-button { background: var(--surface-2); border: var(--border-1); color: var(--text-2); border-radius: var(--radius-1); padding: var(--space-2) var(--space-3); cursor: pointer; font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; }
.tab-button[aria-selected='true'] { color: var(--accent-ink); background: var(--accent); border-color: var(--accent); }
.filter-input { background: var(--surface-2); border: var(--border-1); color: var(--text-1); border-radius: var(--radius-1); padding: var(--space-2) var(--space-3); font-family: var(--font-mono); font-size: var(--size-2); min-width: 14rem; }
.filter-input::placeholder { color: var(--text-3); }

.list { display: grid; gap: var(--space-3); }
/* Class display values would otherwise defeat the hidden attribute. */
[hidden] { display: none !important; }
.page-card { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--space-3); padding: var(--space-4); text-decoration: none; color: inherit; transition: border-color var(--duration-1) var(--easing), transform var(--duration-1) var(--easing); }
.page-card:hover { border-color: var(--accent); transform: translateY(-1px); }
.card-main { display: grid; gap: var(--space-1); min-width: 0; }
.card-title { font-weight: var(--weight-medium); color: var(--text-1); }
.card-id { font-family: var(--font-mono); font-size: var(--size-1); color: var(--text-3); overflow-wrap: anywhere; }
.empty-state { padding: var(--space-5); color: var(--text-2); }
.empty-state code { font-family: var(--font-mono); color: var(--accent); }

.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: var(--space-3); }
.board-col { display: grid; gap: var(--space-3); align-content: start; }
.board-col .eyebrow { padding: var(--space-2) var(--space-1) 0; }
.board-empty { color: var(--text-3); font-size: var(--size-2); padding: var(--space-2) var(--space-1); }

.project-strip { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); margin-top: var(--space-4); flex-wrap: wrap; }
.project-links { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.project-links a { font-family: var(--font-mono); font-size: var(--size-2); text-decoration: none; color: var(--text-2); }
.project-links a:hover { color: var(--accent); }

.footer { margin-top: var(--space-6); color: var(--text-3); font-size: var(--size-2); font-family: var(--font-mono); }

.timeline { position: relative; margin-left: var(--space-4); border-left: var(--border-1); padding-left: var(--space-4); }
.timeline-item { margin-bottom: var(--space-4); opacity: 0; transform: translateY(0.5rem); animation: timeline-in var(--duration-3) var(--easing) forwards; }
.timeline-item.info::before,.timeline-item.warn::before,.timeline-item.error::before { content: ''; position: absolute; left: -0.41rem; width: 0.5rem; height: 0.5rem; border-radius: 50%; }
.timeline-item.info::before { background: var(--info); }
.timeline-item.warn::before { background: var(--warn); }
.timeline-item.error::before { background: var(--danger); }
.code-card { padding: var(--space-4); display: grid; gap: var(--space-2); }
.code-toolbar { display: flex; justify-content: space-between; align-items: center; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: var(--space-3); }
.metric-card { padding: var(--space-3); }
.metric-label { font-family: var(--font-mono); font-size: var(--size-1); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.12em; }
.metric-value { margin-top: var(--space-2); font-size: var(--size-4); font-weight: var(--weight-bold); }
.table-wrap { overflow: auto; }
.chart-wrap, .mermaid-wrap, .flow-wrap { min-height: 16rem; padding: var(--space-4); }

@keyframes timeline-in { to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .timeline-item { animation: none; opacity: 1; transform: none; }
  .page-card, .aperture .seg { transition: none; }
  .page-card:hover { transform: none; }
}
`;

export const BASE_COMPONENTS_JS = `
function setupTabs() {
  for (const group of document.querySelectorAll('[data-tabs]')) {
    const buttons = group.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[data-tab-group="' + group.getAttribute('data-tabs') + '"]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        buttons.forEach((it) => it.setAttribute('aria-selected', String(it === button)));
        panels.forEach((panel) => {
          panel.hidden = panel.getAttribute('data-tab-id') !== button.getAttribute('data-tab-id');
        });
      });
    });
  }
}

function setupViewToggle() {
  const listBtn = document.querySelector('[data-view="list"]');
  const boardBtn = document.querySelector('[data-view="board"]');
  const list = document.querySelector('[data-dashboard-list]');
  const board = document.querySelector('[data-dashboard-board]');
  if (!listBtn || !boardBtn || !list || !board) return;
  const setView = (view) => {
    list.hidden = view !== 'list';
    board.hidden = view !== 'board';
    listBtn.setAttribute('aria-selected', String(view === 'list'));
    boardBtn.setAttribute('aria-selected', String(view === 'board'));
  };
  listBtn.addEventListener('click', () => setView('list'));
  boardBtn.addEventListener('click', () => setView('board'));
}

function setupFilter() {
  const input = document.querySelector('[data-filter-input]');
  if (!input) return;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    for (const card of document.querySelectorAll('[data-page-card]')) {
      card.hidden = query !== '' && !card.textContent.toLowerCase().includes(query);
    }
  });
}

function setupTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const stored = localStorage.getItem('iris-theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('iris-theme', next);
  });
}

async function setupMermaid() {
  const blocks = document.querySelectorAll('[data-mermaid-source]');
  if (blocks.length === 0) return;
  const mermaidModule = await import('${CDN.mermaid}');
  const mermaid = mermaidModule.default;
  mermaid.initialize({ startOnLoad: false });
  for (const block of blocks) {
    const source = block.getAttribute('data-mermaid-source');
    if (!source) continue;
    const id = 'mermaid-' + Math.random().toString(36).slice(2);
    const rendered = await mermaid.render(id, source);
    block.innerHTML = rendered.svg;
  }
}

async function setupCodeCards() {
  const blocks = document.querySelectorAll('[data-code-card]');
  if (blocks.length === 0) return;
  const shiki = await import('${CDN.shiki}');
  for (const block of blocks) {
    const source = block.getAttribute('data-code-source') || '';
    const lang = block.getAttribute('data-code-lang') || 'text';
    const html = await shiki.codeToHtml(source, { lang, theme: 'github-dark' });
    block.innerHTML = html;
  }
}

function setupCharts() {
  const blocks = document.querySelectorAll('canvas[data-chart-config]');
  if (blocks.length === 0) return;
  const script = document.createElement('script');
  script.src = '${CDN.chartJs}';
  script.onload = () => {
    for (const block of blocks) {
      const config = block.getAttribute('data-chart-config');
      if (!config) continue;
      // @ts-ignore
      new window.Chart(block, JSON.parse(config));
    }
  };
  document.head.appendChild(script);
}

setupTabs();
setupViewToggle();
setupFilter();
setupTheme();
setupMermaid().catch(() => {});
setupCodeCards().catch(() => {});
setupCharts();
document.documentElement.setAttribute('data-iris-js', 'ready');
`;

export type DashboardPage = {
  id: string;
  type: string;
  title: string;
  status: string;
  href: string;
  stale?: boolean;
};

export const PROJECT_DOC_NAMES = [
  'overview',
  'hld',
  'lld',
  'erd',
  'commands',
  'decisions',
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'md' in value && typeof value.md === 'string')
    return value.md;
  return '';
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function linkifyEscaped(escaped: string): string {
  return escaped.replace(
    /https?:\/\/[^\s<]+/g,
    (url) => `<a href="${url}" rel="noopener">${url}</a>`,
  );
}

function markdownToHtml(value: string): string {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) return '<p>Empty.</p>';

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim());
      if (lines.some((line) => /^[-*] /.test(line))) {
        const items = lines
          .filter((line) => /^[-*] /.test(line))
          .map((line) => `<li>${linkifyEscaped(escapeHtml(line.replace(/^[-*]\s*/, '')))}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      return `<p>${linkifyEscaped(escapeHtml(block)).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

function statusClass(status: string, stale?: boolean): string {
  if (stale) return 'st-stale';
  return ['draft', 'active', 'done', 'archived'].includes(status) ? `st-${status}` : 'st-active';
}

function renderMetricGrid(entries: Array<{ label: string; value: string }>): string {
  if (entries.length === 0) return '';

  const cards = entries
    .map(
      (entry) => `
        <article class="surface metric-card">
          <div class="metric-label">${escapeHtml(entry.label)}</div>
          <div class="metric-value">${escapeHtml(entry.value)}</div>
        </article>
      `,
    )
    .join('');

  return `<section class="metric-grid" style="margin-bottom: var(--space-4);">${cards}</section>`;
}

function renderSummaryBlock(title: string, text: string): string {
  if (!text.trim()) return '';
  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>${escapeHtml(title)}</h2>
      ${markdownToHtml(text)}
    </article>
  `;
}

function renderTimeline(events: unknown[]): string {
  if (!Array.isArray(events) || events.length === 0) return '';

  const items = events
    .map((event) => {
      const record = asObject(event);
      const time = typeof record.t === 'string' ? record.t : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Event';
      const level = typeof record.level === 'string' ? record.level : 'info';
      return `
        <div class="timeline-item ${escapeHtml(level)}" style="position: relative;">
          <strong class="mono">${escapeHtml(time)}</strong>
          <div>${escapeHtml(title)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>Timeline</h2>
      <div class="timeline">${items}</div>
    </article>
  `;
}

function renderTaskTable(tasks: unknown[]): string {
  if (!Array.isArray(tasks) || tasks.length === 0) return '';

  const rows = tasks
    .map((task) => {
      const record = asObject(task);
      const id = typeof record.id === 'string' ? record.id : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Untitled task';
      const done = record.done === true;
      return `<tr><td class="mono">${escapeHtml(id)}</td><td>${escapeHtml(title)}</td><td class="mono">${done ? 'done' : 'open'}</td></tr>`;
    })
    .join('');

  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>Tasks</h2>
      <div class="table-wrap">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th class="metric-label" style="text-align: left; padding-bottom: var(--space-2);">id</th>
              <th class="metric-label" style="text-align: left; padding-bottom: var(--space-2);">title</th>
              <th class="metric-label" style="text-align: left; padding-bottom: var(--space-2);">status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderStepsList(steps: unknown[]): string {
  if (!Array.isArray(steps) || steps.length === 0) return '';

  const list = steps
    .map((step) => {
      const record = asObject(step);
      const id = typeof record.id === 'string' ? record.id : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Untitled step';
      const detail = typeof record.detail === 'string' ? record.detail : '';
      return `
        <li style="margin-bottom: var(--space-3);">
          <div><strong class="mono">${escapeHtml(id)}</strong> · ${escapeHtml(title)}</div>
          ${detail ? `<div style="color: var(--text-2); margin-top: var(--space-1);">${escapeHtml(detail)}</div>` : ''}
        </li>
      `;
    })
    .join('');

  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>Plan steps</h2>
      <ol>${list}</ol>
    </article>
  `;
}

function renderGenericPage(contract: Record<string, unknown>): string {
  const sections = asObject(contract.sections);
  const sectionEntries = Object.entries(sections)
    .map(([name, value]) => renderSummaryBlock(name.replace(/_/g, ' '), getText(value)))
    .join('');

  const id = typeof contract.id === 'string' ? contract.id : 'unknown';
  const title = typeof contract.title === 'string' ? contract.title : id;
  const status = typeof contract.status === 'string' ? contract.status : 'draft';
  const type = typeof contract.type === 'string' ? contract.type : 'page';

  return renderPageShell({
    id,
    title,
    type,
    status,
    meta: [
      { label: 'kind', value: type },
      { label: 'status', value: status },
      { label: 'updated', value: typeof contract.updated === 'string' ? contract.updated : 'n/a' },
    ],
    content: sectionEntries,
  });
}

function themeToggleButton(): string {
  return `<button class="theme-toggle" type="button" data-theme-toggle data-iris-nav aria-label="Toggle color theme">theme</button>`;
}

function renderPageShell({
  id,
  title,
  type,
  status,
  meta,
  content,
}: {
  id: string;
  title: string;
  type: string;
  status: string;
  meta: Array<{ label: string; value: string }>;
  content: string;
}): string {
  const metaGrid = renderMetricGrid(meta);
  return `<!doctype html>
<html lang="en">
 <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <title>${escapeHtml(title)} · iris</title>
   <link rel="stylesheet" href="../../design/tokens.css" />
   <link rel="stylesheet" href="../../design/components/base.css" />
 </head>
 <body>
   <main class="page-shell">
     <header class="header">
       <div class="topbar">
         <nav class="crumbs"><a data-iris-nav href="../../index.html">&larr; dashboard</a></nav>
         ${themeToggleButton()}
       </div>
       <div class="header-bar">
         <div>
           <div class="type-chip" style="margin-bottom: var(--space-2);">${escapeHtml(type)}</div>
           <h1>${escapeHtml(title)}</h1>
         </div>
         <span class="status-chip ${statusClass(status)}">status: ${escapeHtml(status)}</span>
       </div>
       ${metaGrid}
     </header>
     ${content}
     <footer class="footer">rendered from ${escapeHtml(id)} · offline deterministic template</footer>
   </main>
   <script defer src="../../design/components/base.js"></script>
 </body>
</html>`;
}

export function renderContractPage(contract: Record<string, unknown>): string {
  const id = typeof contract.id === 'string' ? contract.id : 'unknown';
  const title = typeof contract.title === 'string' ? contract.title : id;
  const type = typeof contract.type === 'string' ? contract.type : 'page';
  const status = typeof contract.status === 'string' ? contract.status : 'draft';
  const sections = asObject(contract.sections);

  switch (type) {
    case 'report': {
      const summary = getStringList(sections.summary);
      const openItems = getText(sections.open_items);
      const promotable = getStringList(sections.promotable_as);
      const content = [
        summary.length > 0
          ? renderSummaryBlock('Summary', summary.map((item) => `- ${item}`).join('\n'))
          : '',
        openItems ? renderSummaryBlock('Open items', openItems) : '',
        promotable.length > 0
          ? renderSummaryBlock('Promotable as', promotable.map((item) => `- ${item}`).join('\n'))
          : '',
      ].join('');

      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'promotions', value: promotable.join(', ') || 'none' },
        ],
        content,
      });
    }
    case 'feature': {
      const problem = getText(sections.problem);
      const goal = getText(sections.goal);
      const tasks = Array.isArray(sections.tasks) ? sections.tasks : [];
      const content = [
        renderSummaryBlock('Problem', problem),
        renderSummaryBlock('Goal', goal),
        renderTaskTable(tasks),
      ].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          {
            label: 'tasks',
            value: String(Array.isArray(sections.tasks) ? sections.tasks.length : 0),
          },
        ],
        content,
      });
    }
    case 'bug': {
      const symptom = getText(sections.symptom);
      const severity = typeof sections.severity === 'string' ? sections.severity : 'p2';
      const timelineEvents = asObject(sections.timeline).events;
      const timeline = Array.isArray(timelineEvents) ? timelineEvents : [];
      const content = [renderSummaryBlock('Symptom', symptom), renderTimeline(timeline)].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'severity', value: severity },
        ],
        content,
      });
    }
    case 'idea': {
      const current = getText(sections.current_state);
      const proposed = getText(sections.proposed);
      const effortImpact = asObject(sections.effort_impact);
      const effort = typeof effortImpact.effort === 'number' ? String(effortImpact.effort) : 'n/a';
      const impact = typeof effortImpact.impact === 'number' ? String(effortImpact.impact) : 'n/a';
      const content = [
        renderSummaryBlock('Current state', current),
        renderSummaryBlock('Proposed', proposed),
        renderMetricGrid([
          { label: 'effort', value: effort },
          { label: 'impact', value: impact },
        ]),
      ].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'effort', value: effort },
          { label: 'impact', value: impact },
        ],
        content,
      });
    }
    case 'plan': {
      const goal = getText(sections.goal);
      const steps = Array.isArray(sections.steps) ? sections.steps : [];
      const content = [renderSummaryBlock('Goal', goal), renderStepsList(steps)].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'steps', value: String(steps.length) },
        ],
        content,
      });
    }
    default:
      return renderGenericPage(contract);
  }
}

// The aperture ring is the dashboard's signature: one arc per page, colored by
// its real status, so the ornament carries the same information as the list.
function apertureRing(pages: DashboardPage[]): string {
  const size = 84;
  const center = size / 2;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const shown = pages.slice(0, 24);

  const segments =
    shown.length === 0
      ? `<circle class="ring-empty" cx="${center}" cy="${center}" r="${radius}" />`
      : shown
          .map((page, index) => {
            const share = circumference / shown.length;
            const gap = shown.length === 1 ? 0 : Math.min(4, share * 0.18);
            const dash = Math.max(share - gap, 1).toFixed(2);
            const rest = (circumference - Number(dash)).toFixed(2);
            const angle = ((360 / shown.length) * index - 90).toFixed(2);
            return `<circle class="seg ${statusClass(page.status, page.stale)}" cx="${center}" cy="${center}" r="${radius}" stroke-dasharray="${dash} ${rest}" transform="rotate(${angle} ${center} ${center})"><title>${escapeHtml(page.title)} · ${escapeHtml(page.stale ? 'stale' : page.status)}</title></circle>`;
          })
          .join('');

  return `<svg class="aperture" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${shown.length} pages by status">
      ${segments}
      <text class="aperture-count" x="${center}" y="${center + 2}" text-anchor="middle" dominant-baseline="middle">${pages.length}</text>
      <text class="aperture-label" x="${center}" y="${center + 16}" text-anchor="middle">pages</text>
    </svg>`;
}

function dashboardCard(page: DashboardPage): string {
  const staleSuffix = page.stale ? ' · stale' : '';
  return `
    <a class="surface page-card" data-page-card href="${escapeHtml(page.href)}">
      <span class="type-chip">${escapeHtml(page.type)}</span>
      <span class="card-main">
        <span class="card-title">${escapeHtml(page.title)}</span>
        <span class="card-id">${escapeHtml(page.id)}</span>
      </span>
      <span class="status-chip ${statusClass(page.status, page.stale)}">${escapeHtml(page.status)}${staleSuffix}</span>
    </a>
  `;
}

function boardColumn(label: string, pages: DashboardPage[]): string {
  const cards =
    pages.length === 0
      ? '<p class="board-empty">Nothing here yet.</p>'
      : pages.map((page) => dashboardCard(page)).join('');
  return `<div class="board-col"><span class="eyebrow">${escapeHtml(label)}</span>${cards}</div>`;
}

function summaryLine(pages: DashboardPage[]): string {
  if (pages.length === 0) return 'no pages yet';
  const staleCount = pages.filter((page) => page.stale).length;
  const pageLabel = pages.length === 1 ? '1 page' : `${pages.length} pages`;
  return staleCount > 0 ? `${pageLabel} · ${staleCount} stale` : pageLabel;
}

export function dashboardHtml(
  projectName = 'iris project',
  pages: DashboardPage[] = [],
  projectDocs: string[] = [],
): string {
  const listCards =
    pages.length === 0
      ? `<article class="surface empty-state"><h2>No pages yet</h2><p>Create one with <code>iris bug my-first-bug</code>, then run <code>iris render --all</code>.</p></article>`
      : pages.map((page) => dashboardCard(page)).join('');

  const columns = [
    boardColumn(
      'Draft',
      pages.filter((page) => page.status === 'draft'),
    ),
    boardColumn(
      'Active',
      pages.filter((page) => !['draft', 'done', 'archived'].includes(page.status)),
    ),
    boardColumn(
      'Done',
      pages.filter((page) => page.status === 'done'),
    ),
    boardColumn(
      'Archived',
      pages.filter((page) => page.status === 'archived'),
    ),
  ].join('');

  const projectStrip =
    projectDocs.length === 0
      ? ''
      : `<section class="surface project-strip">
        <span class="eyebrow">project docs</span>
        <nav class="project-links">
          ${projectDocs
            .map((name) => `<a href="./project/${escapeHtml(name)}.html">${escapeHtml(name)}</a>`)
            .join('\n          ')}
        </nav>
      </section>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(projectName)} · iris dashboard</title>
    <link rel="stylesheet" href="./design/tokens.css" />
    <link rel="stylesheet" href="./design/components/base.css" />
  </head>
  <body>
    <main class="page-shell">
      <header class="header">
        <div class="topbar">
          <span class="eyebrow">iris · visual versioned docs</span>
          ${themeToggleButton()}
        </div>
        <div class="hero surface">
          ${apertureRing(pages)}
          <div class="hero-copy">
            <h1>${escapeHtml(projectName)}</h1>
            <p class="hero-line">${escapeHtml(summaryLine(pages))}</p>
          </div>
        </div>
      </header>

      <section class="surface toolbar">
        <div class="tabs" role="tablist" aria-label="dashboard view" data-tabs="dashboard-view">
          <button role="tab" class="tab-button" aria-selected="true" data-view="list" data-tab-id="list">List</button>
          <button role="tab" class="tab-button" aria-selected="false" data-view="board" data-tab-id="board">Board</button>
        </div>
        <input class="filter-input" type="search" data-filter-input placeholder="Filter pages…" aria-label="Filter pages" />
      </section>

      <section class="list" data-dashboard-list>
        ${listCards}
      </section>

      <section class="board" data-dashboard-board hidden>
        ${columns}
      </section>
      ${projectStrip}
      <footer class="footer">generated by iris · works offline from file://</footer>
    </main>
    <script defer src="./design/components/base.js"></script>
  </body>
</html>`;
}

export function projectPlaceholderHtml(name: string): string {
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return `<!doctype html>
<html lang="en" data-iris-managed>
 <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <title>${escapeHtml(title)} · iris</title>
   <link rel="stylesheet" href="../design/tokens.css" />
   <link rel="stylesheet" href="../design/components/base.css" />
 </head>
 <body>
   <main class="page-shell">
     <header class="header">
       <div class="topbar">
         <nav class="crumbs"><a data-iris-nav href="../index.html">&larr; dashboard</a></nav>
         ${themeToggleButton()}
       </div>
       <div class="header-bar">
         <div>
           <div class="type-chip" style="margin-bottom: var(--space-2);">project doc</div>
           <h1>${escapeHtml(title)}</h1>
         </div>
         <span class="status-chip st-draft">status: pending</span>
       </div>
     </header>
     <article class="surface empty-state">
       <h2>This page is not generated yet</h2>
       <p>The ${escapeHtml(name)} document fills in as later iris milestones land. Rendered pages live on the <a href="../index.html">dashboard</a>.</p>
     </article>
     <footer class="footer">managed by iris · regenerated by iris update</footer>
   </main>
   <script defer src="../design/components/base.js"></script>
 </body>
</html>
`;
}
