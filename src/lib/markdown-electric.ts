import type { MarkdownIt, StateBlock, StateCore, StateInline, Token } from 'markdown-it';
import { icon, type IconName } from '../templates/icons.js';

// Every construct in this layer compiles to CSS classes that already exist in
// the design system. token-lint scans all of src/ for color literals, so this
// module must emit class names only — never a color value of any notation.

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function slugify(text: string, used: Set<string>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section';
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

function slug(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'note'
  );
}

export type ElectricContainerName =
  'callout' | 'evidence' | 'steps' | 'timeline' | 'filetree' | 'flow' | 'details' | 'meter';

export type ElectricContainerOpen = {
  name: ElectricContainerName;
  params: string;
};

const CONTAINER_NAMES: ReadonlySet<string> = new Set([
  'callout',
  'evidence',
  'steps',
  'timeline',
  'filetree',
  'flow',
  'details',
  'meter',
]);

const CONTAINER_OPEN = /^:::[ \t]*([a-z][a-z0-9-]*)[ \t]*(.*?)[ \t]*$/;
const CONTAINER_CLOSE = /^:::[ \t]*$/;

export function parseContainerOpen(line: string): ElectricContainerOpen | null {
  const match = CONTAINER_OPEN.exec(line);
  if (!match || !CONTAINER_NAMES.has(match[1])) return null;
  return { name: match[1] as ElectricContainerName, params: match[2] ?? '' };
}

export function parseContainerParams(params: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of params.matchAll(/([a-z][a-z0-9-]*)=("[^"]*"|'[^']*'|\S+)/g)) {
    const raw = match[2];
    const quoted =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"));
    result[match[1]] = quoted ? raw.slice(1, -1) : raw;
  }
  return result;
}

export type CalloutTone = 'info' | 'warn' | 'success' | 'danger';

const CALLOUT_TONES: Record<CalloutTone, { icon: IconName; label: string }> = {
  info: { icon: 'callout-info', label: 'Info' },
  warn: { icon: 'callout-warn', label: 'Warning' },
  success: { icon: 'callout-success', label: 'Success' },
  danger: { icon: 'callout-danger', label: 'Danger' },
};

function isCalloutTone(value: string | undefined): value is CalloutTone {
  return value === 'info' || value === 'warn' || value === 'success' || value === 'danger';
}

export function parseCalloutParams(params: string): { tone: CalloutTone; label: string } {
  const words = params.split(/\s+/).filter(Boolean);
  let tone: CalloutTone = 'info';
  if (isCalloutTone(words[0])) tone = words.shift() as CalloutTone;
  const label = words.length > 0 ? words.join(' ') : CALLOUT_TONES[tone].label;
  return { tone, label };
}

export type TimelineTone = 'past' | 'warn' | 'danger';

export type TimelineItem = {
  when: string;
  what: string;
  tone: TimelineTone | null;
};

export function parseTimelineItem(line: string): TimelineItem | null {
  const match = /^\s*[-*][ \t]+(.*?)[ \t]*$/.exec(line);
  if (!match) return null;
  const body = match[1];
  const separator = body.indexOf('::');
  const whenPart = separator >= 0 ? body.slice(0, separator).trim() : '';
  const what = (separator >= 0 ? body.slice(separator + 2) : body).trim();
  let when = whenPart;
  let tone: TimelineTone | null = null;
  const toneMatch = /^(.*?)[ \t]*!(past|warn|danger)$/.exec(whenPart);
  if (toneMatch) {
    when = toneMatch[1].trim();
    tone = toneMatch[2] as TimelineTone;
  }
  return { when, what, tone };
}

export type FiletreeLineKind = 'dir' | 'file' | 'hot' | 'note';

export type FiletreeLine = {
  kind: FiletreeLineKind;
  indent: number;
  text: string;
};

