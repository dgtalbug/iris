import type { GlobalDashboardModel, GlobalProjectEntry } from '../../lib/global-registry.js';
import { escapeHtml, healthBadgeClass, statTile, typeChip } from '../common.js';
import { icon } from '../icons.js';
import { renderShell } from '../shell.js';

function formatLastSeen(iso: string): string {
  const date = iso.slice(0, 10);
  return date || 'unknown';
}

function indexStatusRow(project: GlobalProjectEntry): string {
  const status = project.indexStatus;
  if (!status.present) return '';

  if (!status.enabled) {
    return `<p class="work-meta project-index-line">Code index disabled</p>`;
  }

  const symbolLabel = status.symbols === null ? '—' : String(status.symbols);
  const flowLabel = status.flows === null ? '—' : String(status.flows);
  const staleness = status.staleness
    ? `<span class="badge ${healthBadgeClass(status.staleness === 'up to date' ? 'enabled' : status.staleness.startsWith('stale') ? 'warning' : 'unknown')}">${escapeHtml(status.staleness)}</span>`
    : '';

  return `<div class="project-index-line">
      <p class="work-meta"><b>${escapeHtml(symbolLabel)}</b> symbols · <b>${escapeHtml(flowLabel)}</b> flows</p>
      ${staleness}
    </div>`;
}

function recentActivityList(project: GlobalProjectEntry): string {
  if (project.recentActivity.length === 0) {
    return '<p class="work-meta">No recorded pages yet.</p>';
  }
  return `<ul class="project-activity-list">
      ${project.recentActivity
        .map(
          (item) =>
            `<li>${typeChip(item.type)} <span>${escapeHtml(item.title)}</span> <span class="mono">${escapeHtml(item.id)}</span></li>`,
        )
        .join('')}
    </ul>`;
}

function projectCard(project: GlobalProjectEntry): string {
  const staleBadge = project.stale
    ? `<span class="badge b-warning">stale — root missing</span>`
    : '';
  const remote = project.remote
    ? `<span class="mono">${escapeHtml(project.remote)}</span>`
    : '<span class="work-meta">local checkout</span>';
  const dashboardLink = project.stale
    ? '<span class="work-meta">dashboard unavailable</span>'
    : `<a href="${escapeHtml(project.dashboardHref)}">Open project dashboard &rarr;</a>`;

  return `<article class="card project-card" aria-labelledby="project-${escapeHtml(project.id)}">
    <div class="card-head">
      <div>
        <span class="eyebrow">${escapeHtml(project.id)}</span>
        <h2 id="project-${escapeHtml(project.id)}">${escapeHtml(project.name)}</h2>
      </div>
      ${staleBadge}
    </div>
    <div class="card-body">
      <dl class="project-meta">
        <div><dt>Root</dt><dd class="mono">${escapeHtml(project.root)}</dd></div>
        <div><dt>Remote</dt><dd>${remote}</dd></div>
        <div><dt>Last seen</dt><dd>${escapeHtml(formatLastSeen(project.lastSeen))}</dd></div>
      </dl>
      <div class="strip project-stats" aria-label="${escapeHtml(project.name)} summary">
        ${statTile({
          value: project.pageCounts.total,
          label: 'pages',
          sub: `${project.pageCounts.active} active · ${project.pageCounts.archived} archived`,
        })}
      </div>
      ${indexStatusRow(project)}
      <section class="project-recent" aria-label="Recent activity for ${escapeHtml(project.name)}">
        <span class="eyebrow">recent activity</span>
        ${recentActivityList(project)}
      </section>
      <div class="project-actions">${dashboardLink}</div>
    </div>
  </article>`;
}

export function globalDashboardContent(model: GlobalDashboardModel): string {
  const projectCards =
    model.projects.length === 0
      ? `<section class="empty-state"><h2>No registered projects</h2><p>Run <code>iris init</code> in a repository to register it, then <code>iris render --all</code> when more than one project is present.</p></section>`
      : model.projects.map(projectCard).join('\n');

  return `<section class="card hero" aria-labelledby="global-title">
      <div class="hero-copy">
        <div class="hero-mark">${icon('brand')}<span class="eyebrow">across this machine</span></div>
        <h1 class="page" id="global-title">All projects</h1>
        <p class="subtitle">Every Iris workspace registered on this computer. Page counts and recent activity come from each project's machine state; open a project dashboard for the full workspace view.</p>
      </div>
      <div class="hero-quickstart">
        <span class="eyebrow">refresh</span>
        <span><code>iris render --all</code> from any registered project</span>
        <span><code>iris open --global</code></span>
      </div>
    </section>

    <section class="strip" aria-label="global summary">
      ${statTile({ value: model.projectCount, label: 'projects', sub: 'registered on this machine' })}
      ${statTile({ value: model.totalPages, label: 'pages', sub: 'across all projects' })}
      ${statTile({
        value: model.projects.filter((project) => project.stale).length,
        label: 'stale',
        sub: 'roots missing on disk',
      })}
    </section>

    <section class="project-grid" aria-label="Registered projects">
      ${projectCards}
    </section>`;
}

export function renderGlobalDashboardHtml(model: GlobalDashboardModel): string {
  return renderShell({
    mode: 'global',
    current: 'overview',
    depth: 0,
    title: 'All projects',
    projectName: 'all projects',
    theme: model.theme,
    counts: {},
    projectDocs: [],
    crumbs: [{ label: 'iris' }, { label: 'All projects' }],
    content: globalDashboardContent(model),
    footerHints: '<kbd>t</kbd> theme · <kbd>b</kbd> sidebar',
  });
}
