import { mkdtemp, rm } from 'node:fs/promises';
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

import { computeStaleness, stalenessHint } from '../src/lib/indexing.js';

const tempDirs: string[] = [];

beforeEach(async () => {
  execFileMock.mockReset();
  const home = await mkdtemp(path.join(os.tmpdir(), 'iris-staleness-home-'));
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

describe('index staleness computation', () => {
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
    expect(stalenessHint('oldhead', 'newhead', 3)).toBe('stale (3 commits behind)');
  });

  it('reports unknown when either sha is missing', async () => {
    expect(stalenessHint(null, 'head', 0)).toBe('unknown');
    expect(stalenessHint('indexed', null, 0)).toBe('unknown');
    expect(await computeStaleness('/tmp/demo', { lastIndexedSha: null })).toBe('unknown');
  });
});
