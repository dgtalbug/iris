import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { packageRoot } from './package-info.js';
import { PROJECT_DOC_NAMES } from '../templates/common.js';

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
  return template.replace(PROJECT_PLACEHOLDER, projectName.replace(/"/g, "'"));
}
