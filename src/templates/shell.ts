import { escapeHtml, projectDocMeta, PROJECT_DOC_NAMES } from './common.js';

const ICONS: Record<string, string> = {
  overview: '<circle cx="12" cy="12" r="8" stroke-dasharray="30 10" />',
  work: '<rect x="3" y="4" width="5" height="16" rx="1" /><rect x="10" y="4" width="5" height="11" rx="1" /><rect x="17" y="4" width="4" height="7" rx="1" />',
  spec: '<path d="M6 3h9l4 4v14H6z" /><path d="M9 12h6M9 16h6M15 3v4h4" />',
  research: '<circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" />',
  commands: '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="m7 10 3 2-3 2M12 15h5" />',
  doc: '<path d="M4 5h16v14H4zM4 9h16" />',
  'doc-overview': '<circle cx="12" cy="12" r="9" /><path d="m15 9-2.2 4.8L8 16l2.2-4.8z" />',
  'doc-hld':
    '<rect x="9" y="3" width="6" height="5" rx="1" /><rect x="3" y="15" width="6" height="5" rx="1" /><rect x="15" y="15" width="6" height="5" rx="1" /><path d="M12 8v4M6 15v-3h12v3" />',
  'doc-lld':
    '<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M3 10h6M13 9h5M13 13h5" />',
  'doc-erd':
    '<ellipse cx="7" cy="6" rx="4" ry="2" /><path d="M3 6v5c0 1.1 1.8 2 4 2s4-.9 4-2V6" /><rect x="14" y="13" width="7" height="7" rx="1" /><path d="M11 11h1a2 2 0 0 1 2 2v2" />',
  'doc-decisions':
    '<path d="M12 3v18" /><path d="M5 7h9l2.5 2.5L14 12H5z" /><path d="M19 15h-9l-2.5-2.5" />',
};

export type SectionId = 'overview' | 'work' | 'spec' | 'research' | 'commands';

export type NavCounts = Partial<Record<SectionId, number>>;

export type Crumb = { label: string; href?: string };

export type ShellOptions = {
  current: string;
  depth: number;
  title: string;
  projectName: string;
  crumbs: Crumb[];
  counts: NavCounts;
  projectDocs: readonly string[];
  content: string;
  topbar?: string;
  theme: string;
  mermaid?: boolean;
  drawer?: boolean;
  footerHints?: string;
};

const SECTIONS: Array<{ id: SectionId; label: string; file: string }> = [
  { id: 'overview', label: 'Overview', file: 'index.html' },
  { id: 'work', label: 'Work', file: 'work.html' },
  { id: 'spec', label: 'Spec', file: 'spec.html' },
  { id: 'research', label: 'Research', file: 'research.html' },
  { id: 'commands', label: 'Commands', file: 'commands.html' },
];

export function assetPrefix(depth: number): string {
  return depth <= 0 ? './' : '../'.repeat(depth);
}

