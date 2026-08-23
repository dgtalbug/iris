import { existsSync } from 'node:fs';
import { readFile, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { installAgentSurfaces, type SkillInstallResult } from '../lib/agent-skills.js';
import {
  projectDocOutputPath,
  projectDocSkeleton,
  projectDocSourcePath,
} from '../lib/project-docs.js';
import { loadProjectState, saveProjectState } from '../lib/project-state.js';
import {
  BASE_COMPONENTS_CSS,
  BASE_COMPONENTS_JS,
  PROJECT_DOC_NAMES,
  RETIRED_PROJECT_DOC_NAMES,
  TOKENS_CSS,
} from '../templates/design.js';
import { refreshDashboard, runRenderCommand } from './render.js';

const MANAGED_TASK_LABEL = 'iris: open dashboard';
const LEGACY_PENDING_STUB = '<!doctype html><title>pending</title>\n';

export type ManagedSurfaceResult = {
  skills: SkillInstallResult;
  scaffoldedProjectDocs: string[];
  userOwnedProjectDocs: string[];
  retiredProjectDocs: string[];
  preservedProjectDocs: string[];
};

function isManaged(content: string): boolean {
  return content === LEGACY_PENDING_STUB || content.includes('data-iris-managed');
}

type ProjectDocRefresh = {
  scaffolded: string[];
  userOwned: string[];
  retired: string[];
  preserved: string[];
};

// Only decides which Markdown sources exist; the dashboard refresh that follows
// renders them. A source always wins, a managed HTML page is superseded by a
// fresh source, and a user-edited HTML page is left alone and reported.
async function refreshProjectDocs(cwd: string): Promise<ProjectDocRefresh> {
  const projectName = path.basename(cwd);
  const scaffolded: string[] = [];
  const userOwned: string[] = [];

  for (const name of PROJECT_DOC_NAMES) {
    const sourcePath = projectDocSourcePath(cwd, name);
    if (existsSync(sourcePath)) continue;
    const outputPath = projectDocOutputPath(cwd, name);
    if (existsSync(outputPath) && !isManaged(await readFile(outputPath, 'utf8'))) {
      userOwned.push(`iris/project/${name}.html`);
      continue;
    }
    await writeAlways(sourcePath, await projectDocSkeleton(name, projectName));
    scaffolded.push(`iris/project/${name}.md`);
  }

  // Retired project docs are removed only when Iris can prove it generated them;
  // anything a user wrote or edited is preserved and reported instead.
  const retired: string[] = [];
  const preserved: string[] = [];
  for (const name of RETIRED_PROJECT_DOC_NAMES) {
    const pagePath = path.join(cwd, 'iris', 'project', `${name}.html`);
    if (!existsSync(pagePath)) continue;
    const current = await readFile(pagePath, 'utf8');
    if (isManaged(current)) {
      await rm(pagePath, { force: true });
      retired.push(`iris/project/${name}.html`);
    } else {
      preserved.push(`iris/project/${name}.html`);
    }
  }

  return { scaffolded, userOwned, retired, preserved };
}

export async function updateManagedSurfaces(
  cwd: string,
  selection: { hosts?: readonly string[] } = {},
): Promise<ManagedSurfaceResult> {
  await writeAlways(path.join(cwd, 'iris', 'design', 'tokens.css'), TOKENS_CSS);
  await writeAlways(
    path.join(cwd, 'iris', 'design', 'components', 'base.css'),
    BASE_COMPONENTS_CSS,
  );
  await writeAlways(path.join(cwd, 'iris', 'design', 'components', 'base.js'), BASE_COMPONENTS_JS);
  const projectDocs = await refreshProjectDocs(cwd);

  const tasksPath = path.join(cwd, '.vscode', 'tasks.json');
  let existing: { version?: string; tasks?: unknown[] } = {};
  if (existsSync(tasksPath)) {
    try {
      existing = JSON.parse(await readFile(tasksPath, 'utf8')) as typeof existing;
    } catch (error) {
      throw new IrisError(
        1,
        `Cannot update ${path.relative(cwd, tasksPath)}: ${(error as Error).message}`,
      );
    }
  }

  const tasks = Array.isArray(existing.tasks)
    ? existing.tasks.filter(
        (task) =>
          !task ||
          typeof task !== 'object' ||
          (task as { label?: string }).label !== MANAGED_TASK_LABEL,
      )
    : [];
  tasks.push({
    label: MANAGED_TASK_LABEL,
    type: 'shell',
    command: 'iris open',
    problemMatcher: [],
  });
  await writeAlways(
    tasksPath,
    `${JSON.stringify({ ...existing, version: '2.0.0', tasks }, null, 2)}\n`,
  );

  return {
    skills: await installAgentSurfaces(cwd, selection),
    scaffoldedProjectDocs: projectDocs.scaffolded,
    userOwnedProjectDocs: projectDocs.userOwned,
    retiredProjectDocs: projectDocs.retired,
    preservedProjectDocs: projectDocs.preserved,
  };
}

function assertSkillInstallComplete(result: SkillInstallResult): void {
  if (result.conflicts.length === 0) return;
  const details = result.conflicts
    .map((conflict) => `${conflict.path}: ${conflict.reason}`)
    .join('; ');
  throw new IrisError(1, `Iris agent surface setup is incomplete; ${details}`);
}

function archiveSourceRoot(cwd: string, id: string): string | undefined {
  for (const root of ['pages', 'research']) {
    const candidate = path.join(cwd, 'iris', root, id);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

export async function runArchiveCommand(cwd: string, id?: string): Promise<void> {
  if (!id) throw new IrisError(1, "Missing id for command 'archive'");
  const state = await loadProjectState(cwd);
  const source = archiveSourceRoot(cwd, id);
  const destination = path.join(cwd, 'iris', 'archive', id);
  if (!source) throw new IrisError(1, `Page '${id}' does not exist`);
  if (existsSync(destination)) {
    throw new IrisError(1, `Archive destination already exists for page '${id}'`);
  }

  await rename(source, destination);
  const prior = state.page_index[id];
  state.page_index[id] = {
    id,
    type: prior?.type ?? 'page',
    title: prior?.title ?? id,
    status: 'archived',
  };
  await saveProjectState(cwd, state);
  await runRenderCommand(cwd);
  process.stdout.write(`archived ${id}\n`);
}

export function reportProjectDocs(surfaces: ManagedSurfaceResult): void {
  for (const created of surfaces.scaffoldedProjectDocs) {
    process.stdout.write(`created ${created}\n`);
  }
  for (const page of surfaces.userOwnedProjectDocs) {
    process.stderr.write(
      `preserved user-owned ${page}; move its content to ${page.replace(/\.html$/, '.md')} to let Iris render it\n`,
    );
  }
  for (const retired of surfaces.retiredProjectDocs) {
    process.stdout.write(`removed retired managed page ${retired}\n`);
  }
  for (const preserved of surfaces.preservedProjectDocs) {
    process.stderr.write(`preserved user-owned ${preserved}; it is no longer generated\n`);
  }
}

export async function runUpdateCommand(cwd: string): Promise<void> {
  await loadProjectState(cwd);
  const surfaces = await updateManagedSurfaces(cwd);
  await refreshDashboard(cwd);
  reportProjectDocs(surfaces);
  assertSkillInstallComplete(surfaces.skills);
  process.stdout.write(
    'updated managed iris surfaces and agent skills; preserved user-owned content\n',
  );
}

export { assertSkillInstallComplete };
