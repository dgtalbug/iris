import { renderDocument } from '../../lib/markdown.js';
import type { ProjectDocItem } from '../../lib/project-docs.js';
import { escapeHtml, projectDocMeta, statusChip } from '../common.js';
import { icon, type IconName } from '../icons.js';
import { tableOfContents, withoutLeadingTitle } from './research.js';

export function projectSiblingStrip(name: string, projectDocs: readonly string[]): string {
  const siblings = projectDocs.filter((doc) => doc !== name);
  if (siblings.length === 0) return '';
  return `<section class="card project-strip">
      <span class="eyebrow">other project docs</span>
      <nav class="project-links" aria-label="Other project documents">
        ${siblings.map((doc) => `<a href="./${escapeHtml(doc)}.html">${escapeHtml(projectDocMeta(doc).label)}</a>`).join('')}
      </nav>
    </section>`;
}

export function projectDocContent(item: ProjectDocItem, projectDocs: readonly string[]): string {
  const meta = projectDocMeta(item.name);
  const body = withoutLeadingTitle(item.body);
  const { html, headings } = renderDocument(
    body.trim() === '' ? '_This project doc has no content yet._' : body,
  );
  const toc = tableOfContents(headings);
  const warnings =
    item.warnings.length === 0
      ? ''
      : `<div class="callout c-warn"><strong>Front matter warnings</strong><ul>${item.warnings.map((warning) => `<li>${escapeHtml(warning.message)}</li>`).join('')}</ul></div>`;

  return `<div class="page-head">
      <div>
        <div class="page-title-row">
          ${icon(meta.icon as IconName)}
          <span class="eyebrow">project doc</span>
          ${statusChip(item.status)}
        </div>
        <h1>${escapeHtml(item.title)}</h1>
        <div class="doc-meta" style="margin-top: var(--space-2)">
          <span class="mono spec-path">${escapeHtml(item.path)}</span>
          <span>agent ${escapeHtml(item.agent)}</span>
          <span>updated ${escapeHtml(item.updated)}</span>
        </div>
      </div>
      <div class="page-head-actions"><span class="mono">edit ${escapeHtml(item.path)} · iris render --all</span></div>
    </div>
    ${warnings}
    <div class="${toc === '' ? 'doc-single' : 'layout'}">
      ${toc}
      <article class="card doc-body">${html}</article>
    </div>
    ${projectSiblingStrip(item.name, projectDocs)}`;
}
