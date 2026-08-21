/**
 * Barrel for the generated design system. Implementation lives in focused
 * modules; this file keeps one import surface for commands and tests.
 */
export { TOKENS_CSS } from './tokens.js';
export { BASE_COMPONENTS_CSS } from './styles.js';
export { BASE_COMPONENTS_JS } from './script.js';
export {
  apertureGlyph,
  apertureRing,
  escapeHtml,
  priorityClass,
  progressBar,
  PROJECT_DOC_NAMES,
  RETIRED_PROJECT_DOC_NAMES,
  statTile,
  statusClass,
  typeClass,
  WORK_TYPES,
  type DashboardPage,
} from './common.js';
export { assetPrefix, renderShell, type NavCounts, type ShellOptions } from './shell.js';
export {
  DEFAULT_WORKSPACE_CONTEXT,
  projectPlaceholderHtml,
  renderContractPage,
  type WorkspaceContext,
} from './pages/contract-page.js';
export { EMPTY_OPENSPEC_SNAPSHOT, specCounts } from './pages/spec.js';
export { specDetailPath, specDetailDepth } from './pages/spec-detail.js';
export { researchDashboardPage } from './pages/research.js';
export { workStatusCounts } from './pages/work.js';
export {
  commandsHtml,
  emptyWorkspaceModel,
  navCounts,
  overviewHtml,
  renderSectionPages,
  renderSpecDetailPages,
  researchDocumentHtml,
  researchHtml,
  SECTION_FILES,
  specHtml,
  workHtml,
  workspaceContext,
  type WorkspaceModel,
} from './workspace.js';
