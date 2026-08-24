import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execFile: execFileMock };
});

import * as indexing from '../src/lib/indexing.js';
import { IrisError } from '../src/lib/errors.js';

const {
  computeStaleness,
  createIndexPointer,
  discoverIndexer,
  INDEXER_INSTALL_HINT,
  parseGitnexusList,
  parseGitnexusStatus,
  projectIndexPath,
  readIndexPointer,
  resolveIndexer,
  stalenessHint,
  writeIndexPointer,
} = indexing;
type IndexPointer = indexing.IndexPointer;

const tempDirs: string[] = [];

beforeEach(async () => {
  execFileMock.mockReset();
  const home = await mkdtemp(path.join(os.tmpdir(), 'iris-home-'));
  tempDirs.push(home);
  vi.stubEnv('IRIS_HOME', home);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function mockExecFile(
  handler: (file: string, args: string[]) => { stdout?: string; stderr?: string; error?: Error },
): void {
  execFileMock.mockImplementation((file, args, options, callback) => {
    const cb = typeof options === 'function' ? options : callback;
    try {
      const result = handler(String(file), (args ?? []) as string[]);
      if (result.error) {
        cb?.(result.error);
        return;
      }
      cb?.(null, result.stdout ?? '', result.stderr ?? '');
    } catch (error) {
      cb?.(error as Error);
    }
  });
}

describe('indexing pointer', () => {
  it('round-trips index.json under the project home', async () => {
    const pointer: IndexPointer = {
      enabled: true,
      lastIndexedSha: 'abc123',
      symbols: 42,
      flows: 7,
      indexedAt: '2026-08-24T00:00:00.000Z',
    };
    await writeIndexPointer('demo-project', pointer);
    expect(existsSync(projectIndexPath('demo-project'))).toBe(true);
    expect(await readIndexPointer('demo-project')).toEqual(pointer);
  });

  it('returns null when the pointer is absent', async () => {
    expect(await readIndexPointer('missing-project')).toBeNull();
  });
});

describe('gitnexus output parsing', () => {
  it('parses indexed and current commits from status output', () => {
    const output = [
      'Repository: /tmp/demo',
      'Indexed: 8/24/2026, 1:00:00 AM',
      'Indexed commit: deadbeef',
      'Current commit: cafebabe',
      'Status: ⚠️ stale (re-run gitnexus analyze)',
    ].join('\n');
    expect(parseGitnexusStatus(output)).toEqual({
      indexedCommit: 'deadbeef',
      currentCommit: 'cafebabe',
    });
  });

  it('parses symbol and flow counts from list output', () => {
    const output = [
      '  Indexed Repositories (1)',
      '',
      '  iris',
      '    Path:    /tmp/demo',
      '    Indexed: 8/24/2026, 1:00:00 AM',
      '    Commit:  deadbeef',
      '    Stats:   239 files, 3331 symbols, 5104 edges',
      '    Clusters:   80',
      '    Processes:  224',
    ].join('\n');
    expect(parseGitnexusList(output)).toEqual({ symbols: 3331, flows: 224 });
  });
});

describe('index staleness', () => {
  it('reports up to date when the indexed sha matches HEAD', async () => {
    mockExecFile((file, args) => {
      if (file === 'git' && args[0] === 'rev-parse') return { stdout: 'abc123\n' };
      return { error: new Error('unexpected git call') };
    });
    expect(await computeStaleness('/tmp/demo', { lastIndexedSha: 'abc123' }, 'abc123')).toBe(
      'up to date',
    );
  });

  it('reports stale with commit count when HEAD moved forward', () => {
    expect(stalenessHint('oldhead', 'newhead', 1)).toBe('stale (1 commits behind)');
  });

  it('reports unknown when either sha is missing', async () => {
    expect(stalenessHint(null, 'head', 0)).toBe('unknown');
    expect(stalenessHint('indexed', null, 0)).toBe('unknown');
    expect(await computeStaleness('/tmp/demo', { lastIndexedSha: null })).toBe('unknown');
  });
});

describe('indexer discovery', () => {
  it('prefers gitnexus on PATH over npx', async () => {
    mockExecFile((file, args) => {
      if (file === 'command' && args[0] === '-v' && args[1] === 'gitnexus') {
        return { stdout: '/usr/local/bin/gitnexus\n' };
      }
      return { error: new Error('not found') };
    });
    await expect(discoverIndexer()).resolves.toEqual({
      executable: 'gitnexus',
      prefixArgs: [],
    });
  });

  it('refuses when the indexer cannot be resolved', async () => {
    mockExecFile(() => ({ error: new Error('not found') }));
    await expect(resolveIndexer()).rejects.toEqual(new IrisError(1, INDEXER_INSTALL_HINT));
  });
});

describe('createIndexPointer', () => {
  it('builds a pointer from gitnexus status and list output', async () => {
    const pointer = createIndexPointer(
      'Indexed commit: abcdef1\nCurrent commit: abcdef1\n',
      'Stats:   10 files, 99 symbols, 50 edges\nProcesses:  12\n',
      null,
    );
    expect(pointer).toMatchObject({
      enabled: true,
      lastIndexedSha: 'abcdef1',
      symbols: 99,
      flows: 12,
    });
    expect(pointer.indexedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('persists the pointer under ~/.iris/projects/<id>/index.json', async () => {
    const projectId = 'demo-project-id';
    const pointer = createIndexPointer(
      'Indexed commit: abcdef1\n',
      'Stats:   10 files, 99 symbols, 50 edges\nProcesses:  12\n',
      null,
    );
    await writeIndexPointer(projectId, pointer);
    expect(JSON.parse(await readFile(projectIndexPath(projectId), 'utf8'))).toMatchObject({
      enabled: true,
      lastIndexedSha: 'abcdef1',
      symbols: 99,
      flows: 12,
    });
  });
});
