import type {
  OpenSpecCapability,
  OpenSpecChange,
  OpenSpecSourceDocument,
} from '../../lib/openspec-workspace.js';
import { renderDocument, type DocumentHeading } from '../../lib/markdown.js';
import { escapeHtml, healthBadgeClass, progressBar, statTile, tabGroup } from '../common.js';

export type SpecDetailKind = 'capability' | 'change' | 'legacy';

export function specRecordHash(kind: SpecDetailKind, name: string): string {
  return `#/${kind}/${name}`;
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
  return `<aside class="toc" aria-label="On this page"><div class="toc-title">on this page</div><ol>${items}</ol></aside>`;
}

function warningNotice(document: OpenSpecSourceDocument): string {
  if (document.warnings.length === 0) return '';
  return `<div class="callout c-warn"><strong>Parser warnings</strong><ul>${document.warnings
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
      html: `<section class="card doc-body" id="${anchor}">
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
      html: `<section class="card doc-body" id="${anchor}">
          <h2>${escapeHtml(label)}</h2>
          <p class="mono spec-path">${escapeHtml(document.path)}</p>
          <pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre>
        </section>`,
      headings: [{ level: 2, id: anchor, text: label }],
    };
  }

  const { html, headings } = renderDocument(document.raw, { idPrefix: slugPrefix(prefix) });
  const operations = document.operations
    .map((operation) => `<span class="badge b-muted">${escapeHtml(operation)}</span>`)
    .join('');
  return {
    html: `<section class="card doc-body" id="${anchor}">
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

export function capabilityDetailContent(capability: OpenSpecCapability, label: string): string {
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
          <span class="badge ${healthBadgeClass(health)}">${health}</span>
        </div>
      </div>
      <div class="page-head-actions"><button class="btn btn-outline" type="button" data-spec-back>&larr; Spec index</button></div>
    </div>

    <section class="strip" aria-label="capability summary">
      ${statTile({ value: document.requirements.length, label: 'requirements' })}
      ${statTile({ value: document.scenarios.length, label: 'scenarios' })}
      ${statTile({ value: document.warnings.length, label: 'warnings' })}
    </section>

    ${warningNotice(document)}
    <div class="${toc === '' ? 'doc-single' : 'layout'}">
      ${toc}
      <article class="card doc-body">
        ${html}
        <details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>
      </article>
    </div>`;
}

/** Legacy archives are a bare Markdown file, so their slug comes from the filename. */
export function legacyDetailSlug(document: OpenSpecSourceDocument): string {
  const base = document.path.split('/').pop() ?? document.path;
  return base.replace(/\.md$/i, '');
}

export function legacyDetailContent(document: OpenSpecSourceDocument): string {
  const { html, headings } = renderDocument(document.raw);
  const toc = tableOfContents(headings);
  return `<div class="page-head">
      <div>
        <span class="eyebrow">archived · legacy</span>
        <h1>${escapeHtml(document.title)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span class="mono spec-path">${escapeHtml(document.path)}</span>
          <span class="badge b-archived">legacy</span>
        </div>
      </div>
      <div class="page-head-actions"><button class="btn btn-outline" type="button" data-spec-back>&larr; Spec index</button></div>
    </div>

    ${warningNotice(document)}
    <div class="${toc === '' ? 'doc-single' : 'layout'}">
      ${toc}
      <article class="card doc-body">
        ${html}
        <details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>
      </article>
    </div>`;
}

function artifactPanel(artifact: RenderedArtifact): string {
  const toc = tableOfContents(artifact.headings);
  return `<div class="${toc === '' ? 'doc-single' : 'layout'}">${toc}<div class="spec-stack">${artifact.html}</div></div>`;
}

export function changeDetailContent(change: OpenSpecChange): string {
  const tasks = change.artifacts.tasks?.progress;
  const proposal = artifactSection('Proposal', change.artifacts.proposal, 'proposal');
  const design = artifactSection('Design', change.artifacts.design, 'design');
  const taskDoc = artifactSection('Tasks', change.artifacts.tasks, 'tasks');
  const manifest = change.artifacts.manifest;
  const deltas = change.delta_specs.map((capability) =>
    artifactSection(
      `Delta spec · ${capability.capability}`,
      capability.document,
      `delta-${capability.capability}`,
    ),
  );
  const specs: RenderedArtifact = {
    html:
      (manifest
        ? `<details class="card spec-artifact"><summary>Manifest · <span class="mono spec-path">${escapeHtml(manifest.path)}</span></summary>${artifactSection('Manifest', manifest, 'manifest').html}</details>`
        : '') +
      (deltas.length === 0
        ? '<section class="card doc-body"><h2>Delta specs</h2><p class="work-meta">This change carries no delta specs.</p></section>'
        : deltas.map((delta) => delta.html).join('')),
    headings: deltas.flatMap((delta) => delta.headings),
  };

  return `<div class="page-head">
      <div>
        <span class="eyebrow">${escapeHtml(change.lifecycle)} change</span>
        <h1>${escapeHtml(change.name)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span class="mono spec-path">${escapeHtml(change.path)}</span>
          <span class="badge ${healthBadgeClass(change.completeness)}">${escapeHtml(change.completeness)}</span>
          <span class="badge ${healthBadgeClass(change.health)}">${escapeHtml(change.health)}</span>
        </div>
      </div>
      <div class="page-head-actions"><button class="btn btn-outline" type="button" data-spec-back>&larr; Spec index</button></div>
    </div>

    <section class="strip" aria-label="change summary">
      ${statTile({ value: tasks ? tasks.complete : 'n/a', label: 'tasks complete' })}
      ${statTile({ value: tasks ? tasks.open : 'n/a', label: 'tasks open' })}
      ${statTile({ value: change.delta_specs.length, label: 'delta specs' })}
    </section>

    ${tasks ? `<div class="card">${progressBar(tasks.complete, tasks.total, `${change.name}: ${tasks.complete} of ${tasks.total} tasks complete`)}<p class="work-meta" style="margin: var(--space-2) 0 0">${tasks.complete}/${tasks.total} tasks complete · ${tasks.open} open</p></div>` : ''}

    <div class="card">${tabGroup(`change-${slugPrefix(change.name)}`, 'change artifacts', [
      { id: 'proposal', label: 'Proposal', html: artifactPanel(proposal) },
      { id: 'design', label: 'Design', html: artifactPanel(design) },
      { id: 'tasks', label: 'Tasks', html: artifactPanel(taskDoc) },
      { id: 'specs', label: 'Specs', html: artifactPanel(specs) },
    ])}</div>`;
}

export type SpecRecord = {
  kind: SpecDetailKind;
  name: string;
  title: string;
  path: string;
  html: string;
};

export function specRecordKey(kind: SpecDetailKind, name: string): string {
  return `${kind}:${name}`;
}

/**
 * Encodes the bundle so record content cannot terminate the script element or
 * open an HTML comment. Escaping every `<` is deliberate bluntness: it makes
 * `</script>`, `<script`, and `<!--` inexpressible in the source text while
 * decoding back to the original characters at runtime. U+2028 and U+2029 are
 * valid JSON but invalid inside a JavaScript string literal.
 */
export function encodeSpecBundle(records: Record<string, SpecRecord>): string {
  const json = JSON.stringify({ records })
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  return `globalThis.IRIS_SPEC = ${json};\n`;
}
