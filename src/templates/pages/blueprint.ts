import { escapeHtml, tabGroup } from '../common.js';
import { renderElectricMarkdown } from './electric-markdown.js';

export const BLUEPRINT_SECTIONS = [
  { id: 'tldr', label: 'TL;DR' },
  { id: 'question', label: 'Question' },
  { id: 'map', label: 'Map' },
  { id: 'territory', label: 'Territory' },
  { id: 'findings', label: 'Findings' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'paths', label: 'Paths' },
  { id: 'risks', label: 'Risks' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'appendix', label: 'Appendix' },
] as const;

export type BlueprintSectionId = (typeof BLUEPRINT_SECTIONS)[number]['id'];

export type BlueprintEntry = {
  id: BlueprintSectionId;
  label: string;
  markdown: string;
};

/**
 * Per-type emphasis: key sections render open and carry the narrative weight;
 * the rest collapse into `details.ds`. Bug error paths are danger-toned, and
 * a feature pulls proposal/options/tradeoffs into one tab group.
 */
const KEY_SECTIONS: Record<string, readonly BlueprintSectionId[]> = {
  bug: ['findings', 'paths'],
  feature: ['proposal', 'territory', 'risks'],
  plan: ['proposal'],
  report: ['tldr', 'numbers'],
  idea: ['question', 'proposal'],
};

const FEATURE_TAB_SECTIONS: readonly BlueprintSectionId[] = ['proposal', 'territory', 'risks'];

const FEATURE_TAB_LABELS: Partial<Record<BlueprintSectionId, string>> = {
  proposal: 'Proposal',
  territory: 'Options',
  risks: 'Tradeoffs',
};

export function blueprintEntries(sections: Record<string, unknown>): BlueprintEntry[] {
  const blueprint = sections.blueprint;
  if (!blueprint || typeof blueprint !== 'object' || Array.isArray(blueprint)) return [];
  const record = blueprint as Record<string, unknown>;
  return BLUEPRINT_SECTIONS.flatMap(({ id, label }) => {
    const value = record[id];
    return typeof value === 'string' && value.trim() !== '' ? [{ id, label, markdown: value }] : [];
  });
}

function renderOpenSection(entry: BlueprintEntry, danger: boolean): string {
  const { html } = renderElectricMarkdown(entry.markdown);
  return `<section class="card doc-body blueprint-section${danger ? ' c-danger' : ''}" id="blueprint-${entry.id}" data-blueprint-section="${entry.id}">
      <span class="eyebrow">${escapeHtml(entry.label)}</span>
      ${html}
    </section>`;
}

function renderCollapsedSection(entry: BlueprintEntry): string {
  const { html } = renderElectricMarkdown(entry.markdown);
  return `<details class="ds blueprint-section" id="blueprint-${entry.id}" data-blueprint-section="${entry.id}">
      <summary>${escapeHtml(entry.label)}</summary>
      <div class="body doc-body">${html}</div>
    </details>`;
}

function renderFeatureTabs(pageId: string, entries: BlueprintEntry[]): string {
  const ordered = [...entries].sort(
    (a, b) => FEATURE_TAB_SECTIONS.indexOf(a.id) - FEATURE_TAB_SECTIONS.indexOf(b.id),
  );
  const panels = ordered.map((entry) => ({
    id: entry.id,
    label: FEATURE_TAB_LABELS[entry.id] ?? entry.label,
    html: `<div class="doc-body">${renderElectricMarkdown(entry.markdown).html}</div>`,
  }));
  const tabs = tabGroup(`blueprint-${pageId}`, 'feature blueprint', panels);
  return `<div class="card blueprint-section" data-blueprint-tabs="${ordered
    .map((entry) => entry.id)
    .join(' ')}">${tabs}</div>`;
}

export function renderBlueprint(
  type: string,
  pageId: string,
  sections: Record<string, unknown>,
): string {
  const entries = blueprintEntries(sections);
  if (entries.length === 0) return '';
  const key = KEY_SECTIONS[type] ?? [];

  if (type === 'feature') {
    const tabbed = entries.filter((entry) => FEATURE_TAB_SECTIONS.includes(entry.id));
    let tabsEmitted = false;
    return entries
      .map((entry) => {
        if (FEATURE_TAB_SECTIONS.includes(entry.id)) {
          if (tabsEmitted) return '';
          tabsEmitted = true;
          return renderFeatureTabs(pageId, tabbed);
        }
        return key.includes(entry.id)
          ? renderOpenSection(entry, false)
          : renderCollapsedSection(entry);
      })
      .join('');
  }

  return entries
    .map((entry) => {
      if (!key.includes(entry.id)) return renderCollapsedSection(entry);
      return renderOpenSection(entry, type === 'bug' && entry.id === 'paths');
    })
    .join('');
}
