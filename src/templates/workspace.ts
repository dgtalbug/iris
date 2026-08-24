import type { OpenSpecSnapshot } from '../lib/openspec-workspace.js';
import type { ResearchItem, ResearchWarning } from '../lib/research-workspace.js';
import type { AgentSurfaceReport } from '../lib/agent-skills.js';
import type { ProjectDocItem, ProjectDocWarning } from '../lib/project-docs.js';
import { firstMermaidFence } from '../lib/project-docs.js';
import { renderSafeMarkdown } from '../lib/markdown.js';
import { COMMAND_GROUPS } from '../lib/command-catalog.js';
import { escapeHtml, projectDocMeta, type DashboardPage } from './common.js';
import { renderShell, type NavCounts } from './shell.js';
import { commandsPageContent } from './pages/commands.js';
import { overviewPageContent } from './pages/overview.js';
import { projectDocContent } from './pages/project-doc.js';
import { EMPTY_OPENSPEC_SNAPSHOT, specCounts, specPageContent } from './pages/spec.js';
import {
  capabilityDetailContent,
  changeDetailContent,
  encodeSpecBundle,
  legacyDetailContent,
  legacyDetailSlug,
  specRecordKey,
  type SpecRecord,
} from './pages/spec-detail.js';
import { researchDocumentContent, researchPageContent } from './pages/research.js';
import { workFilterInput, workPageContent } from './pages/work.js';
import type { WorkspaceContext } from './pages/contract-page.js';
import type { IndexCardView } from './pages/index-card.js';

export type WorkspaceModel = {
  projectName: string;
  theme: string;
  pages: DashboardPage[];
  research: ResearchItem[];
  researchWarnings: ResearchWarning[];
  openSpec: OpenSpecSnapshot;
  projectDocs: readonly string[];
  projectDocItems: ProjectDocItem[];
  projectDocWarnings: ProjectDocWarning[];
  agentSurfaces: AgentSurfaceReport[];
  indexCard: IndexCardView;
};

export function emptyWorkspaceModel(projectName = 'iris project'): WorkspaceModel {
  return {
    projectName,
    theme: 'dark',
    pages: [],
    research: [],
    researchWarnings: [],
    openSpec: EMPTY_OPENSPEC_SNAPSHOT,
    projectDocs: [],
    projectDocItems: [],
    projectDocWarnings: [],
    agentSurfaces: [],
    indexCard: { status: 'disabled' },
  };
}

export function navCounts(model: WorkspaceModel): NavCounts {
  return {
    work: model.pages.length,
    spec: model.openSpec.canonical_specs.length + model.openSpec.active_changes.length,
    research: model.research.length,
    commands: COMMAND_GROUPS.reduce((total, group) => total + group.entries.length, 0),
  };
}

export function workspaceContext(model: WorkspaceModel): WorkspaceContext {
  return {
    projectName: model.projectName,
    theme: model.theme,
    counts: navCounts(model),
    projectDocs: model.projectDocs,
  };
}

type SectionOptions = {
  current: Parameters<typeof renderShell>[0]['current'];
  title: string;
  crumbLabel: string;
  content: string;
  topbar?: string;
  drawer?: boolean;
  mermaid?: boolean;
  extraScripts?: string[];
};

function section(model: WorkspaceModel, options: SectionOptions): string {
  return renderShell({
    current: options.current,
    depth: 0,
    title: options.title,
    projectName: model.projectName,
    theme: model.theme,
    counts: navCounts(model),
    projectDocs: model.projectDocs,
    crumbs: [{ label: 'iris', href: './index.html' }, { label: options.crumbLabel }],
    content: options.content,
    topbar: options.topbar,
    drawer: options.drawer,
    mermaid: options.mermaid,
    extraScripts: options.extraScripts,
  });
}

export function overviewHtml(model: WorkspaceModel): string {
  const hld = model.projectDocItems.find((item) => item.name === 'hld');
  const fence = hld ? firstMermaidFence(hld.body) : null;
  const hldDiagram = fence === null ? '' : renderSafeMarkdown('```mermaid\n' + fence + '\n```');
  return section(model, {
    current: 'overview',
    title: model.projectName,
    crumbLabel: 'Overview',
    drawer: true,
    mermaid: hldDiagram !== '',
    content: overviewPageContent({
      projectName: model.projectName,
      pages: model.pages,
      spec: specCounts(model.openSpec),
      activeChanges: model.openSpec.active_changes,
      researchCount: model.research.length,
      projectDocs: model.projectDocs,
      hldDiagram,
      indexCard: model.indexCard,
    }),
  });
}

