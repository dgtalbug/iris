import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { writeAlways } from './fs.js';
import {
  computeStaleness,
  readIndexPointer,
  type IndexPointer,
  type StalenessHint,
} from './indexing.js';
import { type PageRegistryEntry, type ProjectState } from './project-state.js';
import {
  irisHome,
  loadRegistry,
  loadUserConfig,
  projectStatePath,
  type RegistryEntry,
} from './user-config.js';
import { BASE_COMPONENTS_CSS, BASE_COMPONENTS_JS, TOKENS_CSS } from '../templates/design.js';
import { renderGlobalDashboardHtml } from '../templates/pages/global-dashboard.js';

const RECENT_LIMIT = 5;

export function globalDashboardPath(): string {
  return path.join(irisHome(), 'dashboard.html');
}

export function globalDesignRoot(): string {
  return path.join(irisHome(), 'design');
}

export type GlobalProjectIndexStatus =
  | { present: false }
  | {
      present: true;
      enabled: boolean;
      symbols: number | null;
      flows: number | null;
      staleness: StalenessHint | null;
    };

export type GlobalProjectActivity = {
  id: string;
  type: string;
  title: string;
  status: PageRegistryEntry['status'];
};

export type GlobalProjectEntry = {
  id: string;
  name: string;
  root: string;
  remote: string | null;
  lastSeen: string;
  stale: boolean;
  pageCounts: { total: number; active: number; archived: number };
  recentActivity: GlobalProjectActivity[];
  indexStatus: GlobalProjectIndexStatus;
  dashboardHref: string;
};

export type GlobalDashboardModel = {
  theme: string;
  projects: GlobalProjectEntry[];
  projectCount: number;
  totalPages: number;
};

function pageCounts(state: ProjectState | null): GlobalProjectEntry['pageCounts'] {
  const entries = Object.values(state?.page_index ?? {});
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.status === 'active').length,
    archived: entries.filter((entry) => entry.status === 'archived').length,
  };
}

function recentActivity(state: ProjectState | null): GlobalProjectActivity[] {
  return Object.values(state?.page_index ?? {})
    .sort((left, right) => right.title.localeCompare(left.title) || right.id.localeCompare(left.id))
    .slice(0, RECENT_LIMIT)
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      title: entry.title,
      status: entry.status,
    }));
}

async function loadProjectStateById(projectId: string): Promise<ProjectState | null> {
  const stateFile = projectStatePath(projectId);
  if (!existsSync(stateFile)) return null;
  try {
    return (await readProjectStateFile(stateFile)).state;
  } catch {
    return null;
  }
}

async function readProjectStateFile(stateFile: string): Promise<{ state: ProjectState }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(stateFile, 'utf8'));
  } catch {
    return { state: { version: 2, page_index: {} } };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { state: { version: 2, page_index: {} } };
  }
  const value = parsed as Record<string, unknown>;
  if (value.version === 2 && value.page_index && typeof value.page_index === 'object') {
    const pageIndex = value.page_index as Record<string, unknown>;
    const normalized: Record<string, PageRegistryEntry> = {};
    for (const [id, raw] of Object.entries(pageIndex)) {
      const entry = raw as Record<string, unknown>;
      normalized[id] = {
        id: typeof entry.id === 'string' ? entry.id : id,
        type: typeof entry.type === 'string' ? entry.type : 'page',
        title: typeof entry.title === 'string' ? entry.title : id,
        status: entry.status === 'archived' ? 'archived' : 'active',
      };
    }
    return { state: { version: 2, page_index: normalized } };
  }
  return { state: { version: 2, page_index: {} } };
}

async function indexStatusForProject(
  entry: RegistryEntry,
  stale: boolean,
  pointer: IndexPointer | null,
): Promise<GlobalProjectIndexStatus> {
  if (!pointer) return { present: false };
  if (!pointer.enabled) {
    return {
      present: true,
      enabled: false,
      symbols: null,
      flows: null,
      staleness: null,
    };
  }
  let staleness: StalenessHint | null = null;
  if (!stale && existsSync(entry.root)) {
    try {
      staleness = await computeStaleness(entry.root, pointer);
    } catch {
      staleness = null;
    }
  }
  return {
    present: true,
    enabled: true,
    symbols: pointer.symbols,
    flows: pointer.flows,
    staleness,
  };
}

async function projectEntryFromRegistry(entry: RegistryEntry): Promise<GlobalProjectEntry> {
  const stale = !existsSync(entry.root);
  const state = await loadProjectStateById(entry.id);
  const pointer = await readIndexPointer(entry.id);
  return {
    id: entry.id,
    name: entry.name,
    root: entry.root,
    remote: entry.remote,
    lastSeen: entry.lastSeen,
    stale,
    pageCounts: pageCounts(state),
    recentActivity: recentActivity(state),
    indexStatus: await indexStatusForProject(entry, stale, pointer),
    dashboardHref: path.join(entry.root, 'iris', 'index.html'),
  };
}

function resolveGlobalTheme(configTheme: string): string {
  return configTheme === 'light' ? 'light' : 'dark';
}

/** Aggregate every registered project from ~/.iris/registry.json and per-project state. */
export async function loadGlobalDashboardModel(): Promise<GlobalDashboardModel> {
  const entries = await loadRegistry();
  const projects = await Promise.all(entries.map(projectEntryFromRegistry));
  const totalPages = projects.reduce((sum, project) => sum + project.pageCounts.total, 0);
  const config = await loadUserConfig();
  return {
    theme: resolveGlobalTheme(config.theme),
    projects,
    projectCount: projects.length,
    totalPages,
  };
}

export async function writeGlobalDesignAssets(): Promise<void> {
  const root = globalDesignRoot();
  await writeAlways(path.join(root, 'tokens.css'), TOKENS_CSS);
  await writeAlways(path.join(root, 'components', 'base.css'), BASE_COMPONENTS_CSS);
  await writeAlways(path.join(root, 'components', 'base.js'), BASE_COMPONENTS_JS);
}

/** Regenerate ~/.iris/dashboard.html from the aggregated model. Best-effort; throws on hard failures. */
export async function refreshGlobalDashboard(): Promise<void> {
  const model = await loadGlobalDashboardModel();
  await writeGlobalDesignAssets();
  const html = renderGlobalDashboardHtml(model);
  await writeAlways(globalDashboardPath(), html);
}

/** True when the registry lists more than one project and a global refresh is warranted. */
export async function shouldRefreshGlobalDashboard(): Promise<boolean> {
  return (await loadRegistry()).length > 1;
}
