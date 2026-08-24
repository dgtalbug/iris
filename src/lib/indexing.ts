import { execFile, type ExecFileOptions } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { IrisError } from './errors.js';
import { ensureDir } from './fs.js';
import { projectDir } from './user-config.js';

const execFileAsync = promisify(execFile);

export type IndexPointer = {
  enabled: boolean;
  lastIndexedSha: string | null;
  symbols: number | null;
  flows: number | null;
  indexedAt: string | null;
};

export type IndexerInvocation = {
  executable: string;
  prefixArgs: readonly string[];
};

export type StalenessHint = 'up to date' | `stale (${number} commits behind)` | 'unknown';

export const INDEXER_INSTALL_HINT =
  'GitNexus is required for indexing. Install with: npm i -g gitnexus (or run npx gitnexus setup)';

export function projectIndexPath(projectId: string): string {
  return path.join(projectDir(projectId), 'index.json');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizePointer(value: unknown): IndexPointer {
  const raw = asRecord(value);
  return {
    enabled: raw.enabled === true,
    lastIndexedSha: typeof raw.lastIndexedSha === 'string' ? raw.lastIndexedSha : null,
    symbols: typeof raw.symbols === 'number' && Number.isFinite(raw.symbols) ? raw.symbols : null,
    flows: typeof raw.flows === 'number' && Number.isFinite(raw.flows) ? raw.flows : null,
    indexedAt: typeof raw.indexedAt === 'string' ? raw.indexedAt : null,
  };
}

export async function readIndexPointer(projectId: string): Promise<IndexPointer | null> {
  try {
    return normalizePointer(JSON.parse(await readFile(projectIndexPath(projectId), 'utf8')));
  } catch {
    return null;
  }
}

export async function writeIndexPointer(projectId: string, pointer: IndexPointer): Promise<void> {
  const filePath = projectIndexPath(projectId);
  await ensureDir(path.dirname(filePath));
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, `${JSON.stringify(normalizePointer(pointer), null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('command', ['-v', command], { shell: true, timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

async function probeIndexer(
  executable: string,
  prefixArgs: readonly string[],
  options: ExecFileOptions = {},
): Promise<boolean> {
  try {
    await execFileAsync(executable, [...prefixArgs, '--version'], {
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
      ...options,
    });
    return true;
  } catch {
    return false;
  }
}

/** Locate gitnexus on PATH first, then fall back to the local npx cache (never fetches). */
export async function discoverIndexer(): Promise<IndexerInvocation | null> {
  if (await commandExists('gitnexus')) {
    return { executable: 'gitnexus', prefixArgs: [] };
  }
  if (await probeIndexer('npx', ['--no-install', 'gitnexus'])) {
    return { executable: 'npx', prefixArgs: ['--no-install', 'gitnexus'] };
  }
  return null;
}

export async function resolveIndexer(): Promise<IndexerInvocation> {
  const indexer = await discoverIndexer();
  if (!indexer) {
    throw new IrisError(1, INDEXER_INSTALL_HINT);
  }
  return indexer;
}

export function parseGitnexusStatus(stdout: string): {
  indexedCommit: string | null;
  currentCommit: string | null;
} {
  let indexedCommit: string | null = null;
  let currentCommit: string | null = null;
  for (const line of stdout.split(/\r?\n/)) {
    const indexed = /^Indexed commit:\s*(\S+)/.exec(line);
    if (indexed) indexedCommit = indexed[1];
    const current = /^Current commit:\s*(\S+)/.exec(line);
    if (current) currentCommit = current[1];
  }
  return { indexedCommit, currentCommit };
}

export function parseGitnexusList(stdout: string): {
  symbols: number | null;
  flows: number | null;
} {
  let symbols: number | null = null;
  let flows: number | null = null;
  for (const line of stdout.split(/\r?\n/)) {
    const stats = /Stats:\s*\d+\s+files,\s*(\d+)\s+symbols/.exec(line);
    if (stats) symbols = Number.parseInt(stats[1], 10);
    const processes = /Processes:\s*(\d+)/.exec(line);
    if (processes) flows = Number.parseInt(processes[1], 10);
  }
  return { symbols, flows };
}

export async function readHeadSha(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd,
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    const sha = stdout.trim();
    return sha || null;
  } catch {
    return null;
  }
}

export async function commitsBehind(
  cwd: string,
  fromSha: string,
  toSha: string,
): Promise<number | null> {
  if (fromSha === toSha) return 0;
  try {
    const { stdout } = await execFileAsync('git', ['rev-list', '--count', `${fromSha}..${toSha}`], {
      cwd,
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    const count = Number.parseInt(stdout.trim(), 10);
    return Number.isFinite(count) ? count : null;
  } catch {
    return null;
  }
}

export function stalenessHint(
  indexedSha: string | null,
  headSha: string | null,
  behind: number | null,
): StalenessHint {
  if (!indexedSha || !headSha) return 'unknown';
  if (indexedSha === headSha) return 'up to date';
  if (behind === null) return 'unknown';
  if (behind === 0) return 'up to date';
  return `stale (${behind} commits behind)`;
}

export async function computeStaleness(
  cwd: string,
  pointer: Pick<IndexPointer, 'lastIndexedSha'>,
  headSha: string | null = null,
): Promise<StalenessHint> {
  const indexedSha = pointer.lastIndexedSha;
  if (!indexedSha) return 'unknown';
  const currentHead = headSha ?? (await readHeadSha(cwd));
  if (!currentHead) return 'unknown';
  if (indexedSha === currentHead) return 'up to date';
  const behind = await commitsBehind(cwd, indexedSha, currentHead);
  return stalenessHint(indexedSha, currentHead, behind);
}

export function createIndexPointer(
  statusOutput: string,
  listOutput: string,
  headSha: string | null,
): IndexPointer {
  const { indexedCommit } = parseGitnexusStatus(statusOutput);
  const { symbols, flows } = parseGitnexusList(listOutput);
  return {
    enabled: true,
    lastIndexedSha: indexedCommit ?? headSha,
    symbols,
    flows,
    indexedAt: new Date().toISOString(),
  };
}

async function runIndexerCommand(
  indexer: IndexerInvocation,
  args: readonly string[],
  cwd: string,
): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    indexer.executable,
    [...indexer.prefixArgs, ...args],
    {
      cwd,
      timeout: 30 * 60_000,
      maxBuffer: 16 * 1024 * 1024,
    },
  );
  return `${stdout}\n${stderr}`;
}

/**
 * Run gitnexus analyze synchronously, then record a machine-local status pointer.
 * Never writes to ~/.gitnexus/ or .gitnexus/ — only ~/.iris/projects/<id>/index.json.
 */
export async function runProjectIndexing(cwd: string, projectId: string): Promise<IndexPointer> {
  const indexer = await resolveIndexer();
  await runIndexerCommand(indexer, ['analyze', cwd], cwd);
  const statusOutput = await runIndexerCommand(indexer, ['status'], cwd);
  const listOutput = await runIndexerCommand(indexer, ['list'], cwd);
  const pointer = createIndexPointer(statusOutput, listOutput, await readHeadSha(cwd));
  await writeIndexPointer(projectId, pointer);
  return pointer;
}