export function parseFiletreeLine(line: string): FiletreeLine | null {
  if (line.trim() === '') return null;
  const indent = line.length - line.trimStart().length;
  const text = line.trim();
  if (text.startsWith('#')) {
    return { kind: 'note', indent, text: text.replace(/^#+[ \t]*/, '') };
  }
  if (text.endsWith('/')) return { kind: 'dir', indent, text };
  if (text.endsWith('*')) {
    return { kind: 'hot', indent, text: text.replace(/[ \t]*\*$/, '') };
  }
  return { kind: 'file', indent, text };
}

export type FlowNodeTone = 'primary' | 'danger' | '1' | '2' | '3' | '4';

export type FlowNode = {
  label: string;
  tone: FlowNodeTone | null;
};

export function parseFlowLine(line: string): FlowNode[] {
  return line
    .split('->')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => {
      const toneMatch = /^(.*?)[ \t]*!(primary|danger|[1-4])$/.exec(part);
      if (!toneMatch) return { label: part, tone: null };
      return { label: toneMatch[1].trim(), tone: toneMatch[2] as FlowNodeTone };
    });
}

export type MeterTone = 'primary' | 'success' | 'warning' | 'danger';

export type MeterSpec = {
  label: string;
  value: number;
  tone: MeterTone;
};

function isMeterTone(value: string | undefined): value is MeterTone {
  return value === 'primary' || value === 'success' || value === 'warning' || value === 'danger';
}

export function parseMeterParams(params: string): MeterSpec {
  const pairs = parseContainerParams(params);
  const raw = Number(pairs.value);
  const value = Number.isFinite(raw) ? Math.min(100, Math.max(0, Math.round(raw))) : 0;
  return {
    label: pairs.label ?? 'Meter',
    value,
    tone: isMeterTone(pairs.tone) ? pairs.tone : 'primary',
  };
}

export type BlueprintSectionDef = {
  id: string;
  title: string;
  aliases?: readonly string[];
};

export type BlueprintTocEntry = {
  level: number;
  id: string;
  text: string;
};

export type BlueprintHeading = {
  level: number;
  id: string;
  text: string;
  section: string | null;
};

export type ElectricBlueprintResult = {
  toc: BlueprintTocEntry[];
  headings: BlueprintHeading[];
  presentSections: string[];
  words: number;
};

export type ElectricMetaEntry = {
  label: string;
  value: string;
};

export type ElectricRenderState = {
  footnoteDefs: Map<string, string>;
  footnoteNumbers: Map<string, number>;
  footnoteOrder: string[];
  components: number;
};

export type ElectricEnv = {
  idPrefix?: string;
  electricBlueprint?: { sections: readonly BlueprintSectionDef[] };
  electric?: ElectricRenderState;
  electricResult?: ElectricBlueprintResult;
};

function electricState(env: ElectricEnv): ElectricRenderState {
  env.electric ??= {
    footnoteDefs: new Map(),
    footnoteNumbers: new Map(),
    footnoteOrder: [],
    components: 0,
  };
  return env.electric;
}

export function normalizeBlueprintHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function electricContainer(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const openStart = state.bMarks[startLine] + state.tShift[startLine];
  const openEnd = state.eMarks[startLine];
  const open = parseContainerOpen(state.src.slice(openStart, openEnd));
  if (!open) return false;

  let depth = 0;
  let closeLine = -1;
  for (let line = startLine + 1; line < endLine; line += 1) {
    const start = state.bMarks[line] + state.tShift[line];
    const end = state.eMarks[line];
    const text = state.src.slice(start, end);
    if (parseContainerOpen(text)) {
      depth += 1;
      continue;
    }
    if (CONTAINER_CLOSE.test(text)) {
      if (depth === 0) {
        closeLine = line;
        break;
      }
      depth -= 1;
    }
  }
  if (closeLine < 0) return false;
  if (silent) return true;

  electricState(state.env as ElectricEnv).components += 1;
  // Body lines are sliced from the raw line start so filetree indentation and
  // tree-drawing characters survive; tShift would eat the authored indent.
  const bodyLines: string[] = [];
  for (let line = startLine + 1; line < closeLine; line += 1) {
    bodyLines.push(state.src.slice(state.bMarks[line], state.eMarks[line]));
  }

  switch (open.name) {
    case 'callout': {
      const token = state.push('electric_callout_open', 'div', 1);
      token.meta = parseCalloutParams(open.params);
      token.map = [startLine, closeLine + 1];
      state.md.block.tokenize(state, startLine + 1, closeLine);
      state.push('electric_callout_close', 'div', -1);
      break;
    }
    case 'evidence': {
      const token = state.push('electric_evidence_open', 'div', 1);
      token.meta = { src: parseContainerParams(open.params).src ?? '' };
      token.map = [startLine, closeLine + 1];
      state.md.block.tokenize(state, startLine + 1, closeLine);
      state.push('electric_evidence_close', 'div', -1);
      break;
    }
    case 'details': {
      const token = state.push('electric_details_open', 'details', 1);
      token.meta = { title: open.params === '' ? 'Details' : open.params };
      token.map = [startLine, closeLine + 1];
      state.md.block.tokenize(state, startLine + 1, closeLine);
      state.push('electric_details_close', 'details', -1);
      break;
    }
    case 'steps': {
      const before = state.tokens.length;
      state.md.block.tokenize(state, startLine + 1, closeLine);
      for (let index = before; index < state.tokens.length; index += 1) {
        const token = state.tokens[index];
        if (token.type === 'ordered_list_open' || token.type === 'bullet_list_open') {
          token.attrJoin('class', 'steps');
          break;
        }
      }
      break;
    }
    case 'timeline': {
      const openToken = state.push('electric_timeline_open', 'ul', 1);
      openToken.map = [startLine, closeLine + 1];
      for (const line of bodyLines) {
        const item = parseTimelineItem(line);
        if (!item) continue;
        const itemOpen = state.push('electric_timeline_item_open', 'li', 1);
        itemOpen.meta = { tone: item.tone };
        const when = state.push('electric_timeline_when', 'span', 0);
        when.meta = { when: item.when };
        state.push('electric_timeline_what_open', 'span', 1);
        const inline = state.push('inline', '', 0);
        inline.content = item.what;
        inline.children = [];
        state.push('electric_timeline_what_close', 'span', -1);
        state.push('electric_timeline_item_close', 'li', -1);
      }
      state.push('electric_timeline_close', 'ul', -1);
      break;
    }
    case 'filetree': {
      const openToken = state.push('electric_filetree_open', 'div', 1);
      openToken.map = [startLine, closeLine + 1];
      for (const line of bodyLines) {
        const parsed = parseFiletreeLine(line);
        if (!parsed) continue;
        const token = state.push('electric_filetree_line', 'div', 0);
        token.meta = parsed;
      }
      state.push('electric_filetree_close', 'div', -1);
      break;
    }
    case 'flow': {
      for (const line of bodyLines) {
        const nodes = parseFlowLine(line);
        if (nodes.length === 0) continue;
        state.push('electric_flow_open', 'div', 1);
        nodes.forEach((node, index) => {
          if (index > 0) state.push('electric_flow_edge', 'span', 0);
          const token = state.push('electric_flow_node', 'span', 0);
          token.meta = node;
        });
        state.push('electric_flow_close', 'div', -1);
      }
      break;
    }
    case 'meter': {
      const token = state.push('electric_meter', 'div', 0);
      token.meta = parseMeterParams(open.params);
      token.map = [startLine, closeLine + 1];
      break;
    }
  }
  state.line = closeLine + 1;
  return true;
}

// Footnote definitions must be claimed before markdown-it's built-in reference
// rule, which would otherwise swallow `[^n]: text` lines as link definitions.
function electricFootnoteDefinition(
  state: StateBlock,
  startLine: number,
  _endLine: number,
  silent: boolean,
): boolean {
  const start = state.bMarks[startLine] + state.tShift[startLine];
  const end = state.eMarks[startLine];
  const match = /^\[\^([^\s[\]]+)\]:[ \t]*(.*)$/.exec(state.src.slice(start, end));
  if (!match) return false;
  if (silent) return true;
  const env = electricState(state.env as ElectricEnv);
  if (!env.footnoteDefs.has(match[1])) env.footnoteDefs.set(match[1], match[2]);
  state.line = startLine + 1;
  return true;
}

function electricFootnoteReference(state: StateInline, silent: boolean): boolean {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 0x5b) return false;
  if (state.src.charCodeAt(start + 1) !== 0x5e) return false;
  const close = state.src.indexOf(']', start + 2);
  if (close < 0) return false;
  const label = state.src.slice(start + 2, close);
  if (!/^[^\s[\]]+$/.test(label)) return false;
  if (!silent) {
    const token = state.push('electric_footnote_ref', 'sup', 0);
    token.meta = { label };
  }
  state.pos = close + 1;
  return true;
}

