import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { validateContract } from '../src/lib/schemas.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-draft-'));
  tempDirs.push(dir);
  return dir;
}

describe('draft commands', () => {
  it('creates a bug draft contract skeleton from the CLI', async () => {
    const cwd = await createTempDir();

    const code = await runCli(['bug', 'bug-cache-stampede'], cwd);

    expect(code).toBe(0);

    const dataPath = path.join(cwd, 'iris', 'pages', 'bug-cache-stampede', 'data.json');
    const raw = await readFile(dataPath, 'utf8');
    const payload = JSON.parse(raw);

    await expect(validateContract('bug', payload, dataPath)).resolves.toBeUndefined();
    expect(payload.type).toBe('bug');
    expect(payload.id).toBe('bug-cache-stampede');
  });
});
