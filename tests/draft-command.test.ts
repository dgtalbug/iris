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

  it('drafts a feature with HLD and LLD Mermaid skeletons that validate', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['feature', 'login-flow'], cwd)).toBe(0);
    const dataPath = path.join(cwd, 'iris', 'pages', 'login-flow', 'data.json');
    const payload = JSON.parse(await readFile(dataPath, 'utf8'));
    await expect(validateContract('feature', payload, dataPath)).resolves.toBeUndefined();
    expect(payload.sections.design.hld.md).toContain('```mermaid\nflowchart LR');
    expect(payload.sections.design.hld.md).toContain('Login Flow');
    expect(payload.sections.design.lld.md).toContain('```mermaid\nsequenceDiagram');
    expect(payload.sections.design.hld.md).not.toMatch(/#[0-9a-f]{6}/i);
  });
});