type FootnoteRefMeta = {
  label: string;
  number?: number;
  target?: string;
  refId?: string;
};

function electricFootnotes(state: StateCore): void {
  const env = state.env as ElectricEnv;
  const electric = electricState(env);
  const prefix = env.idPrefix ? `${env.idPrefix}-` : '';

  for (const token of state.tokens) {
    if (token.type !== 'inline' || !token.children) continue;
    for (const child of token.children) {
      if (child.type !== 'electric_footnote_ref') continue;
      const { label } = child.meta as { label: string };
      if (!electric.footnoteDefs.has(label)) {
        child.type = 'text';
        child.tag = '';
        child.content = `[^${label}]`;
        child.meta = null;
        continue;
      }
      if (!electric.footnoteNumbers.has(label)) {
        electric.footnoteNumbers.set(label, electric.footnoteNumbers.size + 1);
        electric.footnoteOrder.push(label);
      }
      const base = slug(label);
      child.meta = {
        label,
        number: electric.footnoteNumbers.get(label),
        target: `${prefix}fn-${base}`,
        refId: `${prefix}fnref-${base}`,
      } satisfies FootnoteRefMeta;
    }
  }

  if (electric.footnoteOrder.length === 0) return;

  state.tokens.push(new state.Token('electric_footnotes_open', 'ol', 1));
  for (const label of electric.footnoteOrder) {
    const base = slug(label);
    const itemOpen = new state.Token('electric_footnote_item_open', 'li', 1);
    itemOpen.meta = { id: `${prefix}fn-${base}` };
    state.tokens.push(itemOpen);
    const inline = new state.Token('inline', '', 0);
    const content = electric.footnoteDefs.get(label) ?? '';
    inline.content = content;
    inline.children = [];
    // The inline phase has already run, so definition bodies are parsed here.
    state.md.inline.parse(content, state.md, state.env, inline.children);
    state.tokens.push(inline);
    const back = new state.Token('electric_footnote_back', 'a', 0);
    back.meta = { refId: `${prefix}fnref-${base}` };
    state.tokens.push(back);
    state.tokens.push(new state.Token('electric_footnote_item_close', 'li', -1));
  }
  state.tokens.push(new state.Token('electric_footnotes_close', 'ol', -1));
}

