import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-lifecycle-'));
  tempDirs.push(dir);
  return dir;
}

describe('project lifecycle commands', () => {
  it('initializes idempotently with agent skills and preserves user task entries on update', async () => {
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
    expect(state).toEqual({ version: 2, page_index: {} });
    expect(tasks.tasks.map((task: { label: string }) => task.label)).toEqual([
      'user task',
      'iris: open dashboard',
    ]);
    for (const target of ['.agents', '.claude', '.github']) {
      expect(existsSync(path.join(cwd, target, 'skills', 'iris-workspace', 'SKILL.md'))).toBe(true);
    }
    expect(existsSync(path.join(cwd, 'iris', 'design', 'vendor'))).toBe(true);
  });

  it('does not ingest README or docs during initialization', async () => {
    const cwd = await createTempDir();
    await mkdir(path.join(cwd, 'docs'));
    await writeFile(path.join(cwd, 'README.md'), '# User README\n');
    await writeFile(path.join(cwd, 'docs', 'guide.md'), '# User guide\n');

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await readFile(path.join(cwd, 'README.md'), 'utf8')).toBe('# User README\n');
    expect(await readFile(path.join(cwd, 'docs', 'guide.md'), 'utf8')).toBe('# User guide\n');
    expect(await readFile(path.join(cwd, 'iris', 'state.json'), 'utf8')).not.toContain('README.md');
    expect(existsSync(path.join(cwd, 'iris', 'pages', 'doc-readme'))).toBe(false);
  });

  it('preserves user configuration, pages, and archives across init reruns', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    const configPath = path.join(cwd, 'iris', 'config.yaml');
    await writeFile(configPath, 'project: user-owned\ntheme: light\n');

    expect(await runCli(['bug', 'kept-page'], cwd)).toBe(0);
    expect(await runCli(['render', 'kept-page'], cwd)).toBe(0);
    expect(await runCli(['archive', 'kept-page'], cwd)).toBe(0);
    expect(await runCli(['feature', 'active-page'], cwd)).toBe(0);
    expect(await runCli(['render', 'active-page'], cwd)).toBe(0);
    expect(await runCli(['init'], cwd)).toBe(0);

    expect(await readFile(configPath, 'utf8')).toBe('project: user-owned\ntheme: light\n');
    expect(existsSync(path.join(cwd, 'iris', 'archive', 'kept-page', 'data.json'))).toBe(true);
    expect(existsSync(path.join(cwd, 'iris', 'pages', 'active-page', 'data.json'))).toBe(true);
    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).toContain('./archive/kept-page/page.html');
    expect(dashboard).toContain('./pages/active-page/page.html');
  });

  it('renders the workspace but reports an incomplete unmarked skill collision', async () => {
    const cwd = await createTempDir();
    const target = path.join(cwd, '.agents', 'skills', 'iris-workspace', 'SKILL.md');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'user-owned skill\n');
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    expect(await runCli(['init'], cwd)).toBe(1);
    expect(await readFile(target, 'utf8')).toBe('user-owned skill\n');
    expect(existsSync(path.join(cwd, 'iris', 'index.html'))).toBe(true);
    expect(existsSync(path.join(cwd, '.claude', 'skills', 'iris-workspace', 'SKILL.md'))).toBe(true);
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('agent skill setup is incomplete'));
  });
});
