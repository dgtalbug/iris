import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-init-config-'));
  tempDirs.push(dir);
  return dir;
}

describe('iris init config contract', () => {
  it('does not write indexing keys into iris/config.yaml', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init', '--yes', '--tools', 'none'], cwd)).toBe(0);
    const config = await readFile(path.join(cwd, 'iris', 'config.yaml'), 'utf8');
    expect(config).not.toMatch(/^\s*index(?:ing)?:/m);
  });
});