const BADGE_TONES = {
  HIGH: 'b-success',
  MED: 'b-warning',
  LOW: 'b-danger',
} as const;

type BadgeLevel = keyof typeof BADGE_TONES;

function electricConfidenceBadges(state: StateCore): void {
  for (let index = 0; index < state.tokens.length; index += 1) {
    const inline = state.tokens[index];
    if (inline.type !== 'inline' || !inline.children) continue;
    const children = inline.children;
    // Emphasis parsing can leave an empty text artifact ahead of strong_open.
    let offset = 0;
    while (
      offset < children.length &&
      children[offset].type === 'text' &&
      children[offset].content === ''
    ) {
      offset += 1;
    }
    const [strongOpen, text, strongClose] = children.slice(offset);
    if (
      strongOpen?.type !== 'strong_open' ||
      text?.type !== 'text' ||
      strongClose?.type !== 'strong_close'
    ) {
      continue;
    }
    const match = /^\[(HIGH|MED|LOW)\]$/.exec(text.content);
    if (!match) continue;

    let itemIndex = index - 1;
    while (itemIndex >= 0 && state.tokens[itemIndex].type !== 'list_item_open') {
      if (state.tokens[itemIndex].type === 'list_item_close') break;
      itemIndex -= 1;
    }
    if (itemIndex < 0 || state.tokens[itemIndex].type !== 'list_item_open') continue;

    const badge = new state.Token('electric_badge', 'span', 0);
    badge.meta = { level: match[1] as BadgeLevel };
    children.splice(offset, 3, badge);
  }
}

