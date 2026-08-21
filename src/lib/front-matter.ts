export const RESEARCH_STATUSES = ['draft', 'active', 'done', 'archived'] as const;

export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];

export type FrontMatter = {
  title: string | null;
  status: ResearchStatus | null;
  tags: string[];
  agent: string | null;
  updated: string | null;
};

export type FrontMatterResult = {
  data: FrontMatter;
  body: string;
  warnings: string[];
};

const SUPPORTED_KEYS = new Set(['title', 'status', 'tags', 'agent', 'updated']);
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 80;
const MAX_SCALAR_LENGTH = 200;
const DELIMITER = /^---[ \t]*$/;

function emptyFrontMatter(): FrontMatter {
  return { title: null, status: null, tags: [], agent: null, updated: null };
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function bounded(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length <= limit ? normalized : `${normalized.slice(0, limit - 1).trimEnd()}…`;
}

function normalizeTags(values: string[], warnings: string[]): string[] {
  const tags: string[] = [];
  for (const value of values) {
    const tag = bounded(unquote(value), MAX_TAG_LENGTH);
    if (tag === '') continue;
    if (tags.length >= MAX_TAGS) {
      warnings.push(`more than ${MAX_TAGS} tags; extra tags were dropped`);
      break;
    }
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

/**
 * Parses the documented front-matter subset only: `key: scalar`, `key: [a, b]`,
 * and `key:` followed by `- item` lines. Anything else becomes a warning and is
 * ignored rather than guessed at, so a malformed header can never change how the
 * body renders.
 */
export function parseFrontMatter(source: string): FrontMatterResult {
  const normalized = source.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const warnings: string[] = [];

  if (lines.length === 0 || !DELIMITER.test(lines[0] ?? '')) {
    return { data: emptyFrontMatter(), body: normalized, warnings };
  }

  let end = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (DELIMITER.test(lines[index])) {
      end = index;
      break;
    }
  }

  if (end === -1) {
    return {
      data: emptyFrontMatter(),
      body: normalized,
      warnings: [
        'front matter is not closed by a second `---`; the whole file was read as content',
      ],
    };
  }

  const raw: Record<string, string | string[]> = {};
  let currentListKey: string | null = null;

  for (let index = 1; index < end; index += 1) {
    const line = lines[index];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const listItem = line.match(/^[ \t]*-[ \t]+(.*)$/);
    if (listItem) {
      if (currentListKey === null) {
        warnings.push(`line ${index + 1}: list item without a key was ignored`);
        continue;
      }
      const bucket = raw[currentListKey];
      if (Array.isArray(bucket)) bucket.push(listItem[1]);
      continue;
    }

    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*)[ \t]*:[ \t]*(.*)$/);
    if (!pair) {
      warnings.push(`line ${index + 1}: unsupported front-matter syntax was ignored`);
      currentListKey = null;
      continue;
    }

    const key = pair[1].toLowerCase();
    const value = pair[2];
    currentListKey = null;

    if (!SUPPORTED_KEYS.has(key)) continue;

    if (value.trim() === '') {
      raw[key] = [];
      currentListKey = key;
      continue;
    }

    const inlineList = value.trim().match(/^\[(.*)\]$/);
    if (inlineList) {
      raw[key] = inlineList[1]
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
      continue;
    }

    raw[key] = value;
  }

  const data = emptyFrontMatter();

  const title = raw.title;
  if (typeof title === 'string') {
    const value = bounded(unquote(title), MAX_SCALAR_LENGTH);
    if (value !== '') data.title = value;
  } else if (Array.isArray(title)) {
    warnings.push('title must be a single value; it was ignored');
  }

  const status = raw.status;
  if (typeof status === 'string') {
    const value = unquote(status).toLowerCase();
    if ((RESEARCH_STATUSES as readonly string[]).includes(value)) {
      data.status = value as ResearchStatus;
    } else if (value !== '') {
      warnings.push(
        `status '${bounded(value, 40)}' is not one of ${RESEARCH_STATUSES.join(', ')}; using draft`,
      );
    }
  } else if (Array.isArray(status)) {
    warnings.push('status must be a single value; it was ignored');
  }

  const agent = raw.agent;
  if (typeof agent === 'string') {
    const value = bounded(unquote(agent), MAX_TAG_LENGTH);
    if (value !== '') data.agent = value;
  } else if (Array.isArray(agent)) {
    warnings.push('agent must be a single value; it was ignored');
  }

  const updated = raw.updated;
  if (typeof updated === 'string') {
    const value = unquote(updated);
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) data.updated = match[1];
    else if (value !== '')
      warnings.push(`updated '${bounded(value, 40)}' is not an ISO date; it was ignored`);
  } else if (Array.isArray(updated)) {
    warnings.push('updated must be a single value; it was ignored');
  }

  const tags = raw.tags;
  if (Array.isArray(tags)) data.tags = normalizeTags(tags, warnings);
  else if (typeof tags === 'string') data.tags = normalizeTags(tags.split(','), warnings);

  const body = lines
    .slice(end + 1)
    .join('\n')
    .replace(/^\n+/, '');
  return { data, body, warnings };
}
