import type {
  OpenSpecCapability,
  OpenSpecChange,
  OpenSpecSnapshot,
  OpenSpecSourceDocument,
} from '../../lib/openspec-workspace.js';
import { escapeHtml, progressBar, statTile } from '../common.js';
import { legacyDetailSlug, specDetailPath } from './spec-detail.js';

export const EMPTY_OPENSPEC_SNAPSHOT: OpenSpecSnapshot = {
  version: 1,
  detected: false,
  generated_at: null,
  context: {},
  canonical_specs: [],
  active_changes: [],
  archived_changes: [],
  legacy_archives: [],
  warnings: [],
};

export type SpecCounts = {
  canonical: number;
  active: number;
  archived: number;
  tasksComplete: number;
  tasksOpen: number;
};

export function specCounts(snapshot: OpenSpecSnapshot): SpecCounts {
  const changes = [...snapshot.active_changes, ...snapshot.archived_changes];
  const progress = changes.reduce(
    (total, change) => ({
      complete: total.complete + (change.artifacts.tasks?.progress.complete ?? 0),
      open: total.open + (change.artifacts.tasks?.progress.open ?? 0),
    }),
    { complete: 0, open: 0 },
  );
  return {
    canonical: snapshot.canonical_specs.length,
    active: snapshot.active_changes.length,
    archived: snapshot.archived_changes.length + snapshot.legacy_archives.length,
    tasksComplete: progress.complete,
    tasksOpen: progress.open,
  };
}

export function capabilityHealth(capability: OpenSpecCapability): string {
  if (capability.document.warnings.some((item) => item.code === 'malformed-spec')) return 'invalid';
  return capability.document.warnings.length > 0 ? 'warning' : 'valid';
}

