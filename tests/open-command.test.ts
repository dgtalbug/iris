import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { runOpenCommand } from '../src/commands/open.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-open-'));
  tempDirs.push(dir);
  return dir;
}

describe('open command', () => {
  it('launches the platform opener on the dashboard file', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    const invocations: string[] = [];
    await runOpenCommand(cwd, async (command, args) => {
      invocations.push([command, ...args].join(' '));
    });

    expect(invocations).toHaveLength(1);
    expect(invocations[0]).toContain(path.join(cwd, 'iris', 'index.html'));
  });

  it('fails with a validation error when iris is not initialized', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['open'], cwd)).toBe(1);
  });

  it('reports an environment error when the opener cannot launch', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    await expect(
      runOpenCommand(cwd, async () => {
        throw new Error('no display');
      }),
    ).rejects.toMatchObject({ code: 2 });
  });
});
