import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IrisError } from '../src/lib/errors.js';
import { INDEXER_INSTALL_HINT } from '../src/lib/indexing.js';

const { resolveIndexerMock } = vi.hoisted(() => ({
  resolveIndexerMock: vi.fn(),
}));

vi.mock('../src/lib/indexing.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/indexing.js')>();
  return {
    ...actual,
    resolveIndexer: resolveIndexerMock,
    runProjectIndexing: vi.fn(),
  };
});

import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  resolveIndexerMock.mockReset();
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-init-index-'));
  tempDirs.push(dir);
  return dir;
}

describe('iris init --index', () => {
  it('refuses before setup when the indexer is absent', async () => {
    const cwd = await createTempDir();
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    resolveIndexerMock.mockRejectedValue(new IrisError(1, INDEXER_INSTALL_HINT));

    expect(await runCli(['init', '--yes', '--tools', 'none', '--index'], cwd)).toBe(1);
    expect(resolveIndexerMock).toHaveBeenCalledOnce();
    expect(stderr).toHaveBeenCalledWith(`${INDEXER_INSTALL_HINT}\n`);
    expect(existsSync(path.join(cwd, 'iris'))).toBe(false);
  });
});
