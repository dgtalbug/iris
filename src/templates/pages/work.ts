import {
  recordIcon,
  escapeHtml,
  priorityChip,
  statTile,
  statusChip,
  typeChip,
  type DashboardPage,
} from '../common.js';

export function workItemAttributes(page: DashboardPage): string {
  const search = [
    page.id,
    page.type,
    page.title,
    page.status,
    page.priority,
    page.updated,
    page.agent,
    ...page.tags,
  ].join(' ');
  return [
    'data-work-item',
    `data-work-id="${escapeHtml(page.id)}"`,
    `data-work-type="${escapeHtml(page.type)}"`,
    `data-work-title="${escapeHtml(page.title)}"`,
    `data-work-status="${escapeHtml(page.status)}"`,
    `data-work-priority="${escapeHtml(page.priority)}"`,
    `data-work-updated="${escapeHtml(page.updated)}"`,
    `data-work-agent="${escapeHtml(page.agent)}"`,
    `data-work-tags="${escapeHtml(page.tags.join(', '))}"`,
    `data-work-description="${escapeHtml(page.description)}"`,
    `data-work-evidence="${escapeHtml(page.evidence)}"`,
    `data-work-href="${escapeHtml(page.href)}"`,
    `data-work-search="${escapeHtml(search)}"`,
  ].join(' ');
}

/**
 * `compact` is for rows summarised inside a card, which have roughly a third of
 * the Work page's width; they carry identity and status only.
 */
export function workListItem(page: DashboardPage, options: { compact?: boolean } = {}): string {
  const detail = options.compact
    ? ''
    : `${priorityChip(page.priority)}
      <span class="work-meta work-updated">${escapeHtml(page.updated)}</span>
      <span class="work-meta work-agent">${escapeHtml(page.agent)}</span>`;
  return `<article class="work-list-row${options.compact ? ' compact' : ''}" ${workItemAttributes(page)} data-work-list-item>
    <a class="work-row" data-work-open href="${escapeHtml(page.href)}">
      ${recordIcon(page.type)}
      <span class="work-row-primary"><span class="work-row-title">${escapeHtml(page.title)}</span><span class="work-row-id">${escapeHtml(page.id)} · ${escapeHtml(page.type)}</span></span>
      ${statusChip(page.status)}
      ${detail}
    </a>
  </article>`;
}

function workTableRow(page: DashboardPage): string {
  return `<tr ${workItemAttributes(page)} data-work-row>
    <td class="col-type">${typeChip(page.type)}</td>
    <td class="mono">${escapeHtml(page.id)}</td>
    <td class="work-title-cell"><a class="work-table-title" data-work-open href="${escapeHtml(page.href)}">${escapeHtml(page.title)}</a></td>
    <td>${statusChip(page.status)}</td>
    <td class="col-priority">${priorityChip(page.priority)}</td>
    <td class="col-updated mono">${escapeHtml(page.updated)}</td>
    <td class="col-agent mono">${escapeHtml(page.agent)}</td>
  </tr>`;
}

function kanbanCard(page: DashboardPage): string {
  return `<a class="kanban-card" ${workItemAttributes(page)} data-work-open href="${escapeHtml(page.href)}">
    <span class="kanban-card-head"><span class="mono">${escapeHtml(page.id)}</span>${typeChip(page.type)}</span>
    <span class="kanban-card-title">${escapeHtml(page.title)}</span>
    <span class="kanban-card-foot">${priorityChip(page.priority)}<span class="work-meta">${escapeHtml(page.updated)}</span></span>
  </a>`;
}

function kanbanColumn(label: string, pages: DashboardPage[]): string {
  const cards =
    pages.length === 0
      ? '<p class="kanban-empty">No items</p>'
      : pages.map((page) => kanbanCard(page)).join('');
  return `<section class="kanban-col" aria-label="${escapeHtml(label)} work"><header class="kanban-col-header"><span class="eyebrow">${escapeHtml(label)}</span><span class="badge b-muted">${pages.length}</span></header>${cards}</section>`;
}

