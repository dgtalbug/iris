import { renderSafeMarkdown } from '../../lib/markdown.js';
import {
  PROJECT_DOC_NAMES,
  escapeHtml,
  healthBadgeClass,
  recordIcon,
  statusChip,
  tabGroup,
  typeChip,
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
        `<article class="card stat"><div class="label">${escapeHtml(entry.label)}</div><div class="value">${escapeHtml(entry.value)}</div></article>`,
    )
    .join('');
  return `<section class="strip">${cards}</section>`;
}

function renderSummaryBlock(title: string, text: string): string {
  if (!text.trim()) return '';
  return `<article class="card doc-body"><h2>${escapeHtml(title)}</h2>${markdownToHtml(text)}</article>`;
}

function renderTimeline(events: unknown[]): string {
  if (!Array.isArray(events) || events.length === 0) return '';
  const items = events
    .map((event) => {
      const record = asObject(event);
      const time = typeof record.t === 'string' ? record.t : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Event';
      const level = typeof record.level === 'string' ? record.level : 'info';
      const tone =
        {
          warn: ' class="warn"',
          warning: ' class="warn"',
          error: ' class="danger"',
          danger: ' class="danger"',
        }[level] ?? '';
      return `<li${tone}>
          <span class="when">${escapeHtml(time)}</span> <span class="badge ${healthBadgeClass(level)}">${escapeHtml(level)}</span>
          <div class="what">${escapeHtml(title)}</div>
        </li>`;
    })
    .join('');
  return `<article class="card doc-body"><h2>Timeline</h2><ul class="timeline">${items}</ul></article>`;
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
  return `<article class="card doc-body">
      <h2>Tasks</h2>
      <div class="work-table-wrap">
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
  return `<article class="card doc-body"><h2>Plan steps</h2><ol>${list}</ol></article>`;
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
          ${recordIcon(type)}
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
      const design = asObject(sections.design);
      const hld = getText(design.hld);
      const lld = getText(design.lld);
      const overview = [
        renderSummaryBlock('Problem', getText(sections.problem)),
        renderSummaryBlock('Goal', getText(sections.goal)),
      ].join('');
      const tasksHtml = renderTaskTable(Array.isArray(sections.tasks) ? sections.tasks : []);
      const content =
        hld.trim() === '' && lld.trim() === ''
          ? overview + tasksHtml
          : tabGroup(`feature-${id}`, 'feature sections', [
              { id: 'overview', label: 'Overview', html: overview },
              { id: 'hld', label: 'HLD', html: renderSummaryBlock('HLD', hld) },
              { id: 'lld', label: 'LLD', html: renderSummaryBlock('LLD', lld) },
              { id: 'tasks', label: 'Tasks', html: tasksHtml },
            ]);
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

export { PROJECT_DOC_NAMES };
