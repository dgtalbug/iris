import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { inspectAgentSurfaces } from '../lib/agent-skills.js';
import { loadOpenSpecSnapshot, writeOpenSpecSnapshot } from '../lib/openspec-workspace.js';
import { loadProjectDocs } from '../lib/project-docs.js';
import {
  loadResearchWorkspace,
  researchSourcePath,
  type ResearchItem,
} from '../lib/research-workspace.js';
import { reportProvenanceWarnings } from '../lib/provenance.js';
import { validateContract } from '../lib/schemas.js';
import { loadProjectState, saveProjectState, type ProjectState } from '../lib/project-state.js';
import { PROJECT_DOC_NAMES, type DashboardPage } from '../templates/common.js';
import { renderContractPage } from '../templates/pages/contract-page.js';
import { researchDashboardPage } from '../templates/pages/research.js';
import {
  renderSectionPages,
  researchDocumentHtml,
  workspaceContext,
  type WorkspaceModel,
} from '../templates/workspace.js';

async function listDirectories(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function markdownText(value: unknown): string {
  const record = asObject(value);
  return typeof record.md === 'string' ? record.md : '';
}

function boundedText(value: string, limit: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

export async function loadWorkspaceTheme(cwd: string): Promise<string> {
  try {
    const config = await readFile(path.join(cwd, 'iris', 'config.yaml'), 'utf8');
    const match = config.match(/^theme:[ \t]*(['"]?)([A-Za-z]+)\1[ \t]*$/m);
    const theme = match?.[2]?.toLowerCase();
    return theme === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function dashboardPageFromPayload(
  pageId: string,
  payload: Record<string, unknown>,
  href: string,
): DashboardPage {
  const type = typeof payload.type === 'string' ? payload.type : 'page';
  const sections = asObject(payload.sections);
  let description = '';
  let evidence = '';
  let priority = 'not set';

  switch (type) {
    case 'bug': {
      description = markdownText(sections.symptom);
      const severity = typeof sections.severity === 'string' ? sections.severity : '';
      priority =
        ({ p0: 'urgent', p1: 'high', p2: 'medium', p3: 'low' } as Record<string, string>)[
          severity
        ] ?? 'not set';
      const events = asObject(sections.timeline).events;
      const eventCount = Array.isArray(events) ? events.length : 0;
      evidence = `${severity || 'severity not set'} · ${eventCount} timeline ${eventCount === 1 ? 'event' : 'events'}`;
      break;
    }
    case 'feature': {
      description = markdownText(sections.goal) || markdownText(sections.problem);
      const tasks = Array.isArray(sections.tasks) ? sections.tasks : [];
      const completed = tasks.filter((task) => asObject(task).done === true).length;
      evidence = `${completed}/${tasks.length} tasks complete`;
      break;
    }
    case 'idea': {
      description = markdownText(sections.proposed) || markdownText(sections.current_state);
      const effortImpact = asObject(sections.effort_impact);
      const effort = typeof effortImpact.effort === 'number' ? effortImpact.effort : 'not set';
      const impact = typeof effortImpact.impact === 'number' ? effortImpact.impact : 'not set';
      evidence = `effort ${effort}/5 · impact ${impact}/5`;
      break;
    }
    case 'plan': {
      description = markdownText(sections.goal);
      const steps = Array.isArray(sections.steps) ? sections.steps : [];
      evidence = `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`;
      break;
    }
    case 'report': {
      const summary = Array.isArray(sections.summary)
        ? sections.summary.filter((item): item is string => typeof item === 'string')
        : [];
      description = summary.join(' ');
      const promotable = Array.isArray(sections.promotable_as) ? sections.promotable_as.length : 0;
      evidence = `${promotable} promotable ${promotable === 1 ? 'type' : 'types'}`;
      break;
    }
  }

  return {
    id: pageId,
    type,
    title: typeof payload.title === 'string' ? payload.title : pageId,
    status: typeof payload.status === 'string' ? payload.status : 'draft',
    href,
    updated:
      typeof payload.updated === 'string'
        ? boundedText(payload.updated.slice(0, 10), 10)
        : 'not set',
    agent: typeof payload.agent === 'string' ? boundedText(payload.agent, 80) : 'not set',
    tags: Array.isArray(payload.tags)
      ? payload.tags
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => boundedText(tag, 80))
          .slice(0, 20)
      : [],
    priority,
    description: boundedText(description, 1200) || 'No description provided.',
    evidence: boundedText(evidence, 300) || 'No evidence summary available.',
  };
}

type CollectedWorkspace = WorkspaceModel & {
  contracts: Array<{ id: string; payload: Record<string, unknown> }>;
};

async function collectWorkspace(cwd: string): Promise<CollectedWorkspace> {
  const irisRoot = path.join(cwd, 'iris');
  const pagesRoot = path.join(irisRoot, 'pages');
  const contracts: Array<{ id: string; payload: Record<string, unknown> }> = [];
  const pages: DashboardPage[] = [];

  for (const pageId of await listDirectories(pagesRoot)) {
    const dataPath = path.join(pagesRoot, pageId, 'data.json');
    if (!existsSync(dataPath)) continue;
    const payload = JSON.parse(await readFile(dataPath, 'utf8')) as Record<string, unknown>;
    const type = typeof payload.type === 'string' ? payload.type : undefined;
    if (!type) continue;
    await validateContract(type as never, payload, dataPath);
    contracts.push({ id: pageId, payload });
    pages.push(dashboardPageFromPayload(pageId, payload, `./pages/${pageId}/page.html`));
  }

  const research = await loadResearchWorkspace(cwd);
  for (const item of research.items) {
    pages.push(researchDashboardPage(item, `./research/${item.id}/page.html`));
  }

  let state: ProjectState | undefined;
  try {
    state = await loadProjectState(cwd);
  } catch {
    state = undefined;
  }
  for (const [pageId, entry] of Object.entries(state?.page_index ?? {})) {
    if (entry.status !== 'archived') continue;
    if (!existsSync(path.join(irisRoot, 'archive', pageId, 'page.html'))) continue;
    pages.push({
      id: pageId,
      type: entry.type,
      title: entry.title,
      status: 'archived',
      href: `./archive/${pageId}/page.html`,
      updated: 'not set',
      agent: 'not set',
      tags: [],
      priority: 'not set',
      description: 'Archived details are available on the full page.',
      evidence: 'Archived metadata is not retained in the dashboard index.',
    });
  }

  const projectDocs = await loadProjectDocs(cwd);

  return {
    projectName: path.basename(cwd),
    theme: await loadWorkspaceTheme(cwd),
    pages,
    research: research.items,
    researchWarnings: research.warnings,
    openSpec: await loadOpenSpecSnapshot(cwd),
    projectDocItems: projectDocs.items,
    projectDocWarnings: projectDocs.warnings,
    projectDocs: PROJECT_DOC_NAMES.filter(
      (name) =>
        projectDocs.items.some((item) => item.name === name) ||
        existsSync(path.join(irisRoot, 'project', `${name}.html`)),
    ),
    agentSurfaces: await inspectAgentSurfaces(cwd),
    contracts,
  };
}

async function writeSectionPages(cwd: string, model: WorkspaceModel): Promise<void> {
  const irisRoot = path.join(cwd, 'iris');
  const files = renderSectionPages(model);
  await Promise.all(
    Object.entries(files).map(([name, html]) => writeAlways(path.join(irisRoot, name), html)),
  );
}

export async function refreshDashboard(cwd: string): Promise<void> {
  const model = await collectWorkspace(cwd);
  await writeSectionPages(cwd, model);
}

function researchItemById(model: CollectedWorkspace, id: string): ResearchItem | undefined {
  return model.research.find((item) => item.id === id);
}

export async function runRenderCommand(
  cwd: string,
  id?: string,
  options: { refreshOpenSpec?: boolean } = {},
): Promise<void> {
  if (options.refreshOpenSpec) await writeOpenSpecSnapshot(cwd);

  const model = await collectWorkspace(cwd);
  for (const warning of model.projectDocWarnings) {
    process.stderr.write(`warning: ${warning.path}: ${warning.message}\n`);
  }
  const context = workspaceContext(model);
  const irisRoot = path.join(cwd, 'iris');

  if (id) {
    const contract = model.contracts.find((entry) => entry.id === id);
    const research = researchItemById(model, id);
    if (!contract && !research) {
      if (existsSync(researchSourcePath(cwd, id))) {
        throw new IrisError(1, `Research page '${id}' could not be read`);
      }
      throw new IrisError(1, `Missing data.json for page '${id}'`);
    }
    if (contract) {
      await writeAlways(
        path.join(irisRoot, 'pages', id, 'page.html'),
        renderContractPage(contract.payload, context),
      );
    }
    if (research) {
      await writeAlways(
        path.join(irisRoot, 'research', id, 'page.html'),
        researchDocumentHtml(model, research),
      );
    }
  } else {
    await Promise.all([
      ...model.contracts.map((entry) =>
        writeAlways(
          path.join(irisRoot, 'pages', entry.id, 'page.html'),
          renderContractPage(entry.payload, context),
        ),
      ),
      ...model.research.map((item) =>
        writeAlways(
          path.join(irisRoot, 'research', item.id, 'page.html'),
          researchDocumentHtml(model, item),
        ),
      ),
    ]);
  }

  try {
    const state = await loadProjectState(cwd);
    const recorded = id
      ? model.contracts
          .filter((entry) => entry.id === id)
          .map((entry) => ({ id: entry.id, type: entry.payload.type, title: entry.payload.title }))
          .concat(
            model.research
              .filter((item) => item.id === id)
              .map((item) => ({ id: item.id, type: 'research', title: item.title })),
          )
      : [
          ...model.contracts.map((entry) => ({
            id: entry.id,
            type: entry.payload.type,
            title: entry.payload.title,
          })),
          ...model.research.map((item) => ({
            id: item.id,
            type: 'research',
            title: item.title,
          })),
        ];
    for (const entry of recorded) {
      const prior = state.page_index[entry.id];
      state.page_index[entry.id] = {
        id: entry.id,
        type: typeof entry.type === 'string' ? entry.type : 'page',
        title: typeof entry.title === 'string' ? entry.title : entry.id,
        status: prior?.status ?? 'active',
      };
    }
    await saveProjectState(cwd, state);
  } catch {
    // Project not initialized; skip state recording.
  }

  await writeSectionPages(cwd, model);

  const rendered = id ? 1 : model.contracts.length + model.research.length;
  if (rendered === 0) {
    process.stdout.write('rendered iris/index.html\n');
  } else {
    process.stdout.write(`rendered ${rendered} page(s)\n`);
  }

  if (!id) await reportProvenanceWarnings(cwd);
}
