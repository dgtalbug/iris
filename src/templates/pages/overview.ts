import type { OpenSpecChange } from '../../lib/openspec-workspace.js';
import { COMMAND_GROUPS, statusCounts } from '../../lib/command-catalog.js';
import {
  escapeHtml,
  progressBar,
  projectDocMeta,
  statTile,
  typeBadgeClass,
  WORK_TYPES,
  type DashboardPage,
} from '../common.js';
import { icon, typeIcon, type IconName } from '../icons.js';
import { workListItem, workStatusCounts } from './work.js';
import type { SpecCounts } from './spec.js';

const RECENT_LIMIT = 5;

/**
 * Replaces the aperture ring: one badge per type carrying the typed icon, the
 * type name, and its count, so the same information survives without a graphic.
 */
export function pagesByType(pages: DashboardPage[]): string {
  const counts = new Map<string, number>();
  for (const page of pages) counts.set(page.type, (counts.get(page.type) ?? 0) + 1);
  const present = WORK_TYPES.filter((type) => (counts.get(type) ?? 0) > 0);
  const extra = [...counts.keys()].filter(
    (type) => !(WORK_TYPES as readonly string[]).includes(type),
  );

  if (pages.length === 0) {
    return `<p class="hero-types work-meta">No pages yet — start with <code>iris research my-question</code>.</p>`;
  }

  const badges = [...present, ...extra]
    .map(
      (type) =>
        `<span class="badge ${typeBadgeClass(type)}">${typeIcon(type)}${escapeHtml(type)} ${counts.get(type) ?? 0}</span>`,
    )
    .join('');
  return `<div class="hero-types" role="group" aria-label="${pages.length} ${pages.length === 1 ? 'page' : 'pages'} by type">${badges}</div>`;
}

export function recentPages(pages: DashboardPage[]): DashboardPage[] {
  return [...pages]
    .sort((left, right) => {
      const leftKey = left.updated === 'not set' ? '' : left.updated;
      const rightKey = right.updated === 'not set' ? '' : right.updated;
      if (leftKey === rightKey) return left.id.localeCompare(right.id);
      return rightKey.localeCompare(leftKey);
    })
    .slice(0, RECENT_LIMIT);
}

function specMovement(changes: OpenSpecChange[], spec: SpecCounts): string {
  if (changes.length === 0) {
    if (spec.canonical + spec.archived === 0) {
      return '<div class="empty-state">No Specs records found. Add one under <code>specs/</code>, then run <code>iris render --all</code>.</div>';
    }
    return `<div class="spec-holdings">
        <p class="spec-holdings-line"><b>${spec.canonical}</b> canonical ${spec.canonical === 1 ? 'spec' : 'specs'} · <b>${spec.archived}</b> archived ${spec.archived === 1 ? 'change' : 'changes'} · <b>${spec.tasksComplete}</b> tasks complete</p>
        <p class="work-meta">No change is active right now. Add one under <code>specs/changes/</code>, then run <code>iris render --all</code>.</p>
      </div>`;
  }
  return changes
    .map((change) => {
      const tasks = change.artifacts.tasks?.progress;
      const label = tasks ? `${tasks.complete}/${tasks.total} tasks` : 'tasks unavailable';
      const bar = tasks ? progressBar(tasks.complete, tasks.total, `${change.name}: ${label}`) : '';
      return `<div class="change-row">
          <div class="change-row-head"><b>${escapeHtml(change.name)}</b><span class="work-meta">${escapeHtml(label)}</span></div>
          ${bar}
        </div>`;
    })
    .join('');
}

