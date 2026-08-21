import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

    const bugHtml = await readFile(
      path.join(cwd, 'iris', 'pages', 'bug-cache-stampede', 'page.html'),
      'utf8',
    );
    const featureHtml = await readFile(
      path.join(cwd, 'iris', 'pages', 'feature-login-flow', 'page.html'),
      'utf8',
    );
    const dashboardHtml = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');

    expect(bugHtml).toContain('Bug Cache Stampede');
    expect(bugHtml).toContain('p2');
    expect(featureHtml).toContain('Feature Login Flow');
    expect(dashboardHtml).toContain('Bug Cache Stampede');
    expect(dashboardHtml).toContain('Feature Login Flow');
  });

  it('publishes pages and derives reports from session data', async () => {
    const cwd = await createTempDir();
    const sessionDir = path.join(cwd, 'agent-session');

    await mkdir(sessionDir, { recursive: true });
    expect(await runCli(['init'], cwd)).toBe(0);
    await runCli(['bug', 'bug-cache-stampede'], cwd);
    await runCli(['render', 'bug-cache-stampede'], cwd);

    await writeFile(
      path.join(sessionDir, 'session.json'),
      JSON.stringify({
        title: 'Sprint review',
        summary: 'The cache stampede happened during peak traffic and the app tripped rate limits.',
        messages: [{ text: 'Mitigation: add jitter to retries and raise the queue depth.' }],
      }),
      'utf8',
    );

    expect(
      await runCli(['report', '--from-session', './agent-session', 'session-review'], cwd),
    ).toBe(0);
    expect(
      await runCli(['publish', 'bug-cache-stampede', '--output', 'dist/published.html'], cwd),
    ).toBe(0);

    const publishedHtml = await readFile(path.join(cwd, 'dist', 'published.html'), 'utf8');
    const reportHtml = await readFile(
      path.join(cwd, 'iris', 'pages', 'session-review', 'page.html'),
      'utf8',
    );

    expect(publishedHtml).toContain('Bug Cache Stampede');
    expect(reportHtml).toContain('Session Review');
    expect(reportHtml).toContain('cache stampede');
  });
});
