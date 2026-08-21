import { randomUUID } from 'node:crypto';
import { existsSync, type Dirent } from 'node:fs';
import { lstat, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from './fs.js';

export const OPENSPEC_MAX_DEPTH = 16;
export const OPENSPEC_MAX_FILES = 1_000;
export const OPENSPEC_MAX_FILE_BYTES = 1024 * 1024;
export const OPENSPEC_MAX_TOTAL_BYTES = 8 * 1024 * 1024;

export type OpenSpecWarning = {
  code: string;
  path: string;
  message: string;
};

export type OpenSpecSourceDocument = {
  path: string;
  title: string;
  raw: string;
  format?: 'markdown' | 'yaml';
  headings: string[];
  requirements: string[];
  scenarios: string[];
  operations: string[];
  warnings: OpenSpecWarning[];
};

export type OpenSpecTaskProgress = {
  complete: number;
  open: number;
  total: number;
};

export type OpenSpecTaskDocument = OpenSpecSourceDocument & {
  progress: OpenSpecTaskProgress;
};

export type OpenSpecCapability = {
  capability: string;
  path: string;
  document: OpenSpecSourceDocument;
};

export type OpenSpecChange = {
  name: string;
  path: string;
  lifecycle: 'active' | 'archived';
  layout: 'structured';
  artifacts: {
    manifest?: OpenSpecSourceDocument;
    proposal?: OpenSpecSourceDocument;
    design?: OpenSpecSourceDocument;
    tasks?: OpenSpecTaskDocument;
  };
  delta_specs: OpenSpecCapability[];
  completeness: 'complete' | 'incomplete' | 'unknown';
  health: 'valid' | 'warning' | 'invalid';
  warnings: OpenSpecWarning[];
};

export type OpenSpecSnapshot = {
  version: 1;
  detected: boolean;
  generated_at: null;
  context: {
    project?: OpenSpecSourceDocument;
    config?: OpenSpecSourceDocument;
  };
  canonical_specs: OpenSpecCapability[];
  active_changes: OpenSpecChange[];
  archived_changes: OpenSpecChange[];
  legacy_archives: OpenSpecSourceDocument[];
  warnings: OpenSpecWarning[];
};

export type OpenSpecParseLimits = {
  maxDepth: number;
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
};

const DEFAULT_LIMITS: OpenSpecParseLimits = {
  maxDepth: OPENSPEC_MAX_DEPTH,
  maxFiles: OPENSPEC_MAX_FILES,
  maxFileBytes: OPENSPEC_MAX_FILE_BYTES,
  maxTotalBytes: OPENSPEC_MAX_TOTAL_BYTES,
};

type ParseBudget = {
  files: number;
  bytes: number;
  exhausted: boolean;
  limits: OpenSpecParseLimits;
};
type DocumentKind = 'artifact' | 'config' | 'legacy' | 'project' | 'spec' | 'tasks';

export function emptyOpenSpecSnapshot(detected = false): OpenSpecSnapshot {
  return {
    version: 1,
    detected,
    generated_at: null,
    context: {},
    canonical_specs: [],
    active_changes: [],
    archived_changes: [],
    legacy_archives: [],
    warnings: [],
  };
}

function warning(code: string, filePath: string, message: string): OpenSpecWarning {
  return { code, path: filePath.replaceAll(path.sep, '/'), message };
}

function confined(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  );
}

function relativeDepth(relativePath: string): number {
  return relativePath.split(/[\\/]/).filter(Boolean).length;
}

