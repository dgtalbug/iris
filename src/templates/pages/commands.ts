import { COMMAND_GROUPS, statusCounts, type CommandEntry } from '../../lib/command-catalog.js';
import { escapeHtml, statTile } from '../common.js';

function commandCard(entry: CommandEntry): string {
  const flags = entry.flags.map((flag) => `<span class="pill">${escapeHtml(flag)}</span>`).join('');
  const lands = entry.lands
    ? `<p class="mono">lands in <code>${escapeHtml(entry.lands)}</code></p>`
    : '';
  return `<article class="surface command-card">
      <div class="command-card-head">
        <code>${escapeHtml(entry.name)}</code>
        <span class="status-chip status-${escapeHtml(entry.status)}">${escapeHtml(entry.status)}</span>
      </div>
      <p>${escapeHtml(entry.synopsis)}</p>
      <pre class="command-usage"><code>${escapeHtml(entry.usage)}</code></pre>
      ${lands}
      <div class="command-flags">${flags}</div>
    </article>`;
}

export function commandsPageContent(): string {
  const counts = statusCounts();
  const total = counts.implemented + counts.partial + counts.stubbed;

  const groups = COMMAND_GROUPS.map(
    (group) => `<section aria-labelledby="commands-${escapeHtml(group.id)}">
      <div class="section-heading">
        <div><span class="eyebrow">${escapeHtml(group.label)}</span><h2 id="commands-${escapeHtml(group.id)}" class="visually-hidden">${escapeHtml(group.label)}</h2></div>
        <span class="mono">${group.entries.length} ${group.entries.length === 1 ? 'command' : 'commands'}</span>
      </div>
      <div class="command-grid">${group.entries.map(commandCard).join('')}</div>
    </section>`,
  ).join('');

  return `<div class="page-head">
      <div>
        <span class="eyebrow">reference</span>
        <h1>Commands</h1>
        <p>Generated from one command catalog — the same source as <code class="mono">iris --help</code>. Status is explicit: a command is never listed as available unless it is.</p>
      </div>
    </div>

    <section class="strip" aria-label="command surface summary">
      ${statTile({ value: total, label: 'commands' })}
      ${statTile({ value: counts.implemented, label: 'implemented' })}
      ${statTile({ value: counts.partial, label: 'partial' })}
      ${statTile({ value: counts.stubbed, label: 'stubbed' })}
    </section>

    ${groups}`;
}
