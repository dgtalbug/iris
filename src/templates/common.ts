export const PROJECT_DOC_NAMES = ['overview', 'hld', 'lld', 'erd', 'decisions'] as const;

export const RETIRED_PROJECT_DOC_NAMES = ['commands'] as const;

export type ProjectDocMeta = {
  label: string;
  icon: string;
  purpose: string;
  contains: string[];
};

/** What each managed project document is for, so its placeholder is useful rather than blank. */
export const PROJECT_DOC_META: Record<string, ProjectDocMeta> = {
  overview: {
    label: 'Overview',
    icon: 'doc-overview',
    purpose: 'What this repository is, who it is for, and what it deliberately is not.',
    contains: [
      'The problem the project solves, in one paragraph',
      'Scope and explicit non-goals',
      'Where a newcomer should start reading',
    ],
  },
  hld: {
    label: 'HLD',
    icon: 'doc-hld',
    purpose: 'High-level design: the shape of the system and how its parts fit together.',
    contains: [
      'A component diagram in a `mermaid` fence',
      'The boundary between subsystems and what crosses it',
      'External dependencies and why each one is present',
    ],
  },
  lld: {
    label: 'LLD',
    icon: 'doc-lld',
    purpose: 'Low-level design: how a component actually works inside its boundary.',
    contains: [
      'Key modules, their responsibilities, and their invariants',
      'Control flow for the paths that are easy to get wrong',
      'Error handling and the states a reader would not guess',
    ],
  },
  erd: {
    label: 'ERD',
    icon: 'doc-erd',
    purpose: 'The data model: entities, their fields, and the relationships between them.',
    contains: [
      'An `erDiagram` mermaid fence',
      'Field meanings that the name alone does not carry',
      'Constraints, keys, and lifecycle of each record',
    ],
  },
  decisions: {
    label: 'Decisions',
    icon: 'doc-decisions',
    purpose: 'The decision log: what was chosen, when, and why the alternatives lost.',
    contains: [
      'One row per decision with a date and rationale',
      'The alternatives considered and why they were rejected',
      'Decisions that were later reversed, kept rather than deleted',
    ],
  },
};

export function projectDocMeta(name: string): ProjectDocMeta {
  return (
    PROJECT_DOC_META[name] ?? {
      label: name,
      icon: 'doc',
      purpose: 'A project document.',
      contains: [],
    }
  );
}

export const WORK_TYPES = ['report', 'feature', 'bug', 'idea', 'plan', 'research'] as const;

export type DashboardPage = {
  id: string;
  type: string;
  title: string;
  status: string;
  href: string;
  updated: string;
  agent: string;
  tags: string[];
  priority: string;
  description: string;
  evidence: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function statusClass(status: string): string {
  return ['draft', 'active', 'done', 'archived'].includes(status) ? `st-${status}` : 'st-active';
}

export function typeClass(type: string): string {
  return (WORK_TYPES as readonly string[]).includes(type) ? `tp-${type}` : 'tp-page';
}

export function priorityClass(priority: string): string {
  return ['urgent', 'high', 'medium', 'low'].includes(priority) ? `pr-${priority}` : 'pr-unset';
}

export function apertureGlyph(type: string): string {
  return `<svg class="aperture-glyph ${typeClass(type)}" viewBox="0 0 24 24" role="img" aria-label="${escapeHtml(type)} page"><circle cx="12" cy="12" r="8"><title>${escapeHtml(type)} page</title></circle></svg>`;
}

// The aperture ring is the workspace's signature: one arc per page, colored by
// page type and paired with an accessible title so color is never the only signal.
export function apertureRing(pages: DashboardPage[]): string {
  const size = 76;
  const center = size / 2;
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const shown = pages.slice(0, 24);

  const segments =
    shown.length === 0
      ? `<circle class="ring-empty" cx="${center}" cy="${center}" r="${radius}" />`
      : shown
          .map((page, index) => {
            const share = circumference / shown.length;
            const gap = shown.length === 1 ? 0 : Math.min(4, share * 0.18);
            const dash = Math.max(share - gap, 1).toFixed(2);
            const rest = (circumference - Number(dash)).toFixed(2);
            const angle = ((360 / shown.length) * index - 90).toFixed(2);
            return `<circle class="seg ${typeClass(page.type)}" cx="${center}" cy="${center}" r="${radius}" stroke-dasharray="${dash} ${rest}" transform="rotate(${angle} ${center} ${center})"><title>${escapeHtml(page.title)} · ${escapeHtml(page.type)} · ${escapeHtml(page.status)}</title></circle>`;
          })
          .join('');

  return `<svg class="aperture" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${shown.length} pages by type">
      ${segments}
      <text class="aperture-count" x="${center}" y="${center + 1}" text-anchor="middle" dominant-baseline="middle">${pages.length}</text>
      <text class="aperture-label" x="${center}" y="${center + 15}" text-anchor="middle">pages</text>
    </svg>`;
}

export function typeChip(type: string): string {
  return `<span class="type-chip ${typeClass(type)}">${escapeHtml(type)}</span>`;
}

export function statusChip(status: string): string {
  return `<span class="status-chip ${statusClass(status)}">${escapeHtml(status)}</span>`;
}

export function priorityChip(priority: string): string {
  return `<span class="priority-chip ${priorityClass(priority)}">${escapeHtml(priority)}</span>`;
}

export function statTile({
  value,
  label,
  sub,
  href,
}: {
  value: string | number;
  label: string;
  sub?: string;
  href?: string;
}): string {
  const body = `<span class="stat-value">${escapeHtml(String(value))}</span><span class="stat-label">${escapeHtml(label)}</span>${sub ? `<span class="stat-sub">${escapeHtml(sub)}</span>` : ''}`;
  return href
    ? `<a class="surface stat-tile" href="${escapeHtml(href)}">${body}</a>`
    : `<div class="surface stat-tile">${body}</div>`;
}

export function progressBar(complete: number, total: number, label: string): string {
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  return `<div class="progress" role="img" aria-label="${escapeHtml(label)}"><span style="width: ${percent}%"></span></div>`;
}
