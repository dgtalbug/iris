import type {
  OpenSpecCapability,
  OpenSpecChange,
  OpenSpecSnapshot,
  OpenSpecSourceDocument,
} from '../../lib/openspec-workspace.js';
import { renderSafeMarkdown } from '../../lib/markdown.js';
import { escapeHtml, progressBar, statTile } from '../common.js';

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

function sourceDetails(label: string, document?: OpenSpecSourceDocument): string {
  if (!document)
    return `<div class="spec-artifact"><span class="status-chip health-warning">missing ${escapeHtml(label)}</span></div>`;
  const operations = document.operations
    .map((operation) => `<span class="pill">${escapeHtml(operation)}</span>`)
    .join('');
  const summary = [
    document.requirements.length > 0 ? `${document.requirements.length} requirements` : '',
    document.scenarios.length > 0 ? `${document.scenarios.length} scenarios` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const isMarkdown = document.format
    ? document.format === 'markdown'
    : document.path.endsWith('.md');
  const body = isMarkdown
    ? `<div class="spec-document">${renderSafeMarkdown(document.raw)}</div>
      <details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>`
    : `<pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre>`;
  return `<details class="spec-artifact" data-document-format="${isMarkdown ? 'markdown' : 'yaml'}">
    <summary>${escapeHtml(label)} · <span class="mono spec-path">${escapeHtml(document.path)}</span></summary>
    <div class="spec-meta"><span class="mono">${escapeHtml(summary || 'readable source')}</span><span>${operations}</span></div>
    ${body}
  </details>`;
}

function capabilityCard(capability: OpenSpecCapability, label: string): string {
  const health = capability.document.warnings.some((item) => item.code === 'malformed-spec')
    ? 'invalid'
    : capability.document.warnings.length > 0
      ? 'warning'
      : 'valid';
  return `<article class="surface spec-card">
    <div class="spec-card-header">
      <div><span class="eyebrow">${escapeHtml(label)}</span><h3>${escapeHtml(capability.capability)}</h3></div>
      <span class="status-chip health-${health}">${health}</span>
    </div>
    <span class="mono spec-path">${escapeHtml(capability.path)}</span>
    <div class="spec-meta"><span>${capability.document.requirements.length} requirements</span><span>${capability.document.scenarios.length} scenarios</span></div>
    ${sourceDetails('spec', capability.document)}
  </article>`;
}

function changeCard(change: OpenSpecChange): string {
  const tasks = change.artifacts.tasks?.progress;
  const progress = tasks
    ? `${tasks.complete}/${tasks.total} tasks · ${tasks.open} open`
    : 'tasks unavailable';
  const bar = tasks ? progressBar(tasks.complete, tasks.total, `${change.name}: ${progress}`) : '';
  return `<article class="surface spec-card">
    <div class="spec-card-header">
      <div><span class="eyebrow">${escapeHtml(change.lifecycle)} · structured</span><h3>${escapeHtml(change.name)}</h3></div>
      <span class="status-chip health-${escapeHtml(change.health)}">${escapeHtml(change.health)}</span>
    </div>
    <span class="mono spec-path">${escapeHtml(change.path)}</span>
    <div class="spec-meta"><span class="pill">${escapeHtml(change.completeness)}</span><span class="mono">${escapeHtml(progress)}</span></div>
    ${bar}
    <div class="spec-artifacts">
      ${sourceDetails('manifest', change.artifacts.manifest)}
      ${sourceDetails('proposal', change.artifacts.proposal)}
      ${sourceDetails('design', change.artifacts.design)}
      ${sourceDetails('tasks', change.artifacts.tasks)}
      ${change.delta_specs.map((capability) => capabilityCard(capability, 'delta spec')).join('')}
    </div>
  </article>`;
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
        <p>Canonical specs, active changes, archives, and real task checkboxes read directly from <code class="mono">openspec/</code>. Refreshed by <code class="mono">iris init</code> and <code class="mono">iris render --all</code>; the OpenSpec CLI is not required.</p>
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
      ${contextDocuments.length === 0 ? '' : `<section aria-labelledby="spec-context-title"><div class="section-heading"><div><span class="eyebrow">workspace identity</span><h2 id="spec-context-title">Project context</h2></div></div><div class="spec-grid">${contextDocuments.map((document) => `<article class="surface spec-card"><h3>${escapeHtml(document.title)}</h3>${sourceDetails('source', document)}</article>`).join('')}</div></section>`}
      <section aria-labelledby="canonical-specs-title">
        <div class="section-heading"><div><span class="eyebrow">source of truth</span><h2 id="canonical-specs-title">Canonical specs</h2></div><span class="pill">${counts.canonical}</span></div>
        ${snapshot.canonical_specs.length === 0 ? '<div class="surface empty-state">No canonical specs found.</div>' : `<div class="spec-grid">${snapshot.canonical_specs.map((capability) => capabilityCard(capability, 'canonical')).join('')}</div>`}
      </section>
      <section aria-labelledby="active-changes-title">
        <div class="section-heading"><div><span class="eyebrow">current movement</span><h2 id="active-changes-title">Active changes</h2></div><span class="pill">${counts.active}</span></div>
        ${snapshot.active_changes.length === 0 ? '<div class="surface empty-state">No active changes found.</div>' : `<div class="spec-grid">${snapshot.active_changes.map(changeCard).join('')}</div>`}
      </section>
      <section aria-labelledby="archive-title">
        <div class="section-heading"><div><span class="eyebrow">history</span><h2 id="archive-title">Archive</h2></div><span class="pill">${counts.archived}</span></div>
        ${snapshot.archived_changes.length === 0 && snapshot.legacy_archives.length === 0 ? '<div class="surface empty-state">No archived changes found.</div>' : `<div class="spec-grid">${snapshot.archived_changes.map(changeCard).join('')}${snapshot.legacy_archives.map((document) => `<article class="surface spec-card"><div class="spec-card-header"><div><span class="eyebrow">archived · legacy</span><h3>${escapeHtml(document.title)}</h3></div><span class="status-chip">legacy</span></div>${sourceDetails('archived source', document)}</article>`).join('')}</div>`}
      </section>
      ${warningList(snapshot)}
    </div>`;
}