export function workHtml(model: WorkspaceModel): string {
  return section(model, {
    current: 'work',
    title: 'Work',
    crumbLabel: 'Work',
    drawer: true,
    topbar: workFilterInput(),
    content: workPageContent(model.pages),
  });
}

export function specHtml(model: WorkspaceModel): string {
  return section(model, {
    current: 'spec',
    title: 'Spec',
    crumbLabel: 'Spec',
    mermaid: true,
    extraScripts: [SPEC_BUNDLE_FILE],
    content: specPageContent(model.openSpec),
  });
}

export function researchHtml(model: WorkspaceModel): string {
  return section(model, {
    current: 'research',
    title: 'Research',
    crumbLabel: 'Research',
    content: researchPageContent(
      model.research,
      model.researchWarnings,
      (item) => `./research/${item.id}/page.html`,
    ),
  });
}

export function commandsHtml(model: WorkspaceModel): string {
  return section(model, {
    current: 'commands',
    title: 'Commands',
    crumbLabel: 'Commands',
    content: commandsPageContent(model.agentSurfaces, model.indexCard),
  });
}

export function researchDocumentHtml(model: WorkspaceModel, item: ResearchItem): string {
  return renderShell({
    current: 'research',
    depth: 2,
    title: item.title,
    projectName: model.projectName,
    theme: model.theme,
    counts: navCounts(model),
    projectDocs: model.projectDocs,
    crumbs: [
      { label: 'iris', href: '../../index.html' },
      { label: 'Research', href: '../../research.html' },
      { label: item.id },
    ],
    content: researchDocumentContent(item),
    mermaid: true,
    footerHints: `rendered from ${item.path} · <kbd>t</kbd> theme · <kbd>b</kbd> sidebar`,
  });
}

export function projectDocHtml(model: WorkspaceModel, item: ProjectDocItem): string {
  const meta = projectDocMeta(item.name);
  return renderShell({
    current: `project:${item.name}`,
    depth: 1,
    title: item.title,
    projectName: model.projectName,
    theme: model.theme,
    counts: navCounts(model),
    projectDocs: model.projectDocs,
    crumbs: [
      { label: 'iris', href: '../index.html' },
      { label: 'project docs' },
      { label: meta.label },
    ],
    content: projectDocContent(item, model.projectDocs),
    mermaid: true,
    footerHints: `rendered from ${escapeHtml(item.path)} · managed by iris · <kbd>t</kbd> theme · <kbd>b</kbd> sidebar`,
  }).replace('<html lang="en"', '<html lang="en" data-iris-managed');
}

export const SPEC_BUNDLE_FILE = 'spec/data.js';

/** One record per canonical spec, change, and legacy archive, keyed by kind and name. */
export function specRecords(model: WorkspaceModel): Record<string, SpecRecord> {
  const records: Record<string, SpecRecord> = {};

  for (const capability of model.openSpec.canonical_specs) {
    records[specRecordKey('capability', capability.capability)] = {
      kind: 'capability',
      name: capability.capability,
      title: capability.capability,
      path: capability.path,
      html: capabilityDetailContent(capability, 'canonical spec'),
    };
  }

  for (const change of [...model.openSpec.active_changes, ...model.openSpec.archived_changes]) {
    records[specRecordKey('change', change.name)] = {
      kind: 'change',
      name: change.name,
      title: change.name,
      path: change.path,
      html: changeDetailContent(change),
    };
  }

  for (const document of model.openSpec.legacy_archives) {
    const name = legacyDetailSlug(document);
    records[specRecordKey('legacy', name)] = {
      kind: 'legacy',
      name,
      title: document.title,
      path: document.path,
      html: legacyDetailContent(document),
    };
  }

  return records;
}

export function specBundle(model: WorkspaceModel): string {
  return encodeSpecBundle(specRecords(model));
}

export const SECTION_FILES = [
  'index.html',
  'work.html',
  'spec.html',
  'research.html',
  'commands.html',
] as const;

/** Relative path inside `iris/` to generated HTML for every section page. */
export function renderSectionPages(model: WorkspaceModel): Record<string, string> {
  return {
    'index.html': overviewHtml(model),
    'work.html': workHtml(model),
    'spec.html': specHtml(model),
    'research.html': researchHtml(model),
    'commands.html': commandsHtml(model),
    [SPEC_BUNDLE_FILE]: specBundle(model),
    ...Object.fromEntries(
      model.projectDocItems.map((item) => [
        `project/${item.name}.html`,
        projectDocHtml(model, item),
      ]),
    ),
  };
}
