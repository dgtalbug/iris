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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-render-'));
  tempDirs.push(dir);
  return dir;
}

describe('render commands', () => {
  it('renders all drafted contract pages and updates the dashboard', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['feature', 'feature-login-flow'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const bugHtml = await readFile(path.join(cwd, 'iris', 'pages', 'bug-cache-stampede', 'page.html'), 'utf8');
    const featureHtml = await readFile(path.join(cwd, 'iris', 'pages', 'feature-login-flow', 'page.html'), 'utf8');
    const dashboardHtml = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');

    expect(bugHtml).toContain('Bug Cache Stampede');
    expect(bugHtml).toContain('p2');
    expect(featureHtml).toContain('Feature Login Flow');
    expect(dashboardHtml).toContain('Bug Cache Stampede');
    expect(dashboardHtml).toContain('Feature Login Flow');
  });
});
