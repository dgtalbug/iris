import { renderDocument, type DocumentHeading } from '../../lib/markdown.js';
import {
  researchDescription,
  researchEvidence,
  type ResearchItem,
  type ResearchWarning,
} from '../../lib/research-workspace.js';
import {
  recordIcon,
  escapeHtml,
  statTile,
  statusChip,
  typeChip,
  type DashboardPage,
} from '../common.js';

export function researchListRow(item: ResearchItem, href: string): string {
  const tags = item.tags.length > 0 ? item.tags.join(' · ') : 'no tags';
  return `<article class="work-list-row" data-work-list-item>
      <a class="work-row" href="${escapeHtml(href)}">
        ${recordIcon('research')}
        <span class="work-row-primary"><span class="work-row-title">${escapeHtml(item.title)}</span><span class="work-row-id">${escapeHtml(item.id)} · ${escapeHtml(tags)}</span></span>
        ${statusChip(item.status)}
        <span class="work-meta">${escapeHtml(researchEvidence(item))}</span>
        <span class="work-meta work-updated">${escapeHtml(item.updated)}</span>
        <span class="work-meta work-agent">${escapeHtml(item.agent)}</span>
      </a>
    </article>`;
}

function warningList(warnings: ResearchWarning[]): string {
  if (warnings.length === 0) return '';
  return `<section aria-labelledby="research-warnings-title">
      <div class="section-heading"><div><span class="eyebrow">parser health</span><h2 id="research-warnings-title">Warnings</h2></div><span class="badge b-warning">${warnings.length}</span></div>
      <ul class="card spec-list">
        ${warnings.map((warning) => `<li class="spec-warning"><strong>${escapeHtml(warning.code)}</strong> · <code>${escapeHtml(warning.path)}</code><br />${escapeHtml(warning.message)}</li>`).join('')}
      </ul>
    </section>`;
}

export function researchPageContent(
  items: ResearchItem[],
  warnings: ResearchWarning[],
  hrefFor: (item: ResearchItem) => string,
): string {
  const tagCount = new Set(items.flatMap((item) => item.tags)).size;
  const rows =
    items.length === 0
      ? `<article class="empty-state"><h2>No research pages yet</h2><p>Create one with <code>iris research my-question</code>, write Markdown in <code>iris/research/&lt;id&gt;/index.md</code>, then run <code>iris render --all</code>.</p></article>`
      : items.map((item) => researchListRow(item, hrefFor(item))).join('');

  return `<div class="page-head">
      <div>
        <span class="eyebrow">markdown pages</span>
        <h1>Research</h1>
        <p>Investigations and written-up answers, authored as Markdown at <code class="mono">iris/research/&lt;id&gt;/index.md</code> and rendered here. Iris reads only this directory; general repository documentation is never ingested.</p>
      </div>
      <div class="page-head-actions"><span class="mono">iris research &lt;id&gt; · iris render --all</span></div>
    </div>

    <section class="strip" aria-label="research summary">
      ${statTile({ value: items.length, label: 'research pages' })}
      ${statTile({ value: items.filter((item) => item.status === 'active').length, label: 'active' })}
      ${statTile({ value: items.filter((item) => item.status === 'done').length, label: 'done' })}
      ${statTile({ value: items.filter((item) => item.status === 'draft').length, label: 'draft' })}
      ${statTile({ value: tagCount, label: 'tags' })}
    </section>

    <section class="card list" aria-label="all research">${rows}</section>
    ${warningList(warnings)}`;
}

function tableOfContents(headings: DocumentHeading[]): string {
  const usable = headings.filter((heading) => heading.level === 2 || heading.level === 3);
  if (usable.length < 2) return '';
  const items = usable
    .map(
      (heading) =>
        `<li class="toc-${heading.level}"><a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a></li>`,
    )
    .join('');
  return `<aside class="toc" aria-label="On this page"><div class="toc-title">on this page</div><ol>${items}</ol></aside>`;
}

// The page header already shows the title, which is derived from the body's own
// first level-one heading when front matter omits it; rendering both duplicates it.
function withoutLeadingTitle(body: string): string {
  return body.replace(/^\s*#[ \t]+.+?(?:\n|$)/, '');
}

export function researchDocumentContent(item: ResearchItem): string {
  const body = withoutLeadingTitle(item.body);
  const { html, headings } = renderDocument(
    body.trim() === '' ? '_This research page has no content yet._' : body,
  );
  const toc = tableOfContents(headings);
  const tags =
    item.tags.length === 0
      ? '<span>tags not set</span>'
      : `<span>tags ${item.tags.map((tag) => `<span class="badge b-muted">${escapeHtml(tag)}</span>`).join(' ')}</span>`;
  const warnings =
    item.warnings.length === 0
      ? ''
      : `<div class="callout c-warn"><strong>Front matter warnings</strong><ul>${item.warnings.map((warning) => `<li>${escapeHtml(warning.message)}</li>`).join('')}</ul></div>`;

  return `<div class="page-head">
      <div>
        <div class="page-title-row">
          ${recordIcon('research')}
          ${typeChip('research')}
          ${statusChip(item.status)}
        </div>
        <h1>${escapeHtml(item.title)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span>id ${escapeHtml(item.id)}</span>
          <span>agent ${escapeHtml(item.agent)}</span>
          <span>updated ${escapeHtml(item.updated)}</span>
          ${tags}
        </div>
      </div>
    </div>
    ${warnings}
    <div class="${toc === '' ? 'doc-single' : 'layout'}">
      ${toc}
      <article class="card doc-body">${html}</article>
    </div>`;
}

export function researchDashboardPage(item: ResearchItem, href: string): DashboardPage {
  return {
    id: item.id,
    type: 'research',
    title: item.title,
    status: item.status,
    href,
    updated: item.updated,
    agent: item.agent,
    tags: item.tags,
    priority: 'not set',
    description: researchDescription(item.body) || 'No description provided.',
    evidence: researchEvidence(item),
  };
}