function electricBlueprint(state: StateCore): void {
  const env = state.env as ElectricEnv;
  const blueprint = env.electricBlueprint;
  if (!blueprint) return;

  const byTitle = new Map<string, BlueprintSectionDef>();
  for (const definition of blueprint.sections) {
    byTitle.set(normalizeBlueprintHeading(definition.title), definition);
    for (const alias of definition.aliases ?? []) {
      byTitle.set(normalizeBlueprintHeading(alias), definition);
    }
  }

  const prefix = env.idPrefix ? `${env.idPrefix}-` : '';
  const used = new Set<string>();
  const sectionAt = new Map<number, BlueprintSectionDef>();
  const idAt = new Map<number, string>();
  const headings: (BlueprintHeading & { tokenIndex: number })[] = [];

  for (let index = 0; index < state.tokens.length; index += 1) {
    const token = state.tokens[index];
    if (token.type !== 'heading_open') continue;
    const inline = state.tokens[index + 1];
    const text = inline && inline.type === 'inline' ? inline.content : '';
    const level = Number(token.tag.slice(1)) || 1;
    let definition = level === 2 ? byTitle.get(normalizeBlueprintHeading(text)) : undefined;
    let id: string;
    if (definition) {
      id = `${prefix}${definition.id}`;
      if (used.has(id)) {
        definition = undefined;
        id = `${prefix}${slugify(text, used)}`;
      } else {
        used.add(id);
      }
    } else {
      id = `${prefix}${slugify(text, used)}`;
    }
    if (level === 2) token.attrJoin('class', 'section');
    token.attrSet('id', id);
    if (definition) {
      sectionAt.set(index, definition);
      idAt.set(index, id);
    }
    headings.push({ level, id, text, section: definition?.id ?? null, tokenIndex: index });
  }

  const dropped = new Set<number>();
  const toc: BlueprintTocEntry[] = [];
  const presentSections: string[] = [];

  for (const [index, definition] of sectionAt) {
    let hasContent = false;
    for (let cursor = index + 3; cursor < state.tokens.length; cursor += 1) {
      const token = state.tokens[cursor];
      if (token.type === 'heading_open' && (Number(token.tag.slice(1)) || 1) <= 2) break;
      if (token.type !== 'heading_close') {
        hasContent = true;
        break;
      }
    }
    if (hasContent) {
      toc.push({
        level: 2,
        id: idAt.get(index) ?? `${prefix}${definition.id}`,
        text: definition.title,
      });
      presentSections.push(definition.id);
    } else {
      dropped.add(index);
      dropped.add(index + 1);
      dropped.add(index + 2);
    }
  }

  if (dropped.size > 0) {
    state.tokens = state.tokens.filter((_, index) => !dropped.has(index));
  }

  let words = 0;
  for (const token of state.tokens) {
    if (token.type === 'inline') {
      words += token.content.split(/\s+/).filter(Boolean).length;
    }
  }

  env.electricResult = {
    toc,
    headings: headings
      .filter((heading) => !dropped.has(heading.tokenIndex))
      .map(({ level, id, text, section }) => ({ level, id, text, section })),
    presentSections,
    words,
  };
}