function nameCell(label: string, href: string | undefined, path: string): string {
  const title = href
    ? `<a class="work-table-title" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
    : `<span class="work-table-title">${escapeHtml(label)}</span>`;
  return `<td><span class="work-row-primary">${title}<span class="work-row-id">${escapeHtml(path)}</span></span></td>`;
}

function capabilityRows(capabilities: OpenSpecCapability[]): string {
  return capabilities
    .map((capability) => {
      const health = capabilityHealth(capability);
      const href = specDetailPath('capability', capability.capability);
      return `<tr>
          ${nameCell(capability.capability, href ? `./${href}` : undefined, capability.path)}
          <td class="mono col-updated">${capability.document.requirements.length}</td>
          <td class="mono col-priority">${capability.document.scenarios.length}</td>
          <td><span class="status-chip health-${health}">${health}</span></td>
        </tr>`;
    })
    .join('');
}

function changeRows(changes: OpenSpecChange[]): string {
  return changes
    .map((change) => {
      const tasks = change.artifacts.tasks?.progress;
      const label = tasks ? `${tasks.complete}/${tasks.total} tasks` : 'tasks unavailable';
      const href = specDetailPath('change', change.name);
      return `<tr>
          ${nameCell(change.name, href ? `./${href}` : undefined, change.path)}
          <td class="col-type"><span class="pill">${escapeHtml(change.completeness)}</span></td>
          <td class="col-updated">${tasks ? progressBar(tasks.complete, tasks.total, `${change.name}: ${label}`) : ''}<span class="work-meta">${escapeHtml(label)}</span></td>
          <td><span class="status-chip health-${escapeHtml(change.health)}">${escapeHtml(change.health)}</span></td>
        </tr>`;
    })
    .join('');
}

function legacyRows(documents: OpenSpecSourceDocument[]): string {
  return documents
    .map((document) => {
      const href = specDetailPath('legacy', legacyDetailSlug(document));
      return `<tr>
        ${nameCell(document.title, href ? `./${href}` : undefined, document.path)}
        <td class="col-type"><span class="pill">legacy</span></td>
        <td class="col-updated"><span class="work-meta">not structured</span></td>
        <td><span class="status-chip">archived</span></td>
      </tr>`;
    })
    .join('');
}

function table(caption: string, headers: string[], rows: string, empty: string): string {
  if (rows === '') return `<div class="surface empty-state">${empty}</div>`;
  return `<div class="surface work-table-wrap">
      <table class="work-table">
        <caption class="visually-hidden">${escapeHtml(caption)}</caption>
        <thead><tr>${headers.map((header, index) => `<th scope="col"${index === 1 ? ' class="col-type"' : index === 2 ? ' class="col-updated"' : index === 3 && headers.length > 4 ? ' class="col-priority"' : ''}>${escapeHtml(header)}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function contextDisclosure(document: OpenSpecSourceDocument): string {
  return `<details class="surface spec-card spec-artifact">
      <summary>${escapeHtml(document.title)} · <span class="mono spec-path">${escapeHtml(document.path)}</span></summary>
      <pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre>
    </details>`;
}

function warningList(snapshot: OpenSpecSnapshot): string {
  if (snapshot.warnings.length === 0) return '';
  return `<section aria-labelledby="spec-warnings-title">
    <div class="section-heading"><div><span class="eyebrow">parser health</span><h2 id="spec-warnings-title">Warnings</h2></div><span class="status-chip health-warning">${snapshot.warnings.length} warnings</span></div>
    <ul class="surface spec-card spec-list">
      ${snapshot.warnings.map((item) => `<li class="spec-warning"><strong>${escapeHtml(item.code)}</strong> · <code>${escapeHtml(item.path)}</code><br />${escapeHtml(item.message)}</li>`).join('')}
    </ul>
  </section>`;
}

export function specPageContent(snapshot: OpenSpecSnapshot): string {
  const counts = specCounts(snapshot);
  const supportedCount =
    snapshot.canonical_specs.length +
    snapshot.active_changes.length +
    snapshot.archived_changes.length +
    snapshot.legacy_archives.length;
  const emptyState = !snapshot.detected
    ? '<article class="surface empty-state"><h2>No OpenSpec workspace detected</h2><p>Add an <code>openspec/</code> workspace, then run <code>iris init</code> or <code>iris render --all</code>. General project documentation is not ingested.</p></article>'
    : supportedCount === 0
      ? '<article class="surface empty-state"><h2>OpenSpec workspace is empty</h2><p>No supported canonical specs, active changes, or archive records were found. Refresh after adding OpenSpec artifacts with <code>iris render --all</code>.</p></article>'
      : '';
  const contextDocuments = [snapshot.context.project, snapshot.context.config].filter(
    (document): document is OpenSpecSourceDocument => Boolean(document),
  );

  return `<div class="page-head">
      <div>
        <span class="eyebrow">openspec filesystem snapshot</span>
        <h1>Spec</h1>
        <p>Canonical specs, active changes, archives, and real task checkboxes read directly from <code class="mono">openspec/</code>. Each record opens its own page; this index carries no artifact bodies. Refreshed by <code class="mono">iris init</code> and <code class="mono">iris render --all</code>.</p>
      </div>
    </div>

    <section class="strip" aria-label="OpenSpec overview">
      ${statTile({ value: counts.canonical, label: 'canonical' })}
      ${statTile({ value: counts.active, label: 'active changes' })}
      ${statTile({ value: counts.archived, label: 'archived' })}
      ${statTile({ value: counts.tasksComplete, label: 'tasks complete' })}
      ${statTile({ value: counts.tasksOpen, label: 'tasks open' })}
    </section>

    <div class="spec-stack">
      ${emptyState}
      <section aria-labelledby="canonical-specs-title">
        <div class="section-heading"><div><span class="eyebrow">source of truth</span><h2 id="canonical-specs-title">Canonical specs</h2></div><span class="pill">${counts.canonical}</span></div>
        ${table(
          'Canonical specs',
          ['Capability', 'Requirements', 'Scenarios', 'Health'],
          capabilityRows(snapshot.canonical_specs),
          'No canonical specs found.',
        )}
      </section>
      <section aria-labelledby="active-changes-title">
        <div class="section-heading"><div><span class="eyebrow">current movement</span><h2 id="active-changes-title">Active changes</h2></div><span class="pill">${counts.active}</span></div>
        ${table(
          'Active changes',
          ['Change', 'Completeness', 'Tasks', 'Health'],
          changeRows(snapshot.active_changes),
          'No active changes found.',
        )}
      </section>
      <section aria-labelledby="archive-title">
        <div class="section-heading"><div><span class="eyebrow">history</span><h2 id="archive-title">Archive</h2></div><span class="pill">${counts.archived}</span></div>
        ${table(
          'Archived changes',
          ['Change', 'Completeness', 'Tasks', 'Health'],
          `${changeRows(snapshot.archived_changes)}${legacyRows(snapshot.legacy_archives)}`,
          'No archived changes found.',
        )}
      </section>
      ${contextDocuments.length === 0 ? '' : `<section aria-labelledby="spec-context-title"><div class="section-heading"><div><span class="eyebrow">workspace identity</span><h2 id="spec-context-title">Project context</h2></div></div><div class="spec-grid">${contextDocuments.map(contextDisclosure).join('')}</div></section>`}
      ${warningList(snapshot)}
    </div>`;
}
