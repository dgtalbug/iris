import type { OpenSpecSnapshot } from '../lib/openspec-workspace.js';
import type { ResearchItem, ResearchWarning } from '../lib/research-workspace.js';
import { COMMAND_GROUPS } from '../lib/command-catalog.js';
import type { DashboardPage } from './common.js';
import { renderShell, type NavCounts } from './shell.js';
import { commandsPageContent } from './pages/commands.js';
import { overviewPageContent } from './pages/overview.js';
import { EMPTY_OPENSPEC_SNAPSHOT, specCounts, specPageContent } from './pages/spec.js';
import { researchDocumentContent, researchPageContent } from './pages/research.js';
import { workFilterInput, workPageContent } from './pages/work.js';
import type { WorkspaceContext } from './pages/contract-page.js';

export type WorkspaceModel = {
  projectName: string;
  theme: string;
  pages: DashboardPage[];
  research: ResearchItem[];
  researchWarnings: ResearchWarning[];
  openSpec: OpenSpecSnapshot;
  projectDocs: readonly string[];
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
  };
}

export function navCounts(model: WorkspaceModel): NavCounts {
  return {
    work: model.pages.length,
    spec: model.openSpec.active_changes.length,
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
  });
}

export function overviewHtml(model: WorkspaceModel): string {
  return section(model, {
    current: 'overview',
    title: model.projectName,
    crumbLabel: 'Overview',
    drawer: true,
    content: overviewPageContent({
      projectName: model.projectName,
      pages: model.pages,
      spec: specCounts(model.openSpec),
      activeChanges: model.openSpec.active_changes,
      researchCount: model.research.length,
      projectDocs: model.projectDocs,
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
    content: commandsPageContent(),
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
  };
}
