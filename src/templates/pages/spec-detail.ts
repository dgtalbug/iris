import type {
  OpenSpecCapability,
  OpenSpecChange,
  OpenSpecSourceDocument,
} from '../../lib/openspec-workspace.js';
import { renderDocument, type DocumentHeading } from '../../lib/markdown.js';
import { escapeHtml, progressBar, statTile } from '../common.js';

const SAFE_SEGMENT = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/i;

export type SpecDetailKind = 'capability' | 'change' | 'legacy';

/**
 * Detail pages live under two namespaces so a capability named `changes` can
 * never collide with the change namespace, and nested capability paths keep
 * their structure as directories rather than being flattened into a slug.
 */
export function specDetailPath(kind: SpecDetailKind, name: string): string | undefined {
  const segments = name.split('/').filter(Boolean);
  if (segments.length === 0 || !segments.every((segment) => SAFE_SEGMENT.test(segment))) {
    return undefined;
  }
  const root = kind === 'capability' ? 'capabilities' : kind === 'change' ? 'changes' : 'legacy';
  return `spec/${root}/${segments.join('/')}/page.html`;
}

export function specDetailDepth(relativePath: string): number {
  return relativePath.split('/').length - 1;
}

function slugPrefix(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'artifact'
  );
}

function tableOfContents(headings: DocumentHeading[]): string {
  const usable = headings.filter((heading) => heading.level >= 2 && heading.level <= 3);
  if (usable.length < 2) return '';
  const items = usable
    .map(
      (heading) =>
        `<li class="toc-${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`,
    )
    .join('');
  return `<aside class="surface doc-toc" aria-label="On this page"><span class="eyebrow">on this page</span><ol>${items}</ol></aside>`;
}

function warningNotice(document: OpenSpecSourceDocument): string {
  if (document.warnings.length === 0) return '';
  return `<div class="surface callout warn"><strong>Parser warnings</strong><ul>${document.warnings
    .map((warning) => `<li>${escapeHtml(warning.code)}: ${escapeHtml(warning.message)}</li>`)
    .join('')}</ul></div>`;
}

type RenderedArtifact = {
  html: string;
  headings: DocumentHeading[];
};

function artifactSection(
  label: string,
  document: OpenSpecSourceDocument | undefined,
  prefix: string,
): RenderedArtifact {
  const anchor = `${slugPrefix(prefix)}-artifact`;
  if (!document) {
    return {
      html: `<section class="surface doc-body" id="${anchor}">
          <h2>${escapeHtml(label)}</h2>
          <p class="work-meta">This artifact is missing from the change directory.</p>
        </section>`,
      headings: [{ level: 2, id: anchor, text: `${label} (missing)` }],
    };
  }

  const isMarkdown = document.format
    ? document.format === 'markdown'
    : document.path.endsWith('.md');
  const source = `<details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>`;

  if (!isMarkdown) {
    return {
      html: `<section class="surface doc-body" id="${anchor}">
          <h2>${escapeHtml(label)}</h2>
          <p class="mono spec-path">${escapeHtml(document.path)}</p>
          <pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre>
        </section>`,
      headings: [{ level: 2, id: anchor, text: label }],
    };
  }

  const { html, headings } = renderDocument(document.raw, { idPrefix: slugPrefix(prefix) });
  const operations = document.operations
    .map((operation) => `<span class="pill">${escapeHtml(operation)}</span>`)
    .join('');
  return {
    html: `<section class="surface doc-body" id="${anchor}">
        <div class="spec-card-header">
          <h2>${escapeHtml(label)}</h2>
          <span class="spec-meta">${operations}</span>
        </div>
        <p class="mono spec-path">${escapeHtml(document.path)}</p>
        ${warningNotice(document)}
        ${html}
        ${source}
      </section>`,
    headings: [{ level: 2, id: anchor, text: label }, ...headings],
  };
}

