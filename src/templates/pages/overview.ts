import type { OpenSpecChange } from '../../lib/openspec-workspace.js';
import { COMMAND_GROUPS, statusCounts } from '../../lib/command-catalog.js';
import { apertureRing, escapeHtml, progressBar, statTile, type DashboardPage } from '../common.js';
import { workListItem, workStatusCounts } from './work.js';
import type { SpecCounts } from './spec.js';

const RECENT_LIMIT = 5;

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

function specMovement(changes: OpenSpecChange[]): string {
  if (changes.length === 0) {
    return '<div class="empty-state">No active OpenSpec changes. Add one under <code>openspec/changes/</code>, then run <code>iris render --all</code>.</div>';
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
}: {
  projectName: string;
  pages: DashboardPage[];
  spec: SpecCounts;
  activeChanges: OpenSpecChange[];
  researchCount: number;
  projectDocs: readonly string[];
}): string {
  const work = workStatusCounts(pages);
  const commands = statusCounts();
  const commandTotal = commands.implemented + commands.partial + commands.stubbed;
  const contentCommands =
    COMMAND_GROUPS.find((group) => group.id === 'content')?.entries.slice(0, 2) ?? [];

  const recent = recentPages(pages);
  const recentMarkup =
    recent.length === 0
      ? '<div class="empty-state">No work recorded yet. Start with <code>iris research my-question</code> or <code>iris bug my-first-bug</code>.</div>'
      : recent.map((page) => workListItem(page)).join('');

  const projectStrip =
    projectDocs.length === 0
      ? `<section class="surface empty-state"><h2>Project docs are not initialized</h2><p>Create the managed overview, HLD, LLD, ERD, and decisions pages with <code>iris init</code>.</p></section>`
      : `<section class="surface project-strip">
          <span class="eyebrow">project docs</span>
          <nav class="project-links" aria-label="Project documents">
            ${projectDocs.map((name) => `<a href="./project/${escapeHtml(name)}.html">${escapeHtml(name)}</a>`).join('\n            ')}
          </nav>
        </section>`;

  return `<section class="surface briefing-hero" aria-labelledby="briefing-title">
      ${apertureRing(pages)}
      <div class="hero-copy">
        <span class="eyebrow">what this repo is</span>
        <h1 id="briefing-title">${escapeHtml(projectName)}</h1>
        <p class="hero-line">Agent-first visual workspace. Every rendered page below opens straight from <code class="mono">file://</code> with no server, build step, or network request.</p>
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
      <section class="surface card" aria-labelledby="recent-work-title">
        <div class="card-head">
          <div><span class="eyebrow">current movement</span><h2 id="recent-work-title">Recent work</h2></div>
          <a href="./work.html">Open Work &rarr;</a>
        </div>
        <div class="card-body">${recentMarkup}</div>
      </section>
      <section class="surface card" aria-labelledby="spec-movement-title">
        <div class="card-head">
          <div><span class="eyebrow">openspec</span><h2 id="spec-movement-title">Spec movement</h2></div>
          <a href="./spec.html">Open Spec &rarr;</a>
        </div>
        <div class="card-body">${specMovement(activeChanges)}</div>
      </section>
    </div>

    <section class="surface card" aria-labelledby="architecture-title">
      <div class="card-head">
        <div><span class="eyebrow">system shape</span><h2 id="architecture-title">Architecture</h2></div>
        ${projectDocs.includes('hld') ? '<a href="./project/hld.html">Open HLD &rarr;</a>' : '<span class="mono">hld page missing</span>'}
      </div>
      <div class="empty-state architecture-pane">No architecture diagram is projected here yet. Mermaid fences render inside Markdown after <code>iris vendor</code>; automatic HLD projection into this pane remains separate work.</div>
    </section>

    <section id="project-docs" aria-labelledby="project-docs-title">
      <div class="section-heading"><div><span class="eyebrow">reference shelf</span><h2 id="project-docs-title">Project docs</h2></div></div>
      ${projectStrip}
    </section>`;
}
