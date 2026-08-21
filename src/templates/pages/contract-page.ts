import { renderSafeMarkdown } from '../../lib/markdown.js';
import {
  apertureGlyph,
  escapeHtml,
  projectDocMeta,
  statusChip,
  typeChip,
  PROJECT_DOC_NAMES,
} from '../common.js';
import { renderShell, type NavCounts } from '../shell.js';

export type WorkspaceContext = {
  projectName: string;
  theme: string;
  counts: NavCounts;
  projectDocs: readonly string[];
};

export const DEFAULT_WORKSPACE_CONTEXT: WorkspaceContext = {
  projectName: 'iris project',
  theme: 'dark',
  counts: {},
  projectDocs: [],
};

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

function markdownToHtml(value: string): string {
  return value.trim() === '' ? '<p>Empty.</p>' : renderSafeMarkdown(value);
}

function renderMetricGrid(entries: Array<{ label: string; value: string }>): string {
  if (entries.length === 0) return '';
  const cards = entries
    .map(
      (entry) =>
        `<article class="surface metric-card"><div class="metric-label">${escapeHtml(entry.label)}</div><div class="metric-value">${escapeHtml(entry.value)}</div></article>`,
    )
    .join('');
  return `<section class="metric-grid">${cards}</section>`;
}

function renderSummaryBlock(title: string, text: string): string {
  if (!text.trim()) return '';
  return `<article class="surface doc-body"><h2>${escapeHtml(title)}</h2>${markdownToHtml(text)}</article>`;
}

function renderTimeline(events: unknown[]): string {
  if (!Array.isArray(events) || events.length === 0) return '';
  const items = events
    .map((event) => {
      const record = asObject(event);
      const time = typeof record.t === 'string' ? record.t : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Event';
      const level = typeof record.level === 'string' ? record.level : 'info';
      return `<div class="timeline-item ${escapeHtml(level)}" style="position: relative;">
          <strong class="mono">${escapeHtml(time)}</strong> <span class="pill">${escapeHtml(level)}</span>
          <div>${escapeHtml(title)}</div>
        </div>`;
    })
    .join('');
  return `<article class="surface doc-body"><h2>Timeline</h2><div class="timeline">${items}</div></article>`;
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
  return `<article class="surface doc-body">
      <h2>Tasks</h2>
      <div class="table-wrap">
        <table class="work-table">
          <thead><tr><th scope="col">id</th><th scope="col">title</th><th scope="col">status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>`;
}

function renderStepsList(steps: unknown[]): string {
  if (!Array.isArray(steps) || steps.length === 0) return '';
  const list = steps
    .map((step) => {
      const record = asObject(step);
      const id = typeof record.id === 'string' ? record.id : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Untitled step';
      const detail = typeof record.detail === 'string' ? record.detail : '';
      return `<li><div><strong class="mono">${escapeHtml(id)}</strong> · ${escapeHtml(title)}</div>${detail ? `<div class="work-meta">${escapeHtml(detail)}</div>` : ''}</li>`;
    })
    .join('');
  return `<article class="surface doc-body"><h2>Plan steps</h2><ol>${list}</ol></article>`;
}

function pageShell({
  id,
  title,
  type,
  status,
  meta,
  content,
  context,
}: {
  id: string;
  title: string;
  type: string;
  status: string;
  meta: Array<{ label: string; value: string }>;
  content: string;
  context: WorkspaceContext;
}): string {
  const head = `<div class="page-head">
      <div>
        <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1)">
          ${apertureGlyph(type)}
          ${typeChip(type)}
          ${statusChip(status)}
        </div>
        <h1>${escapeHtml(title)}</h1>
      </div>
    </div>
    ${renderMetricGrid(meta)}
    ${content}`;

  return renderShell({
    current: 'work',
    depth: 2,
    title,
    projectName: context.projectName,
    theme: context.theme,
    counts: context.counts,
    projectDocs: context.projectDocs,
    crumbs: [
      { label: 'iris', href: '../../index.html' },
      { label: 'Work', href: '../../work.html' },
      { label: id },
    ],
    content: head,
    mermaid: true,
    footerHints: `rendered from ${escapeHtml(id)} · <kbd>t</kbd> theme · <kbd>b</kbd> sidebar`,
  });
}

