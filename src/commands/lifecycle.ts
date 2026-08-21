import { existsSync } from 'node:fs';
import { readFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { installAgentSkills, type SkillInstallResult } from '../lib/agent-skills.js';
import { loadProjectState, saveProjectState } from '../lib/project-state.js';
import {
  BASE_COMPONENTS_CSS,
  BASE_COMPONENTS_JS,
  PROJECT_DOC_NAMES,
  projectPlaceholderHtml,
  TOKENS_CSS,
} from '../templates/design.js';
import { refreshDashboard, runRenderCommand } from './render.js';

const MANAGED_TASK_LABEL = 'iris: open dashboard';
const LEGACY_PENDING_STUB = '<!doctype html><title>pending</title>\n';

async function refreshProjectPlaceholders(cwd: string): Promise<void> {
  for (const name of PROJECT_DOC_NAMES) {
    const pagePath = path.join(cwd, 'iris', 'project', `${name}.html`);
    if (existsSync(pagePath)) {
      const current = await readFile(pagePath, 'utf8');
      if (current !== LEGACY_PENDING_STUB && !current.includes('data-iris-managed')) continue;
    }
    await writeAlways(pagePath, projectPlaceholderHtml(name));
  }
}

export async function updateManagedSurfaces(cwd: string): Promise<SkillInstallResult> {
  await writeAlways(path.join(cwd, 'iris', 'design', 'tokens.css'), TOKENS_CSS);
  await writeAlways(
    path.join(cwd, 'iris', 'design', 'components', 'base.css'),
    BASE_COMPONENTS_CSS,
  );
  await writeAlways(path.join(cwd, 'iris', 'design', 'components', 'base.js'), BASE_COMPONENTS_JS);
  await refreshProjectPlaceholders(cwd);

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

  return installAgentSkills(cwd);
}

function assertSkillInstallComplete(result: SkillInstallResult): void {
  if (result.conflicts.length === 0) return;
  const details = result.conflicts
    .map((conflict) => `${conflict.path}: ${conflict.reason}`)
    .join('; ');
  throw new IrisError(1, `Iris agent skill setup is incomplete; ${details}`);
}

export async function runArchiveCommand(cwd: string, id?: string): Promise<void> {
  if (!id) throw new IrisError(1, "Missing id for command 'archive'");
  const state = await loadProjectState(cwd);
  const source = path.join(cwd, 'iris', 'pages', id);
  const destination = path.join(cwd, 'iris', 'archive', id);
  if (!existsSync(source)) throw new IrisError(1, `Page '${id}' does not exist`);
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

export async function runUpdateCommand(cwd: string): Promise<void> {
  await loadProjectState(cwd);
  const skills = await updateManagedSurfaces(cwd);
  await refreshDashboard(cwd);
  assertSkillInstallComplete(skills);
  process.stdout.write('updated managed iris surfaces and agent skills; preserved user-owned content\n');
}

export { assertSkillInstallComplete };
