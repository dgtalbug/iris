import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { loadOpenSpecSnapshot, writeOpenSpecSnapshot } from '../lib/openspec-workspace.js';
import { validateContract } from '../lib/schemas.js';
import { loadProjectState, saveProjectState, statePath } from '../lib/project-state.js';
import {
  dashboardHtml,
  PROJECT_DOC_NAMES,
  renderContractPage,
  type DashboardPage,
} from '../templates/design.js';

async function listPageIds(pagesRoot: string): Promise<string[]> {
  try {
    const entries = await readdir(pagesRoot, { withFileTypes: true });
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

export async function runRenderCommand(
  cwd: string,
  id?: string,
  options: { refreshOpenSpec?: boolean } = {},
): Promise<void> {
  if (options.refreshOpenSpec) await writeOpenSpecSnapshot(cwd);
  const pagesRoot = path.join(cwd, 'iris', 'pages');
  const allPageIds = await listPageIds(pagesRoot);
  const pageIds = id ? [id] : allPageIds;

  if (pageIds.length === 0) {
    await refreshDashboard(cwd);
    process.stdout.write('rendered iris/index.html\n');
    return;
  }

  for (const pageId of pageIds) {
    const dataPath = path.join(pagesRoot, pageId, 'data.json');
    if (!existsSync(dataPath)) {
      throw new IrisError(1, `Missing data.json for page '${pageId}'`);
    }

    const raw = await readFile(dataPath, 'utf8');
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const type = typeof payload.type === 'string' ? payload.type : undefined;
    if (!type) {
      throw new IrisError(1, `Page '${pageId}' is missing a contract type`);
    }

    await validateContract(type as any, payload, dataPath);

    const pageHtmlPath = path.join(pagesRoot, pageId, 'page.html');
    const html = renderContractPage(payload);
    await writeAlways(pageHtmlPath, html);
  }

  if (existsSync(statePath(cwd))) {
    const state = await loadProjectState(cwd);
    for (const pageId of pageIds) {
      const payload = JSON.parse(
        await readFile(path.join(pagesRoot, pageId, 'data.json'), 'utf8'),
      ) as Record<string, unknown>;
      const prior = state.page_index[pageId];
      state.page_index[pageId] = {
        id: pageId,
        type: typeof payload.type === 'string' ? payload.type : 'page',
        title: typeof payload.title === 'string' ? payload.title : pageId,
        status: prior?.status ?? 'active',
      };
    }
    await saveProjectState(cwd, state);
  }

  await refreshDashboard(cwd);
  process.stdout.write(`rendered ${pageIds.length} page(s)\n`);
}

export async function refreshDashboard(cwd: string): Promise<void> {
  const irisRoot = path.join(cwd, 'iris');
  const pagesRoot = path.join(irisRoot, 'pages');
  const allPageIds = await listPageIds(pagesRoot);
  const renderedPages: DashboardPage[] = [];
  const state = existsSync(statePath(cwd)) ? await loadProjectState(cwd) : undefined;
  for (const pageId of allPageIds) {
    const dataPath = path.join(pagesRoot, pageId, 'data.json');
    if (!existsSync(dataPath)) continue;
    const payload = JSON.parse(await readFile(dataPath, 'utf8')) as Record<string, unknown>;
    const type = typeof payload.type === 'string' ? payload.type : undefined;
    if (!type) continue;
    await validateContract(type as any, payload, dataPath);
    renderedPages.push(dashboardPageFromPayload(pageId, payload, `./pages/${pageId}/page.html`));
  }

  for (const [pageId, entry] of Object.entries(state?.page_index ?? {})) {
    if (entry.status !== 'archived') continue;
    if (!existsSync(path.join(irisRoot, 'archive', pageId, 'page.html'))) continue;
    renderedPages.push({
      id: pageId,
      type: entry.type,
      title: entry.title,
      status: 'archived',
      href: `./archive/${pageId}/page.html`,
      updated: 'not set',
      agent: 'not set',
      tags: [],
      priority: 'not set',
      description: 'Archived contract details are available on the full page.',
      evidence: 'Archived metadata is not retained in the dashboard index.',
    });
  }

  const projectDocs = PROJECT_DOC_NAMES.filter((name) =>
    existsSync(path.join(irisRoot, 'project', `${name}.html`)),
  );

  const indexPath = path.join(irisRoot, 'index.html');
  const openSpec = await loadOpenSpecSnapshot(cwd);
  await writeAlways(
    indexPath,
    dashboardHtml(path.basename(cwd), renderedPages, projectDocs, openSpec),
  );
}
