import { icon, typeIcon, type IconName } from './icons.js';

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

/**
 * Record encoding onto Vision's badge and icon classes (§5): a type keeps one
 * accent everywhere it appears, and archived is the muted dashed variant.
 */
const TYPE_BADGE: Record<string, string> = {
  report: 'b-1',
  feature: 'b-3',
  bug: 'b-danger',
  idea: 'b-4',
  plan: 'b-2',
  research: 'b-primary',
};

const TYPE_ICON: Record<string, string> = {
  report: 'ic-1',
  feature: 'ic-3',
  bug: 'ic-danger',
  idea: 'ic-4',
  plan: 'ic-2',
  research: 'ic-primary',
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'b-muted',
  active: 'b-primary',
  done: 'b-success',
  archived: 'b-archived',
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'b-danger',
  high: 'b-warning',
  medium: 'b-1',
  low: 'b-muted',
};

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE[status] ?? 'b-primary';
}

export function typeBadgeClass(type: string): string {
  return TYPE_BADGE[type] ?? 'b-muted';
}

export function typeIconClass(type: string): string {
  return TYPE_ICON[type] ?? 'ic-muted';
}

export function priorityBadgeClass(priority: string): string {
  return PRIORITY_BADGE[priority] ?? 'b-muted';
}

/** Parser and spec health, and catalog command status, share one badge scale. */
const HEALTH_BADGE: Record<string, string> = {
  valid: 'b-success',
  complete: 'b-success',
  implemented: 'b-success',
  installed: 'b-success',
  warning: 'b-warning',
  incomplete: 'b-warning',
  partial: 'b-warning',
  invalid: 'b-danger',
  missing: 'b-danger',
  stubbed: 'b-muted',
};

export function healthBadgeClass(health: string): string {
  return HEALTH_BADGE[health] ?? 'b-muted';
}

export function tagChip(value: string): string {
  return `<span class="badge b-muted">${escapeHtml(value)}</span>`;
}

/** Vision badge for a record type; the type name is always present as text. */
export function typeChip(type: string): string {
  return `<span class="badge ${typeBadgeClass(type)}">${typeIcon(type)}${escapeHtml(type)}</span>`;
}

export function statusChip(status: string): string {
  return `<span class="badge ${statusBadgeClass(status)}">${escapeHtml(status)}</span>`;
}

export function priorityChip(priority: string): string {
  return `<span class="badge ${priorityBadgeClass(priority)}">${escapeHtml(priority)}</span>`;
}

/** The typed icon on its own, for row starts and card heads. */
export function recordIcon(type: string): string {
  return typeIcon(type, { class: typeIconClass(type) });
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
  const body = `<span class="value">${escapeHtml(String(value))}</span><span class="label">${escapeHtml(label)}</span>${sub ? `<span class="sub">${escapeHtml(sub)}</span>` : ''}`;
  return href
    ? `<a class="card stat" href="${escapeHtml(href)}">${body}</a>`
    : `<div class="card stat">${body}</div>`;
}

export function progressBar(complete: number, total: number, label: string): string {
  const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
  const variant = percent === 100 ? ' m-success' : '';
  return `<div class="meter${variant}" role="img" aria-label="${escapeHtml(label)}"><div class="track"><div class="fill" style="width: ${percent}%"></div></div></div>`;
}