async function safeRead(
  root: string,
  relativePath: string,
  budget: ParseBudget,
  warnings: OpenSpecWarning[],
): Promise<string | null> {
  const normalized = relativePath.replaceAll('\\', '/');
  const absolute = path.resolve(root, normalized);
  if (!confined(root, absolute) || normalized.startsWith('/')) {
    warnings.push(
      warning('unsafe-path', normalized, 'Skipped a path outside the supported OpenSpec boundary'),
    );
    return null;
  }
  if (relativeDepth(normalized) > budget.limits.maxDepth) {
    warnings.push(
      warning(
        'depth-limit',
        normalized,
        `Skipped content deeper than ${budget.limits.maxDepth} levels`,
      ),
    );
    return null;
  }
  if (budget.exhausted || budget.files >= budget.limits.maxFiles) {
    budget.exhausted = true;
    warnings.push(
      warning(
        'file-count-limit',
        normalized,
        `Skipped input after ${budget.limits.maxFiles} supported files`,
      ),
    );
    return null;
  }

  let current = root;
  try {
    for (const part of normalized.split('/')) {
      current = path.join(current, part);
      const stat = await lstat(current);
      if (stat.isSymbolicLink()) {
        warnings.push(
          warning('symlink-refused', normalized, 'Skipped a path containing a symbolic link'),
        );
        return null;
      }
    }
    const stat = await lstat(absolute);
    if (!stat.isFile()) {
      warnings.push(warning('unsupported-entry', normalized, 'Expected a regular file'));
      return null;
    }
    if (stat.size > budget.limits.maxFileBytes) {
      warnings.push(
        warning(
          'file-size-limit',
          normalized,
          `Skipped a file larger than ${budget.limits.maxFileBytes} bytes`,
        ),
      );
      return null;
    }
    if (budget.bytes + stat.size > budget.limits.maxTotalBytes) {
      budget.exhausted = true;
      warnings.push(
        warning(
          'total-size-limit',
          normalized,
          `Skipped input beyond ${budget.limits.maxTotalBytes} total bytes`,
        ),
      );
      return null;
    }
    const raw = await readFile(absolute, 'utf8');
    budget.files += 1;
    budget.bytes += Buffer.byteLength(raw);
    return raw;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    warnings.push(
      warning('read-failed', normalized, `Could not read input: ${(error as Error).message}`),
    );
    return null;
  }
}

function parseDocument(
  relativePath: string,
  raw: string,
  kind: DocumentKind,
): OpenSpecSourceDocument {
  const headings: string[] = [];
  const requirements: string[] = [];
  const scenarios: string[] = [];
  const operations: string[] = [];
  const warnings: OpenSpecWarning[] = [];
  let fence: '`' | '~' | null = null;
  let title = path.basename(relativePath, path.extname(relativePath));
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as '`' | '~';
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!heading) continue;
    const text = heading[2].replace(/\s+#+$/, '').trim();
    headings.push(text);
    if (headings.length === 1) title = text.replace(/^(?:Requirement|Scenario):\s*/i, '');
    const requirement = text.match(/^Requirement:\s*(.+)$/i);
    const scenario = text.match(/^Scenario:\s*(.+)$/i);
    const operation = text.match(/^(ADDED|MODIFIED|REMOVED|RENAMED) Requirements$/i);
    if (requirement) requirements.push(requirement[1]);
    if (scenario) scenarios.push(scenario[1]);
    if (operation) operations.push(operation[1].toUpperCase());
  }

  if (fence !== null)
    warnings.push(warning('unclosed-fence', relativePath, 'Markdown fence is not closed'));
  if (kind === 'spec' && requirements.length === 0) {
    warnings.push(
      warning('malformed-spec', relativePath, 'No requirement headings were recognized'),
    );
  }
  if (kind === 'spec' && requirements.length > 0 && scenarios.length === 0) {
    warnings.push(
      warning('malformed-spec', relativePath, 'Requirements have no recognized scenarios'),
    );
  }
  if (kind !== 'config' && raw.trim() === '') {
    warnings.push(warning('empty-document', relativePath, 'The document is empty'));
  }

  return {
    path: relativePath,
    title,
    raw,
    format: kind === 'config' ? 'yaml' : 'markdown',
    headings,
    requirements,
    scenarios,
    operations,
    warnings,
  };
}

