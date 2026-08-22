import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { packageRoot } from './package-info.js';
import { parseFrontMatter } from './front-matter.js';
import { PROJECT_DOC_NAMES, projectDocMeta } from '../templates/common.js';

export type ProjectDocName = (typeof PROJECT_DOC_NAMES)[number];

const PROJECT_PLACEHOLDER = /__PROJECT__/g;

export function projectDocsRoot(cwd: string): string {
  return path.join(cwd, 'iris', 'project');
}

export function projectDocSourcePath(cwd: string, name: ProjectDocName): string {
  return path.join(projectDocsRoot(cwd), `${name}.md`);
}

export function projectDocOutputPath(cwd: string, name: ProjectDocName): string {
  return path.join(projectDocsRoot(cwd), `${name}.html`);
}

/** The packaged Markdown skeleton for one project doc with the project name filled in. */
export async function projectDocSkeleton(
  name: ProjectDocName,
  projectName: string,
): Promise<string> {
  const template = await readFile(
    path.join(packageRoot(), 'templates', 'project', `${name}.md`),
    'utf8',
  );
  // The name lands inside double-quoted Mermaid labels; a quote would end the label early.
  const safeName = projectName.replace(/"/g, "'");
  return template.replace(PROJECT_PLACEHOLDER, () => safeName);
}

const MAX_SOURCE_BYTES = 256 * 1024;

export type ProjectDocWarning = { code: string; path: string; message: string };

export type ProjectDocItem = {
  name: ProjectDocName;
  path: string;
  title: string;
  status: string;
  agent: string;
  updated: string;
  body: string;
  warnings: ProjectDocWarning[];
};

export type ProjectDocsSnapshot = { items: ProjectDocItem[]; warnings: ProjectDocWarning[] };

function titleFromBody(body: string): string | null {
  for (const line of body.split('\n')) {
    const heading = line.match(/^#[ \t]+(.+?)[ \t]*$/);
    if (heading) return heading[1].trim();
  }
  return null;
}

/** The source of the first exact ` ```mermaid ` fence, or null when the body has none. */
export function firstMermaidFence(body: string): string | null {
  const match = body.match(/^```mermaid[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/m);
  return match ? match[1] : null;
}

export async function loadProjectDocs(cwd: string): Promise<ProjectDocsSnapshot> {
  const items: ProjectDocItem[] = [];
  const warnings: ProjectDocWarning[] = [];

  for (const name of PROJECT_DOC_NAMES) {
    const sourcePath = projectDocSourcePath(cwd, name);
    const relativePath = `iris/project/${name}.md`;

    let info;
    try {
      info = await lstat(sourcePath);
    } catch {
      continue;
    }
    if (info.isSymbolicLink()) {
      warnings.push({
        code: 'symlink',
        path: relativePath,
        message: 'symlinked project doc sources are not read',
      });
      continue;
    }
    if (info.size > MAX_SOURCE_BYTES) {
      warnings.push({
        code: 'too-large',
        path: relativePath,
        message: `source exceeds ${MAX_SOURCE_BYTES} bytes and was skipped`,
      });
      continue;
    }

    let source: string;
    try {
      source = await readFile(sourcePath, 'utf8');
    } catch (error) {
      warnings.push({ code: 'unreadable', path: relativePath, message: (error as Error).message });
      continue;
    }

    const parsed = parseFrontMatter(source);
    const item: ProjectDocItem = {
      name,
      path: relativePath,
      title: parsed.data.title ?? titleFromBody(parsed.body) ?? projectDocMeta(name).label,
      status: parsed.data.status ?? 'draft',
      agent: parsed.data.agent ?? 'not set',
      updated: parsed.data.updated ?? 'not set',
      body: parsed.body,
      warnings: parsed.warnings.map((message) => ({
        code: 'front-matter',
        path: relativePath,
        message,
      })),
    };
    items.push(item);
    warnings.push(...item.warnings);
  }

  return { items, warnings };
}