export function overviewPageContent({
  projectName,
  pages,
  spec,
  activeChanges,
  researchCount,
  projectDocs,
  hldDiagram,
}: {
  projectName: string;
  pages: DashboardPage[];
  spec: SpecCounts;
  activeChanges: OpenSpecChange[];
  researchCount: number;
  projectDocs: readonly string[];
  hldDiagram: string;
}): string {
  const work = workStatusCounts(pages);
  const commands = statusCounts();
  const commandTotal = commands.implemented + commands.partial + commands.stubbed;
  const contentCommands =
    COMMAND_GROUPS.find((group) => group.id === 'content')?.entries.slice(0, 2) ?? [];

  const typeRow = pagesByType(pages);
  const recent = recentPages(pages);
  const recentMarkup =
    recent.length === 0
      ? '<div class="empty-state">No work recorded yet. Start with <code>iris research my-question</code> or <code>iris bug my-first-bug</code>.</div>'
      : recent.map((page) => workListItem(page, { compact: true })).join('');

  const projectStrip =
    projectDocs.length === 0
      ? `<section class="empty-state"><h2>Project docs are not initialized</h2><p>Create the managed overview, HLD, LLD, ERD, and decisions pages with <code>iris init</code>.</p></section>`
      : `<div class="doc-grid">
          ${projectDocs
            .map((name) => {
              const meta = projectDocMeta(name);
              return `<a class="card doc-card" href="./project/${escapeHtml(name)}.html">
                ${icon(meta.icon as IconName)}
                <span class="doc-card-label">${escapeHtml(meta.label)}</span>
                <span class="doc-card-purpose">${escapeHtml(meta.purpose)}</span>
              </a>`;
            })
            .join('\n          ')}
        </div>`;

  return `<section class="card hero" aria-labelledby="briefing-title">
      <div class="hero-copy">
        <div class="hero-mark">${icon('brand')}<span class="eyebrow">what this repo is</span></div>
        <h1 class="page" id="briefing-title">${escapeHtml(projectName)}</h1>
        <p class="subtitle">Agent-first visual workspace. Every rendered page below opens straight from <code class="mono">file://</code> with no server, build step, or network request.</p>
        ${typeRow}
      </div>
      <div class="hero-quickstart">
        <span class="eyebrow">quick start</span>
        ${contentCommands.map((entry) => `<span><code>${escapeHtml(entry.usage)}</code></span>`).join('\n        ')}
        <span><code>iris render --all</code> · <code>iris open</code></span>
      </div>
    </section>

    <section class="strip" aria-label="workspace summary">
      ${statTile({ value: work.total, label: 'work items', sub: `${work.active} active · ${work.done} done · ${work.draft} draft`, href: './work.html' })}
      ${statTile({ value: spec.active, label: 'active changes', sub: `${spec.canonical} canonical · ${spec.archived} archived`, href: './spec.html' })}
      ${statTile({ value: researchCount, label: 'research', sub: 'markdown pages', href: './research.html' })}
      ${statTile({ value: commandTotal, label: 'commands', sub: `${commands.implemented} implemented · ${commands.partial} partial · ${commands.stubbed} stubbed`, href: './commands.html' })}
    </section>

    <div class="grid-2">
      <section class="card" aria-labelledby="recent-work-title">
        <div class="card-head">
          <div><span class="eyebrow">current movement</span><h2 id="recent-work-title">Recent work</h2></div>
          <a href="./work.html">Open Work &rarr;</a>
        </div>
        <div class="card-body">${recentMarkup}</div>
      </section>
      <section class="card" aria-labelledby="spec-movement-title">
        <div class="card-head">
          <div><span class="eyebrow">specs</span><h2 id="spec-movement-title">Spec movement</h2></div>
          <a href="./spec.html">Open Spec &rarr;</a>
        </div>
        <div class="card-body">${specMovement(activeChanges, spec)}</div>
      </section>
    </div>

    <section class="card" aria-labelledby="architecture-title">
      <div class="card-head">
        <div><span class="eyebrow">system shape</span><h2 id="architecture-title">Architecture</h2></div>
        ${projectDocs.includes('hld') ? '<a href="./project/hld.html">Open HLD &rarr;</a>' : '<span class="mono">hld page missing</span>'}
      </div>
      ${
        hldDiagram === ''
          ? '<div class="empty-state"><p>No HLD diagram yet. Edit <code>iris/project/hld.md</code> (created by <code>iris init</code>), add a <code>mermaid</code> fence, then run <code>iris render --all</code>.</p></div>'
          : `<div class="card-body">${hldDiagram}</div>`
      }
    </section>

    <section id="project-docs" aria-labelledby="project-docs-title">
      <div class="section-heading"><div><span class="eyebrow">reference shelf</span><h2 id="project-docs-title">Project docs</h2></div></div>
      ${projectStrip}
    </section>`;
}