function renderGenericPage(contract: Record<string, unknown>, context: WorkspaceContext): string {
  const sections = asObject(contract.sections);
  const sectionEntries = Object.entries(sections)
    .map(([name, value]) => renderSummaryBlock(name.replace(/_/g, ' '), getText(value)))
    .join('');

  const id = typeof contract.id === 'string' ? contract.id : 'unknown';
  const title = typeof contract.title === 'string' ? contract.title : id;
  const status = typeof contract.status === 'string' ? contract.status : 'draft';
  const type = typeof contract.type === 'string' ? contract.type : 'page';

  return pageShell({
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
    context,
  });
}

export function renderContractPage(
  contract: Record<string, unknown>,
  context: WorkspaceContext = DEFAULT_WORKSPACE_CONTEXT,
): string {
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

      return pageShell({
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
        context,
      });
    }
    case 'feature': {
      const content = [
        renderSummaryBlock('Problem', getText(sections.problem)),
        renderSummaryBlock('Goal', getText(sections.goal)),
        renderTaskTable(Array.isArray(sections.tasks) ? sections.tasks : []),
      ].join('');
      return pageShell({
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
        context,
      });
    }
    case 'bug': {
      const severity = typeof sections.severity === 'string' ? sections.severity : 'p2';
      const timelineEvents = asObject(sections.timeline).events;
      const content = [
        renderSummaryBlock('Symptom', getText(sections.symptom)),
        renderTimeline(Array.isArray(timelineEvents) ? timelineEvents : []),
      ].join('');
      return pageShell({
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
        context,
      });
    }
    case 'idea': {
      const effortImpact = asObject(sections.effort_impact);
      const effort = typeof effortImpact.effort === 'number' ? String(effortImpact.effort) : 'n/a';
      const impact = typeof effortImpact.impact === 'number' ? String(effortImpact.impact) : 'n/a';
      const content = [
        renderSummaryBlock('Current state', getText(sections.current_state)),
        renderSummaryBlock('Proposed', getText(sections.proposed)),
      ].join('');
      return pageShell({
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
        context,
      });
    }
    case 'plan': {
      const steps = Array.isArray(sections.steps) ? sections.steps : [];
      const content = [
        renderSummaryBlock('Goal', getText(sections.goal)),
        renderStepsList(steps),
      ].join('');
      return pageShell({
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
        context,
      });
    }
    default:
      return renderGenericPage(contract, context);
  }
}

export function projectPlaceholderHtml(
  name: string,
  context: WorkspaceContext = DEFAULT_WORKSPACE_CONTEXT,
): string {
  const meta = projectDocMeta(name);
  const siblings = context.projectDocs.filter((doc) => doc !== name);
  const content = `<div class="page-head">
      <div>
        <span class="eyebrow">project doc</span>
        <h1>${escapeHtml(meta.label)}</h1>
        <p>${escapeHtml(meta.purpose)}</p>
      </div>
      <div class="page-head-actions"><span class="status-chip st-draft">not written yet</span></div>
    </div>

    <div class="grid-2">
      <section class="surface card">
        <div class="card-head"><div><span class="eyebrow">what belongs here</span><h2>Contents</h2></div></div>
        <div class="card-body card-body-pad">
          <ul class="doc-checklist">
            ${meta.contains.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </section>
      <section class="surface card">
        <div class="card-head"><div><span class="eyebrow">how to fill it</span><h2>Next step</h2></div></div>
        <div class="card-body card-body-pad">
          <p>Write this page with the installed Iris skill, then refresh the workspace:</p>
          <pre class="command-usage"><code>iris render --all</code></pre>
          <p class="work-meta">Iris manages this placeholder. Replace it with real content and the next
          refresh will preserve your file instead of overwriting it.</p>
        </div>
      </section>
    </div>

    ${
      siblings.length === 0
        ? ''
        : `<section class="surface project-strip">
        <span class="eyebrow">other project docs</span>
        <nav class="project-links" aria-label="Other project documents">
          ${siblings.map((doc) => `<a href="./${escapeHtml(doc)}.html">${escapeHtml(projectDocMeta(doc).label)}</a>`).join('')}
        </nav>
      </section>`
    }`;

  return renderShell({
    current: `project:${name}`,
    depth: 1,
    title: meta.label,
    projectName: context.projectName,
    theme: context.theme,
    counts: context.counts,
    projectDocs: context.projectDocs,
    crumbs: [
      { label: 'iris', href: '../index.html' },
      { label: 'project docs' },
      { label: meta.label },
    ],
    content,
    footerHints: 'managed by iris · regenerated by iris init or iris update',
  }).replace('<html lang="en"', '<html lang="en" data-iris-managed');
}

export { PROJECT_DOC_NAMES };