function parseTasks(relativePath: string, raw: string): OpenSpecTaskDocument {
  const document = parseDocument(relativePath, raw, 'tasks');
  let fence: '`' | '~' | null = null;
  let complete = 0;
  let open = 0;
  for (const line of raw.split(/\r?\n/)) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0] as '`' | '~';
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const task = line.match(/^\s*[-*+]\s+\[([ xX])\]\s+/);
    if (!task) continue;
    if (task[1].toLowerCase() === 'x') complete += 1;
    else open += 1;
  }
  return { ...document, progress: { complete, open, total: complete + open } };
}

async function safeDirectoryEntries(
  root: string,
  relativePath: string,
  warnings: OpenSpecWarning[],
): Promise<Dirent[]> {
  const absolute = path.resolve(root, relativePath);
  if (!confined(root, absolute) || relativeDepth(relativePath) > OPENSPEC_MAX_DEPTH) {
    warnings.push(
      warning(
        'unsafe-path',
        relativePath,
        'Skipped a directory outside the supported OpenSpec boundary',
      ),
    );
    return [];
  }
  try {
    const stat = await lstat(absolute);
    if (stat.isSymbolicLink()) {
      warnings.push(warning('symlink-refused', relativePath, 'Skipped a symbolic-link directory'));
      return [];
    }
    if (!stat.isDirectory()) return [];
    return (await readdir(absolute, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      warnings.push(
        warning(
          'read-failed',
          relativePath,
          `Could not read directory: ${(error as Error).message}`,
        ),
      );
    }
    return [];
  }
}

async function collectSpecPaths(
  root: string,
  relativeRoot: string,
  warnings: OpenSpecWarning[],
  maxDepth: number,
  depth = 0,
): Promise<string[]> {
  if (depth > maxDepth) {
    warnings.push(
      warning('depth-limit', relativeRoot, `Skipped content deeper than ${maxDepth} levels`),
    );
    return [];
  }
  const results: string[] = [];
  for (const entry of await safeDirectoryEntries(root, relativeRoot, warnings)) {
    const relativePath = path.posix.join(relativeRoot.replaceAll('\\', '/'), entry.name);
    if (entry.isSymbolicLink()) {
      warnings.push(warning('symlink-refused', relativePath, 'Skipped a symbolic-link entry'));
    } else if (entry.isDirectory()) {
      results.push(...(await collectSpecPaths(root, relativePath, warnings, maxDepth, depth + 1)));
    } else if (entry.isFile() && entry.name === 'spec.md') {
      results.push(relativePath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      warnings.push(
        warning(
          'unsupported-entry',
          relativePath,
          'Ignored Markdown outside a supported spec.md path',
        ),
      );
    }
  }
  return results.sort();
}

async function readDocument(
  root: string,
  relativePath: string,
  kind: DocumentKind,
  budget: ParseBudget,
  warnings: OpenSpecWarning[],
): Promise<OpenSpecSourceDocument | null> {
  const raw = await safeRead(root, relativePath, budget, warnings);
  if (raw === null) return null;
  const document = parseDocument(relativePath, raw, kind);
  warnings.push(...document.warnings);
  return document;
}

async function readCapability(
  root: string,
  relativePath: string,
  specsRoot: string,
  budget: ParseBudget,
  warnings: OpenSpecWarning[],
): Promise<OpenSpecCapability | null> {
  const document = await readDocument(root, relativePath, 'spec', budget, warnings);
  if (!document) return null;
  const capability = path.posix.relative(specsRoot, path.posix.dirname(relativePath));
  return { capability, path: relativePath, document };
}

async function readStructuredChange(
  root: string,
  relativeRoot: string,
  lifecycle: 'active' | 'archived',
  budget: ParseBudget,
  globalWarnings: OpenSpecWarning[],
): Promise<OpenSpecChange> {
  const changeWarnings: OpenSpecWarning[] = [];
  const read = (name: string, kind: DocumentKind) =>
    readDocument(root, path.posix.join(relativeRoot, name), kind, budget, changeWarnings);
  const manifest = await read('.openspec.yaml', 'config');
  const proposal = await read('proposal.md', 'artifact');
  const design = await read('design.md', 'artifact');
  const taskSource = await safeRead(
    root,
    path.posix.join(relativeRoot, 'tasks.md'),
    budget,
    changeWarnings,
  );
  const tasks =
    taskSource === null ? null : parseTasks(path.posix.join(relativeRoot, 'tasks.md'), taskSource);
  if (tasks) changeWarnings.push(...tasks.warnings);
  const specsRoot = path.posix.join(relativeRoot, 'specs');
  const delta_specs: OpenSpecCapability[] = [];
  for (const specPath of await collectSpecPaths(
    root,
    specsRoot,
    changeWarnings,
    budget.limits.maxDepth,
  )) {
    const capability = await readCapability(root, specPath, specsRoot, budget, changeWarnings);
    if (capability) delta_specs.push(capability);
  }

  const requiredPresent = Boolean(
    proposal &&
      design &&
      tasks &&
      (delta_specs.length > 0 || /(^|\n)\s*skip_specs:\s*true\s*($|\n)/.test(manifest?.raw ?? '')),
  );
  const completeness = requiredPresent && tasks?.progress.open === 0 ? 'complete' : 'incomplete';
  const invalid = changeWarnings.some((item) => item.code === 'malformed-spec');
  const health = invalid ? 'invalid' : changeWarnings.length > 0 ? 'warning' : 'valid';
  globalWarnings.push(...changeWarnings);
  return {
    name: path.posix.basename(relativeRoot),
    path: relativeRoot,
    lifecycle,
    layout: 'structured',
    artifacts: {
      ...(manifest ? { manifest } : {}),
      ...(proposal ? { proposal } : {}),
      ...(design ? { design } : {}),
      ...(tasks ? { tasks } : {}),
    },
    delta_specs,
    completeness,
    health,
    warnings: changeWarnings,
  };
}

export async function parseOpenSpecWorkspace(
  cwd: string,
  limits: OpenSpecParseLimits = DEFAULT_LIMITS,
): Promise<OpenSpecSnapshot> {
  const root = path.resolve(cwd, 'openspec');
  const snapshot = emptyOpenSpecSnapshot(false);
  if (!existsSync(root)) return snapshot;
  snapshot.detected = true;
  try {
    const rootStat = await lstat(root);
    if (rootStat.isSymbolicLink()) {
      snapshot.warnings.push(
        warning('symlink-refused', 'openspec', 'Skipped a symbolic-link OpenSpec workspace root'),
      );
      return snapshot;
    }
    if (!rootStat.isDirectory()) {
      snapshot.warnings.push(
        warning(
          'unsupported-entry',
          'openspec',
          'Expected the OpenSpec workspace root to be a directory',
        ),
      );
      return snapshot;
    }
  } catch (error) {
    snapshot.warnings.push(
      warning(
        'read-failed',
        'openspec',
        `Could not inspect workspace root: ${(error as Error).message}`,
      ),
    );
    return snapshot;
  }
  const budget: ParseBudget = { files: 0, bytes: 0, exhausted: false, limits };

  try {
    const rootStat = await lstat(root);
    if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
      snapshot.warnings.push(
        warning(
          'unsafe-root',
          'openspec',
          'OpenSpec root must be a regular directory, not a symlink',
        ),
      );
      return snapshot;
    }
  } catch (error) {
    snapshot.warnings.push(
      warning(
        'read-failed',
        'openspec',
        `Could not inspect OpenSpec root: ${(error as Error).message}`,
      ),
    );
    return snapshot;
  }

  const project = await readDocument(root, 'project.md', 'project', budget, snapshot.warnings);
  const config = await readDocument(root, 'config.yaml', 'config', budget, snapshot.warnings);
  if (project) snapshot.context.project = project;
  if (config) snapshot.context.config = config;

  for (const specPath of await collectSpecPaths(
    root,
    'specs',
    snapshot.warnings,
    limits.maxDepth,
  )) {
    const capability = await readCapability(root, specPath, 'specs', budget, snapshot.warnings);
    if (capability) snapshot.canonical_specs.push(capability);
  }

  for (const entry of await safeDirectoryEntries(root, 'changes', snapshot.warnings)) {
    if (entry.name === 'archive') continue;
    const relativePath = path.posix.join('changes', entry.name);
    if (entry.isSymbolicLink()) {
      snapshot.warnings.push(
        warning('symlink-refused', relativePath, 'Skipped a symbolic-link change'),
      );
    } else if (entry.isDirectory()) {
      snapshot.active_changes.push(
        await readStructuredChange(root, relativePath, 'active', budget, snapshot.warnings),
      );
    } else {
      snapshot.warnings.push(
        warning('unsupported-entry', relativePath, 'Ignored an unsupported active-change entry'),
      );
    }
  }

  for (const entry of await safeDirectoryEntries(root, 'changes/archive', snapshot.warnings)) {
    const relativePath = path.posix.join('changes/archive', entry.name);
    if (entry.isSymbolicLink()) {
      snapshot.warnings.push(
        warning('symlink-refused', relativePath, 'Skipped a symbolic-link archive entry'),
      );
    } else if (entry.isDirectory()) {
      snapshot.archived_changes.push(
        await readStructuredChange(root, relativePath, 'archived', budget, snapshot.warnings),
      );
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const document = await readDocument(root, relativePath, 'legacy', budget, snapshot.warnings);
      if (document) snapshot.legacy_archives.push(document);
    } else {
      snapshot.warnings.push(
        warning('unsupported-entry', relativePath, 'Ignored an unsupported archive entry'),
      );
    }
  }

  snapshot.canonical_specs.sort((left, right) => left.path.localeCompare(right.path));
  snapshot.active_changes.sort((left, right) => left.path.localeCompare(right.path));
  snapshot.archived_changes.sort((left, right) => left.path.localeCompare(right.path));
  snapshot.legacy_archives.sort((left, right) => left.path.localeCompare(right.path));
  snapshot.warnings.sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
  return snapshot;
}

export function openSpecSnapshotPath(cwd: string): string {
  return path.join(cwd, 'iris', 'spec.json');
}

export async function writeOpenSpecSnapshot(cwd: string): Promise<OpenSpecSnapshot> {
  const snapshot = await parseOpenSpecWorkspace(cwd);
  const target = openSpecSnapshotPath(cwd);
  await ensureDir(path.dirname(target));
  const temporary = path.join(path.dirname(target), `.spec.json.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
  return snapshot;
}

export async function loadOpenSpecSnapshot(cwd: string): Promise<OpenSpecSnapshot> {
  const target = openSpecSnapshotPath(cwd);
  if (!existsSync(target)) return emptyOpenSpecSnapshot(false);
  try {
    const parsed = JSON.parse(await readFile(target, 'utf8')) as Partial<OpenSpecSnapshot>;
    if (
      parsed.version !== 1 ||
      typeof parsed.detected !== 'boolean' ||
      !Array.isArray(parsed.canonical_specs) ||
      !Array.isArray(parsed.active_changes) ||
      !Array.isArray(parsed.archived_changes) ||
      !Array.isArray(parsed.legacy_archives) ||
      !Array.isArray(parsed.warnings)
    ) {
      throw new Error('unsupported snapshot shape');
    }
    return parsed as OpenSpecSnapshot;
  } catch (error) {
    const snapshot = emptyOpenSpecSnapshot(false);
    snapshot.warnings.push(
      warning(
        'snapshot-invalid',
        'iris/spec.json',
        `Could not load generated snapshot: ${(error as Error).message}`,
      ),
    );
    return snapshot;
  }
}
