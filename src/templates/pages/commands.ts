import { COMMAND_GROUPS, statusCounts, type CommandEntry } from '../../lib/command-catalog.js';
import type { AgentSurfaceReport } from '../../lib/agent-skills.js';
import { escapeHtml, healthBadgeClass, statTile } from '../common.js';

const SURFACE_READERS: Array<{ prefix: string; reader: string }> = [
  { prefix: '.claude/commands/', reader: 'Claude slash commands' },
  { prefix: '.claude/skills/', reader: 'Claude' },
  { prefix: '.github/prompts/', reader: 'GitHub Copilot prompts' },
  { prefix: '.github/skills/', reader: 'GitHub Copilot' },
  { prefix: '.agents/skills/', reader: 'Generic / Codex' },
];

function surfaceReader(relativePath: string): string {
  return SURFACE_READERS.find((entry) => relativePath.startsWith(entry.prefix))?.reader ?? 'Agent';
}

const SURFACE_STATUS_LABEL: Record<AgentSurfaceReport['status'], string> = {
  installed: 'installed',
  missing: 'not installed',
  unmanaged: 'user-owned',
};

function agentSurfaceSection(surfaces: AgentSurfaceReport[]): string {
  if (surfaces.length === 0) return '';
  const installed = surfaces.filter((surface) => surface.status === 'installed').length;
  const groups = new Map<string, AgentSurfaceReport[]>();
  for (const surface of surfaces) {
    const reader = surfaceReader(surface.relativePath);
    groups.set(reader, [...(groups.get(reader) ?? []), surface]);
  }

  const rows = [...groups.entries()]
    .map(
      ([reader, entries]) => `<tr>
          <td>${escapeHtml(reader)}</td>
          <td class="mono">${entries.map((entry) => escapeHtml(entry.relativePath)).join('<br>')}</td>
          <td>${entries
            .map(
              (entry) =>
                `<span class="badge ${healthBadgeClass(entry.status)}">${escapeHtml(SURFACE_STATUS_LABEL[entry.status])}</span>`,
            )
            .join('<br>')}</td>
        </tr>`,
    )
    .join('');

  return `<section id="agent-surfaces" aria-labelledby="agent-surfaces-title">
      <div class="section-heading">
        <div><span class="eyebrow">what iris installs</span><h2 id="agent-surfaces-title">Agent surfaces</h2></div>
        <span class="mono">${installed} of ${surfaces.length} installed</span>
      </div>
      <div class="card work-table-wrap">
        <table class="work-table">
          <thead><tr><th>Reads it</th><th>Destination</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

function commandCard(entry: CommandEntry): string {
  const flags = entry.flags
    .map((flag) => `<span class="badge b-muted">${escapeHtml(flag)}</span>`)
    .join('');
  const lands = entry.lands
    ? `<p class="mono">lands in <code>${escapeHtml(entry.lands)}</code></p>`
    : '';
  return `<article class="card command-card">
      <div class="command-card-head">
        <code>${escapeHtml(entry.name)}</code>
        <span class="badge ${healthBadgeClass(entry.status)}">${escapeHtml(entry.status)}</span>
      </div>
      <p>${escapeHtml(entry.synopsis)}</p>
      <pre class="command-usage"><code>${escapeHtml(entry.usage)}</code></pre>
      ${lands}
      <div class="command-flags">${flags}</div>
    </article>`;
}

export function commandsPageContent(surfaces: AgentSurfaceReport[] = []): string {
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

    ${groups}

    ${agentSurfaceSection(surfaces)}`;
}
