import { lstat, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontMatter, type FrontMatter } from './front-matter.js';

export const RESEARCH_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RESEARCH_SOURCE_FILE = 'index.md';

const MAX_FILE_BYTES = 256 * 1024;
const MAX_ITEMS = 500;

export type ResearchWarning = {
  code: string;
  path: string;
  message: string;
};

export type ResearchItem = {
  id: string;
  path: string;
  title: string;
  status: string;
  tags: string[];
  agent: string;
  updated: string;
  body: string;
  warnings: ResearchWarning[];
};

export type ResearchSnapshot = {
  items: ResearchItem[];
  warnings: ResearchWarning[];
};

export function researchRoot(cwd: string): string {
  return path.join(cwd, 'iris', 'research');
}

export function researchSourcePath(cwd: string, id: string): string {
  return path.join(researchRoot(cwd), id, RESEARCH_SOURCE_FILE);
}

function confined(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return (
    relative !== '' &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== '..' &&
    !path.isAbsolute(relative)
  );
}

async function containsSymlink(root: string, target: string): Promise<boolean> {
  const parts = path.relative(root, target).split(path.sep);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function titleFromBody(body: string, id: string): string {
  for (const line of body.split('\n')) {
    const heading = line.match(/^#[ \t]+(.+?)[ \t]*$/);
    if (heading) return heading[1].trim();
  }
  return id;
}

function countWords(body: string): number {
  const words = body.replace(/```[\s\S]*?```/g, ' ').match(/[A-Za-z0-9][A-Za-z0-9'-]*/g);
  return words ? words.length : 0;
}

export function researchEvidence(item: ResearchItem): string {
  const headings = item.body.split('\n').filter((line) => /^#{2,6}[ \t]+\S/.test(line)).length;
  const words = countWords(item.body);
  return `${headings} ${headings === 1 ? 'heading' : 'headings'} · ${words} ${words === 1 ? 'word' : 'words'}`;
}

export function researchDescription(body: string): string {
  for (const block of body.split(/\n{2,}/)) {
    const text = block.trim();
    if (text === '' || text.startsWith('#') || text.startsWith('```')) continue;
    return text.replace(/\s+/g, ' ');
  }
  return '';
}

function fromSource(id: string, relativePath: string, source: string): ResearchItem {
  const parsed = parseFrontMatter(source);
  const front: FrontMatter = parsed.data;
  return {
    id,
    path: relativePath,
    title: front.title ?? titleFromBody(parsed.body, id),
    status: front.status ?? 'draft',
    tags: front.tags,
    agent: front.agent ?? 'not set',
    updated: front.updated ?? 'not set',
    body: parsed.body,
    warnings: parsed.warnings.map((message) => ({
      code: 'front-matter',
      path: relativePath,
      message,
    })),
  };
}

export async function readResearchItem(
  cwd: string,
  id: string,
  sourcePath: string,
): Promise<ResearchItem> {
  const relativePath = path.relative(cwd, sourcePath).split(path.sep).join('/');
  const source = await readFile(sourcePath, 'utf8');
  return fromSource(id, relativePath, source);
}

export async function loadResearchWorkspace(cwd: string): Promise<ResearchSnapshot> {
  const root = researchRoot(cwd);
  const items: ResearchItem[] = [];
  const warnings: ResearchWarning[] = [];

  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return { items, warnings };
  }

  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const id of directories) {
    const relativeDirectory = `iris/research/${id}`;
    if (items.length >= MAX_ITEMS) {
      warnings.push({
        code: 'too-many-items',
        path: 'iris/research',
        message: `more than ${MAX_ITEMS} research directories; the remainder was skipped`,
      });
      break;
    }
    if (!RESEARCH_ID_PATTERN.test(id)) {
      warnings.push({
        code: 'invalid-id',
        path: relativeDirectory,
        message: 'research ids must be lowercase kebab-case; the directory was skipped',
      });
      continue;
    }

    const sourcePath = path.join(root, id, RESEARCH_SOURCE_FILE);
    const relativePath = `${relativeDirectory}/${RESEARCH_SOURCE_FILE}`;

    if (!confined(root, sourcePath)) {
      warnings.push({
        code: 'unsafe-path',
        path: relativeDirectory,
        message: 'path escapes the research root; the directory was skipped',
      });
      continue;
    }
    if (await containsSymlink(root, sourcePath)) {
      warnings.push({
        code: 'symlink',
        path: relativePath,
        message: 'symlinked research sources are not read',
      });
      continue;
    }

    let size: number;
    try {
      size = (await stat(sourcePath)).size;
    } catch {
      warnings.push({
        code: 'missing-source',
        path: relativePath,
        message: 'directory has no index.md; create one with `iris research <id>`',
      });
      continue;
    }
    if (size > MAX_FILE_BYTES) {
      warnings.push({
        code: 'too-large',
        path: relativePath,
        message: `source exceeds ${MAX_FILE_BYTES} bytes and was skipped`,
      });
      continue;
    }

    try {
      items.push(await readResearchItem(cwd, id, sourcePath));
    } catch (error) {
      warnings.push({
        code: 'unreadable',
        path: relativePath,
        message: (error as Error).message,
      });
    }
  }

  for (const item of items) warnings.push(...item.warnings);
  return { items, warnings };
}
