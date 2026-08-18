export const TOKENS_CSS = `:root {
  --bg: hsl(220 28% 10%);
  --surface-1: hsl(220 24% 14%);
  --surface-2: hsl(220 22% 18%);
  --surface-3: hsl(220 20% 24%);
  --text-1: hsl(210 24% 96%);
  --text-2: hsl(214 16% 78%);
  --text-3: hsl(214 12% 62%);
  --accent: hsl(198 90% 57%);
  --ok: hsl(146 63% 46%);
  --warn: hsl(42 96% 56%);
  --danger: hsl(356 83% 62%);
  --info: hsl(204 89% 62%);
  --chart-1: hsl(198 90% 57%);
  --chart-2: hsl(276 70% 63%);
  --chart-3: hsl(146 63% 46%);
  --chart-4: hsl(42 96% 56%);
  --chart-5: hsl(12 83% 65%);
  --chart-6: hsl(324 75% 62%);
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  --size-1: 0.75rem;
  --size-2: 0.875rem;
  --size-3: 1rem;
  --size-4: 1.25rem;
  --size-5: 1.5rem;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --radius-1: 0.375rem;
  --radius-2: 0.5rem;
  --radius-3: 0.75rem;
  --border-1: 1px solid hsl(214 16% 32%);
  --elevation-1: 0 0.25rem 0.75rem hsl(220 50% 3% / 0.25);
  --duration-1: 120ms;
  --duration-2: 220ms;
  --duration-3: 320ms;
  --easing: cubic-bezier(0.22, 0.61, 0.36, 1);
}

[data-theme='light'] {
  --bg: hsl(210 20% 98%);
  --surface-1: hsl(0 0% 100%);
  --surface-2: hsl(210 22% 95%);
  --surface-3: hsl(210 18% 90%);
  --text-1: hsl(220 28% 12%);
  --text-2: hsl(220 16% 26%);
  --text-3: hsl(220 10% 42%);
  --border-1: 1px solid hsl(210 12% 80%);
  --elevation-1: 0 0.25rem 0.75rem hsl(220 26% 70% / 0.3);
}

body {
  margin: 0;
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text-1);
}
`;

export const BASE_COMPONENTS_CSS = `
.page-shell { max-width: 75rem; margin: 0 auto; padding: var(--space-5); }
.surface { background: var(--surface-1); border: var(--border-1); border-radius: var(--radius-2); box-shadow: var(--elevation-1); }
.header { display: grid; gap: var(--space-3); margin-bottom: var(--space-5); }
.header-bar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.type-chip { display: inline-flex; align-items: center; padding: var(--space-1) var(--space-2); border-radius: 999px; background: var(--surface-2); }
.status-chip { color: var(--text-2); }
.footer { margin-top: var(--space-6); color: var(--text-3); font-size: var(--size-2); }
.tabs { display: flex; gap: var(--space-2); }
.tab-button { background: var(--surface-2); border: var(--border-1); color: var(--text-2); border-radius: var(--radius-1); padding: var(--space-2) var(--space-3); cursor: pointer; }
.tab-button[aria-selected='true'] { color: var(--text-1); background: var(--surface-3); }
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
.table-wrap { overflow: auto; }
.chart-wrap, .mermaid-wrap, .flow-wrap { min-height: 16rem; padding: var(--space-4); }
.dashboard-canvas { width: 100%; height: 8rem; display: block; border-radius: var(--radius-2); background: var(--surface-2); }
.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: var(--space-3); }
.list { display: grid; gap: var(--space-3); }
@keyframes timeline-in { to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .timeline-item { animation: none; opacity: 1; transform: none; }
}
`;

export const BASE_COMPONENTS_JS = `
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

function drawSignature() {
  const canvas = document.querySelector('[data-signature-canvas]');
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  const nodes = Array.from({ length: 60 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
  }));

  const frame = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'hsl(198 90% 57% / 0.9)';
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x <= 0 || n.x >= width) n.vx *= -1;
      if (n.y <= 0 || n.y >= height) n.vy *= -1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 48) {
          ctx.strokeStyle = 'hsl(198 90% 57% / 0.2)';
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  };

  if (isReducedMotion) {
    frame();
    return;
  }

  let ticking = true;
  const onVisibility = () => {
    ticking = !document.hidden;
    if (ticking) requestAnimationFrame(loop);
  };
  document.addEventListener('visibilitychange', onVisibility, { passive: true });

  function loop() {
    if (!ticking) return;
    frame();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
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

async function setupMermaid() {
  const blocks = document.querySelectorAll('[data-mermaid-source]');
  if (blocks.length === 0) return;
  const mermaidModule = await import('https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs');
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
  const shiki = await import('https://cdn.jsdelivr.net/npm/shiki@3.12.2/dist/index.mjs');
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
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js';
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
drawSignature();
setupMermaid();
setupCodeCards();
setupCharts();
`;

export type DashboardPage = {
 id: string;
 type: string;
 title: string;
 status: string;
};

function escapeHtml(value: string): string {
 return value
   .replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&#039;');
}