function icon(name: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] ?? ICONS.doc}</svg>`;
}

function navItem({
  href,
  label,
  iconName,
  current,
  count,
}: {
  href: string;
  label: string;
  iconName: string;
  current: boolean;
  count?: number;
}): string {
  const currentAttribute = current ? ' aria-current="page"' : '';
  const countMarkup =
    typeof count === 'number' ? `<em class="nav-count">${escapeHtml(String(count))}</em>` : '';
  return `<li><a class="nav-item" href="${escapeHtml(href)}"${currentAttribute} title="${escapeHtml(label)}">${icon(iconName)}<span>${escapeHtml(label)}</span>${countMarkup}</a></li>`;
}

export function renderSidebar(options: ShellOptions): string {
  const prefix = assetPrefix(options.depth);
  const sections = SECTIONS.map((section) =>
    navItem({
      href: `${prefix}${section.file}`,
      label: section.label,
      iconName: section.id,
      current: options.current === section.id,
      count: options.counts[section.id],
    }),
  ).join('');

  const docs = options.projectDocs
    .map((name) => {
      const meta = projectDocMeta(name);
      return navItem({
        href: `${prefix}project/${name}.html`,
        label: meta.label,
        iconName: meta.icon,
        current: options.current === `project:${name}`,
      });
    })
    .join('');

  const docsGroup =
    docs === ''
      ? ''
      : `<div class="eyebrow nav-group">project docs</div><ul class="nav-list">${docs}</ul>`;

  return `<nav class="sidebar" data-iris-nav data-sidebar aria-label="Workspace sections">
      <a class="sidebar-brand" href="${prefix}index.html">
        <svg class="aperture-glyph tp-plan" viewBox="0 0 24 24" role="img" aria-label="iris" style="width: 1.5rem; height: 1.5rem"><circle cx="12" cy="12" r="8" /></svg>
        <span><strong>iris</strong><small>${escapeHtml(options.projectName)}</small></span>
      </a>
      <div class="sidebar-scroll">
        <ul class="nav-list">${sections}</ul>
        ${docsGroup}
      </div>
      <div class="sidebar-foot">
        <span class="sidebar-version">works offline</span>
        <button class="nav-collapse" type="button" data-nav-toggle aria-expanded="true" aria-label="Collapse sidebar" title="Toggle sidebar (b)">&#8249;</button>
      </div>
    </nav>`;
}

function renderCrumbs(crumbs: Crumb[]): string {
  return crumbs
    .map((crumb, index) => {
      const last = index === crumbs.length - 1;
      const separator = last ? '' : '<span aria-hidden="true">/</span>';
      const label = last
        ? `<b>${escapeHtml(crumb.label)}</b>`
        : crumb.href
          ? `<a href="${escapeHtml(crumb.href)}">${escapeHtml(crumb.label)}</a>`
          : `<span>${escapeHtml(crumb.label)}</span>`;
      return `${label}${separator}`;
    })
    .join('');
}

function workDrawer(): string {
  return `<div class="work-drawer-shell" data-work-drawer hidden>
      <button class="work-drawer-backdrop" type="button" data-work-drawer-backdrop aria-label="Close work details"></button>
      <aside class="work-drawer" role="dialog" aria-modal="true" aria-labelledby="work-drawer-title" aria-describedby="work-drawer-description" tabindex="-1">
        <header class="work-drawer-header">
          <div><span class="eyebrow" data-work-drawer-type>type</span> <span class="mono" data-work-drawer-id>id</span></div>
          <button class="button" type="button" data-work-drawer-close>Close</button>
        </header>
        <div class="work-drawer-body">
          <h2 class="work-drawer-title" id="work-drawer-title" data-work-drawer-title>Work details</h2>
          <dl class="work-drawer-meta">
            <div><dt>Status</dt><dd data-work-drawer-status>not set</dd></div>
            <div><dt>Priority</dt><dd data-work-drawer-priority>not set</dd></div>
            <div><dt>Updated</dt><dd data-work-drawer-updated>not set</dd></div>
            <div><dt>Agent</dt><dd data-work-drawer-agent>not set</dd></div>
          </dl>
          <section class="work-drawer-section"><h3>Description</h3><p id="work-drawer-description" data-work-drawer-description>No description provided.</p></section>
          <section class="work-drawer-section"><h3>Evidence</h3><p data-work-drawer-evidence>No evidence summary available.</p></section>
          <section class="work-drawer-section"><h3>Tags</h3><p data-work-drawer-tags>not set</p></section>
          <div class="work-drawer-actions"><a class="button button-primary" data-work-drawer-full-page href="./index.html">Open full page</a></div>
        </div>
      </aside>
    </div>`;
}

export function renderShell(options: ShellOptions): string {
  const prefix = assetPrefix(options.depth);
  const hints =
    options.footerHints ?? '<kbd>/</kbd> filter · <kbd>t</kbd> theme · <kbd>b</kbd> sidebar';
  const mermaidScript = options.mermaid
    ? `<script defer src="${prefix}design/vendor/mermaid.min.js"></script>\n    `
    : '';

  return `<!doctype html>
<html lang="en" data-theme="${escapeHtml(options.theme)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(options.title)} · iris</title>
    <link rel="stylesheet" href="${prefix}design/tokens.css" />
    <link rel="stylesheet" href="${prefix}design/components/base.css" />
  </head>
  <body>
    <div class="app" data-dashboard-main>
      ${renderSidebar(options)}
      <div class="main">
        <header class="topbar" data-iris-nav>
          <button class="button menu-button" type="button" data-menu-toggle aria-expanded="false" aria-label="Show workspace sections">&#9776;</button>
          <nav class="crumbs" aria-label="Breadcrumb">${renderCrumbs(options.crumbs)}</nav>
          <span class="topbar-spacer"></span>
          ${options.topbar ?? ''}
          <button class="theme-toggle" type="button" data-theme-toggle aria-label="Toggle color theme">theme <kbd>t</kbd></button>
        </header>
        <main class="content">
${options.content}
        </main>
        <footer class="footer"><span>generated by iris · works offline from file://</span><span data-iris-nav>${hints}</span></footer>
      </div>
    </div>
    ${options.drawer ? workDrawer() : ''}
    ${mermaidScript}<script defer src="${prefix}design/components/base.js"></script>
  </body>
</html>`.replace(/[ \t]+$/gm, '');
}

export { PROJECT_DOC_NAMES };