export function capabilityDetailContent(
  capability: OpenSpecCapability,
  label: string,
  backHref: string,
): string {
  const document = capability.document;
  const health = document.warnings.some((item) => item.code === 'malformed-spec')
    ? 'invalid'
    : document.warnings.length > 0
      ? 'warning'
      : 'valid';
  const { html, headings } = renderDocument(document.raw);
  const toc = tableOfContents(headings);

  return `<div class="page-head">
      <div>
        <span class="eyebrow">${escapeHtml(label)}</span>
        <h1>${escapeHtml(capability.capability)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span class="mono spec-path">${escapeHtml(capability.path)}</span>
          <span class="status-chip health-${health}">${health}</span>
        </div>
      </div>
      <div class="page-head-actions"><a class="button" href="${escapeHtml(backHref)}">&larr; Spec index</a></div>
    </div>

    <section class="strip" aria-label="capability summary">
      ${statTile({ value: document.requirements.length, label: 'requirements' })}
      ${statTile({ value: document.scenarios.length, label: 'scenarios' })}
      ${statTile({ value: document.warnings.length, label: 'warnings' })}
    </section>

    ${warningNotice(document)}
    <div class="${toc === '' ? 'doc-single' : 'doc-layout'}">
      <article class="surface doc-body">
        ${html}
        <details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>
      </article>
      ${toc}
    </div>`;
}

/** Legacy archives are a bare Markdown file, so their slug comes from the filename. */
export function legacyDetailSlug(document: OpenSpecSourceDocument): string {
  const base = document.path.split('/').pop() ?? document.path;
  return base.replace(/\.md$/i, '');
}

export function legacyDetailContent(document: OpenSpecSourceDocument, backHref: string): string {
  const { html, headings } = renderDocument(document.raw);
  const toc = tableOfContents(headings);
  return `<div class="page-head">
      <div>
        <span class="eyebrow">archived · legacy</span>
        <h1>${escapeHtml(document.title)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span class="mono spec-path">${escapeHtml(document.path)}</span>
          <span class="status-chip">legacy</span>
        </div>
      </div>
      <div class="page-head-actions"><a class="button" href="${escapeHtml(backHref)}">&larr; Spec index</a></div>
    </div>

    ${warningNotice(document)}
    <div class="${toc === '' ? 'doc-single' : 'doc-layout'}">
      <article class="surface doc-body">
        ${html}
        <details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>
      </article>
      ${toc}
    </div>`;
}

export function changeDetailContent(change: OpenSpecChange, backHref: string): string {
  const tasks = change.artifacts.tasks?.progress;
  const artifacts: RenderedArtifact[] = [
    artifactSection('Proposal', change.artifacts.proposal, 'proposal'),
    artifactSection('Design', change.artifacts.design, 'design'),
    artifactSection('Tasks', change.artifacts.tasks, 'tasks'),
    artifactSection('Manifest', change.artifacts.manifest, 'manifest'),
    ...change.delta_specs.map((capability) =>
      artifactSection(
        `Delta spec · ${capability.capability}`,
        capability.document,
        `delta-${capability.capability}`,
      ),
    ),
  ];

  const toc = tableOfContents(artifacts.flatMap((artifact) => artifact.headings));

  return `<div class="page-head">
      <div>
        <span class="eyebrow">${escapeHtml(change.lifecycle)} change</span>
        <h1>${escapeHtml(change.name)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span class="mono spec-path">${escapeHtml(change.path)}</span>
          <span class="pill">${escapeHtml(change.completeness)}</span>
          <span class="status-chip health-${escapeHtml(change.health)}">${escapeHtml(change.health)}</span>
        </div>
      </div>
      <div class="page-head-actions"><a class="button" href="${escapeHtml(backHref)}">&larr; Spec index</a></div>
    </div>

    <section class="strip" aria-label="change summary">
      ${statTile({ value: tasks ? tasks.complete : 'n/a', label: 'tasks complete' })}
      ${statTile({ value: tasks ? tasks.open : 'n/a', label: 'tasks open' })}
      ${statTile({ value: change.delta_specs.length, label: 'delta specs' })}
    </section>

    ${tasks ? `<div class="surface card-body-pad">${progressBar(tasks.complete, tasks.total, `${change.name}: ${tasks.complete} of ${tasks.total} tasks complete`)}<p class="work-meta" style="margin: var(--space-2) 0 0">${tasks.complete}/${tasks.total} tasks complete · ${tasks.open} open</p></div>` : ''}

    <div class="${toc === '' ? 'doc-single' : 'doc-layout'}">
      <div class="spec-stack">${artifacts.map((artifact) => artifact.html).join('')}</div>
      ${toc}
    </div>`;
}