export function registerElectric(md: MarkdownIt): void {
  md.block.ruler.before('reference', 'electric_footnote_def', electricFootnoteDefinition, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.block.ruler.before('paragraph', 'electric_container', electricContainer, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });
  md.inline.ruler.before('link', 'electric_footnote_ref', electricFootnoteReference);
  md.core.ruler.after('inline', 'electric_badges', electricConfidenceBadges);
  md.core.ruler.after('electric_badges', 'electric_footnotes', electricFootnotes);
  md.core.ruler.push('electric_blueprint', electricBlueprint);

  md.renderer.rules.electric_callout_open = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { tone: CalloutTone; label: string };
    const definition = CALLOUT_TONES[meta.tone];
    return `<div class="callout c-${meta.tone}">${icon(definition.icon)}<div><strong class="label">${escapeHtml(meta.label)}</strong>\n`;
  };
  md.renderer.rules.electric_callout_close = (): string => '</div></div>\n';

  md.renderer.rules.electric_evidence_open = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { src: string };
    const source =
      meta.src === '' ? '' : `<div class="src">${icon('doc')}${escapeHtml(meta.src)}</div>\n`;
    return `<div class="evidence">${source}`;
  };
  md.renderer.rules.electric_evidence_close = (): string => '</div>\n';

  md.renderer.rules.electric_details_open = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { title: string };
    return `<details class="ds"><summary>${escapeHtml(meta.title)}</summary><div class="body">\n`;
  };
  md.renderer.rules.electric_details_close = (): string => '</div></details>\n';

  md.renderer.rules.electric_timeline_open = (): string => '<ul class="timeline">\n';
  md.renderer.rules.electric_timeline_item_open = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { tone: TimelineTone | null };
    return meta.tone ? `<li class="${meta.tone}">` : '<li>';
  };
  md.renderer.rules.electric_timeline_when = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { when: string };
    return `<span class="when">${escapeHtml(meta.when)}</span>`;
  };
  md.renderer.rules.electric_timeline_what_open = (): string => '<span class="what">';
  md.renderer.rules.electric_timeline_what_close = (): string => '</span>';
  md.renderer.rules.electric_timeline_item_close = (): string => '</li>\n';
  md.renderer.rules.electric_timeline_close = (): string => '</ul>\n';

  md.renderer.rules.electric_filetree_open = (): string => '<div class="filetree">\n';
  md.renderer.rules.electric_filetree_line = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as FiletreeLine;
    return `<div class="${meta.kind}">${'&nbsp;'.repeat(meta.indent)}${escapeHtml(meta.text)}</div>\n`;
  };
  md.renderer.rules.electric_filetree_close = (): string => '</div>\n';

  md.renderer.rules.electric_flow_open = (): string => '<div class="flow">';
  md.renderer.rules.electric_flow_node = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as FlowNode;
    const tone = meta.tone ? ` n-${meta.tone}` : '';
    return `<span class="node${tone}">${escapeHtml(meta.label)}</span>`;
  };
  md.renderer.rules.electric_flow_edge = (): string => '<span class="edge"></span>';
  md.renderer.rules.electric_flow_close = (): string => '</div>\n';

  md.renderer.rules.electric_meter = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as MeterSpec;
    const tone = meta.tone === 'primary' ? '' : ` m-${meta.tone}`;
    return `<div class="meter${tone}" role="img" aria-label="${escapeHtml(meta.label)}: ${meta.value}%"><div class="meter-head"><span>${escapeHtml(meta.label)}</span><span class="val">${meta.value}%</span></div><div class="track"><div class="fill" style="width: ${meta.value}%"></div></div></div>\n`;
  };

  md.renderer.rules.electric_footnote_ref = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as FootnoteRefMeta | null;
    if (!meta || meta.number === undefined || !meta.target || !meta.refId) {
      return escapeHtml(`[^${meta?.label ?? ''}]`);
    }
    return `<sup class="fn"><a href="#${meta.target}" id="${meta.refId}">${meta.number}</a></sup>`;
  };
  md.renderer.rules.electric_footnotes_open = (): string => '<ol class="footnotes">\n';
  md.renderer.rules.electric_footnote_item_open = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { id: string };
    return `<li id="${meta.id}">`;
  };
  md.renderer.rules.electric_footnote_back = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { refId: string };
    return ` <a href="#${meta.refId}" aria-label="Back to reference">&#8617;</a>`;
  };
  md.renderer.rules.electric_footnote_item_close = (): string => '</li>\n';
  md.renderer.rules.electric_footnotes_close = (): string => '</ol>\n';

  md.renderer.rules.electric_badge = (tokens: Token[], index: number): string => {
    const meta = tokens[index].meta as { level: BadgeLevel };
    return `<span class="badge confidence ${BADGE_TONES[meta.level]}">${meta.level}</span>`;
  };
}