export function workStatusCounts(pages: DashboardPage[]): {
  total: number;
  draft: number;
  active: number;
  done: number;
  archived: number;
} {
  return {
    total: pages.length,
    draft: pages.filter((page) => page.status === 'draft').length,
    active: pages.filter((page) => !['draft', 'done', 'archived'].includes(page.status)).length,
    done: pages.filter((page) => page.status === 'done').length,
    archived: pages.filter((page) => page.status === 'archived').length,
  };
}

export function workFilterInput(): string {
  return `<label class="filter-wrap"><span class="visually-hidden">Filter work</span><input class="filter-input" type="search" data-filter-input placeholder="Filter work…" aria-label="Filter work" /></label>`;
}

export function workPageContent(pages: DashboardPage[]): string {
  const counts = workStatusCounts(pages);
  const listItems =
    pages.length === 0
      ? `<article class="empty-state"><h2>No work recorded yet</h2><p>Create one with <code>iris bug my-first-bug</code> or <code>iris research my-question</code>, then run <code>iris render --all</code>.</p></article>`
      : pages.map((page) => workListItem(page)).join('');

  const columns = [
    kanbanColumn(
      'Draft',
      pages.filter((page) => page.status === 'draft'),
    ),
    kanbanColumn(
      'Active',
      pages.filter((page) => !['draft', 'done', 'archived'].includes(page.status)),
    ),
    kanbanColumn(
      'Done',
      pages.filter((page) => page.status === 'done'),
    ),
    kanbanColumn(
      'Archived',
      pages.filter((page) => page.status === 'archived'),
    ),
  ].join('');

  return `<div class="page-head">
      <div>
        <span class="eyebrow">current movement</span>
        <h1>Work</h1>
        <p>Every contract and research page in one browser. The filter applies to List, Table, and Kanban; opening an item keeps you on this page.</p>
      </div>
    </div>

    <section class="strip" aria-label="work summary">
      ${statTile({ value: counts.total, label: 'total' })}
      ${statTile({ value: counts.active, label: 'active' })}
      ${statTile({ value: counts.done, label: 'done' })}
      ${statTile({ value: counts.draft, label: 'draft' })}
      ${statTile({ value: counts.archived, label: 'archived' })}
    </section>

    <section class="work-surface" id="work" aria-labelledby="work-title">
      <h2 class="visually-hidden" id="work-title">Work items</h2>
      <div class="card toolbar tabs">
        <div class="tablist" role="tablist" aria-label="work layout" data-tabs="work-layout">
          <button id="work-layout-tab-list" role="tab" class="tab" aria-controls="work-layout-panel-list" aria-selected="true" tabindex="0" data-tab-id="list">List</button>
          <button id="work-layout-tab-table" role="tab" class="tab" aria-controls="work-layout-panel-table" aria-selected="false" tabindex="-1" data-tab-id="table">Table</button>
          <button id="work-layout-tab-kanban" role="tab" class="tab" aria-controls="work-layout-panel-kanban" aria-selected="false" tabindex="-1" data-tab-id="kanban">Kanban</button>
        </div>
        <span class="work-result-count mono" data-work-result-count>${pages.length} ${pages.length === 1 ? 'item' : 'items'}</span>
      </div>

      <section id="work-layout-panel-list" class="card list" role="tabpanel" aria-labelledby="work-layout-tab-list" data-tab-group="work-layout" data-tab-id="list" data-dashboard-list>
        ${listItems}
      </section>

      <section id="work-layout-panel-table" class="card work-table-wrap" role="tabpanel" aria-labelledby="work-layout-tab-table" data-tab-group="work-layout" data-tab-id="table" data-dashboard-table hidden>
        <table class="work-table">
          <thead><tr><th class="col-type" scope="col">Type</th><th scope="col">ID</th><th scope="col">Title</th><th scope="col">Status</th><th class="col-priority" scope="col">Priority</th><th class="col-updated" scope="col">Updated</th><th class="col-agent" scope="col">Agent</th></tr></thead>
          <tbody>${pages.map((page) => workTableRow(page)).join('')}</tbody>
        </table>
        ${pages.length === 0 ? '<div class="empty-state">No items to show.</div>' : ''}
      </section>

      <section id="work-layout-panel-kanban" class="kanban" role="tabpanel" aria-labelledby="work-layout-tab-kanban" data-tab-group="work-layout" data-tab-id="kanban" data-dashboard-kanban hidden>
        ${columns}
      </section>
    </section>`;
}
