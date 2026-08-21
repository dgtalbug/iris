import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-lifecycle-'));
  tempDirs.push(dir);
  return dir;
}

describe('project lifecycle commands', () => {
  it('initializes a lifecycle-aware scaffold and preserves user task entries on update', async () => {
    const cwd = await createTempDir();
    await mkdir(path.join(cwd, '.vscode'), { recursive: true });
    await writeFile(
      path.join(cwd, '.vscode', 'tasks.json'),
      JSON.stringify({
        version: '2.0.0',
        tasks: [{ label: 'user task', type: 'shell', command: 'echo safe' }],
      }),
    );

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['update'], cwd)).toBe(0);

    const state = JSON.parse(await readFile(path.join(cwd, 'iris', 'state.json'), 'utf8'));
    const tasks = JSON.parse(await readFile(path.join(cwd, '.vscode', 'tasks.json'), 'utf8'));
    expect(state).toMatchObject({ version: 1, page_index: {}, content_hashes: {} });
    expect(tasks.tasks.map((task: { label: string }) => task.label)).toEqual([
      'user task',
      'iris: open dashboard',
    ]);
    expect(existsSync(path.join(cwd, 'iris', 'design', 'vendor'))).toBe(true);
  });

  it('adopts docs, detects stale source changes, refreshes them, and archives pages', async () => {
    const cwd = await createTempDir();
    await writeFile(path.join(cwd, 'README.md'), '# Example\n\nFirst version.\n');
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['adopt'], cwd)).toBe(0);

    const id = 'doc-readme';
    const dataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');
    const adopted = JSON.parse(await readFile(dataPath, 'utf8'));
    expect(adopted.sections.summary).toContain('Source: README.md');
    let state = JSON.parse(await readFile(path.join(cwd, 'iris', 'state.json'), 'utf8'));
    expect(state.page_index[id].source.path).toBe('README.md');
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8')).toContain('README');
    expect(await runCli(['sync'], cwd)).toBe(0);

    await writeFile(path.join(cwd, 'README.md'), '# Example\n\nSecond version.\n');
    expect(await runCli(['sync'], cwd)).toBe(0);
    state = JSON.parse(await readFile(path.join(cwd, 'iris', 'state.json'), 'utf8'));
    expect(state.page_index[id].status).toBe('stale');
    expect(await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8')).toContain('stale');

    expect(await runCli(['adopt'], cwd)).toBe(0);
    state = JSON.parse(await readFile(path.join(cwd, 'iris', 'state.json'), 'utf8'));
    expect(state.page_index[id].status).toBe('active');
    expect(await runCli(['bug', 'kept-page'], cwd)).toBe(0);
    expect(await runCli(['render', 'kept-page'], cwd)).toBe(0);
    expect(await runCli(['archive', id], cwd)).toBe(0);
    expect(existsSync(path.join(cwd, 'iris', 'archive', id, 'data.json'))).toBe(true);
    expect(existsSync(path.join(cwd, 'iris', 'pages', id))).toBe(false);
    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).not.toContain(`href="./pages/${id}/page.html"`);
    expect(dashboard).toContain(`href="./archive/${id}/page.html"`);
    expect(dashboard).toContain('Kept Page');
  });
});