function asObject(value: unknown): Record<string, unknown> {
 return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getText(value: unknown): string {
 if (typeof value === 'string') return value;
 if (value && typeof value === 'object' && 'md' in value && typeof value.md === 'string') return value.md;
 return '';
}

function getStringList(value: unknown): string[] {
 if (!Array.isArray(value)) return [];
 return value.filter((item): item is string => typeof item === 'string');
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
         .map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s*/, ''))}</li>`)
         .join('');
       return `<ul>${items}</ul>`;
     }

     return `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`;
   })
   .join('');
}

function renderMetricGrid(entries: Array<{ label: string; value: string }>): string {
 if (entries.length === 0) return '';

 const cards = entries
   .map(
     (entry) => `
       <article class="surface metric-card">
         <div style="font-size: var(--size-2); color: var(--text-3); text-transform: uppercase; letter-spacing: 0.08em;">${escapeHtml(entry.label)}</div>
         <div style="margin-top: var(--space-2); font-size: var(--size-4); font-weight: var(--weight-bold);">${escapeHtml(entry.value)}</div>
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
         <strong>${escapeHtml(time)}</strong>
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
     return `<tr><td>${escapeHtml(id)}</td><td>${escapeHtml(title)}</td><td>${done ? 'done' : 'open'}</td></tr>`;
   })
   .join('');

 return `
   <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
     <h2>Tasks</h2>
     <div class="table-wrap">
       <table style="width: 100%; border-collapse: collapse;">
         <thead>
           <tr>
             <th style="text-align: left; color: var(--text-3); padding-bottom: var(--space-2);">id</th>
             <th style="text-align: left; color: var(--text-3); padding-bottom: var(--space-2);">title</th>
             <th style="text-align: left; color: var(--text-3); padding-bottom: var(--space-2);">status</th>
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
         <div><strong>${escapeHtml(id)}</strong> · ${escapeHtml(title)}</div>
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
       <div class="header-bar">
         <div>
           <div class="type-chip" style="margin-bottom: var(--space-2);">${escapeHtml(type)}</div>
           <h1>${escapeHtml(title)}</h1>
         </div>
         <span class="status-chip">status: ${escapeHtml(status)}</span>
       </div>
       ${metaGrid}
     </header>
     ${content}
     <footer class="footer">rendered from ${escapeHtml(id)} · offline deterministic template</footer>
   </main>
   <script type="module" src="../../design/components/base.js"></script>
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
       summary.length > 0 ? renderSummaryBlock('Summary', summary.map((item) => `- ${item}`).join('\n')) : '',
       openItems ? renderSummaryBlock('Open items', openItems) : '',
       promotable.length > 0 ? renderSummaryBlock('Promotable as', promotable.map((item) => `- ${item}`).join('\n')) : '',
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
     const content = [renderSummaryBlock('Problem', problem), renderSummaryBlock('Goal', goal), renderTaskTable(tasks)].join('');
     return renderPageShell({
       id,
       title,
       type,
       status,
       meta: [
         { label: 'kind', value: type },
         { label: 'status', value: status },
         { label: 'tasks', value: String(Array.isArray(sections.tasks) ? sections.tasks.length : 0) },
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
     const content = [renderSummaryBlock('Current state', current), renderSummaryBlock('Proposed', proposed), renderMetricGrid([{ label: 'effort', value: effort }, { label: 'impact', value: impact }])].join('');
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

export function dashboardHtml(projectName = 'iris project', pages: DashboardPage[] = []): string {
 const cards =
   pages.length === 0
     ? '<article class="surface" style="padding: var(--space-4);"><h2>Page feed</h2><p style="color: var(--text-2);">No pages rendered yet.</p></article>'
     : pages
         .map(
           (page) => `
             <article class="surface" style="padding: var(--space-4);">
               <div class="type-chip" style="margin-bottom: var(--space-2);">${escapeHtml(page.type)}</div>
               <h2>${escapeHtml(page.title)}</h2>
               <p style="color: var(--text-2); margin: 0;">id: ${escapeHtml(page.id)}</p>
               <p style="color: var(--text-2); margin: var(--space-2) 0 0;">status: ${escapeHtml(page.status)}</p>
             </article>
           `,
         )
         .join('');

 return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName} · iris dashboard</title>
    <link rel="stylesheet" href="./design/tokens.css" />
    <link rel="stylesheet" href="./design/components/base.css" />
  </head>
  <body>
    <main class="page-shell">
      <header class="header">
        <div class="header-bar">
          <h1>${projectName}</h1>
          <span class="status-chip">sync: not yet synced</span>
        </div>
        <canvas class="dashboard-canvas" data-signature-canvas aria-label="signature field"></canvas>
      </header>
 
      <section class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
        <div class="tabs" role="tablist" aria-label="dashboard view" data-tabs="dashboard-view">
          <button role="tab" class="tab-button" aria-selected="true" data-view="list" data-tab-id="list">LIST</button>
          <button role="tab" class="tab-button" aria-selected="false" data-view="board" data-tab-id="board">BOARD</button>
        </div>
      </section>
 
      <section class="list" data-dashboard-list>
        ${cards}
      </section>
 
      <section class="board" data-dashboard-board hidden>
        <article class="surface" style="padding: var(--space-4);"><h2>Proposed</h2><p>Empty.</p></article>
        <article class="surface" style="padding: var(--space-4);"><h2>Active</h2><p>Empty.</p></article>
        <article class="surface" style="padding: var(--space-4);"><h2>Archived</h2><p>Empty.</p></article>
      </section>
 
      <footer class="footer">Rendered for file:// use · stale state: fresh</footer>
    </main>
    <script type="module" src="./design/components/base.js"></script>
  </body>
</html>`;
}
