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

  it('renders feature design sections as tabs and keeps legacy features stacked', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['feature', 'with-design'], cwd)).toBe(0);
    const legacyDir = path.join(cwd, 'iris', 'pages', 'without-design');
    await mkdir(legacyDir, { recursive: true });
    const legacy = JSON.parse(
      await readFile(path.join(cwd, 'iris', 'pages', 'with-design', 'data.json'), 'utf8'),
    );
    legacy.id = 'without-design';
    delete legacy.sections.design;
    await writeFile(path.join(legacyDir, 'data.json'), JSON.stringify(legacy, null, 2), 'utf8');

    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const tabbed = await readFile(
      path.join(cwd, 'iris', 'pages', 'with-design', 'page.html'),
      'utf8',
    );
    expect(tabbed).toContain('data-tabs="feature-with-design"');
    for (const tab of ['overview', 'hld', 'lld', 'tasks']) {
      expect(tabbed).toContain(`data-tab-group="feature-with-design" data-tab-id="${tab}"`);
    }
    expect(tabbed).toContain('data-mermaid-figure');
    expect(tabbed).toContain('<h2>HLD</h2>');

    const stacked = await readFile(
      path.join(cwd, 'iris', 'pages', 'without-design', 'page.html'),
      'utf8',
    );
    expect(stacked).not.toContain('data-tabs=');
    expect(stacked).toContain('<h2>Problem</h2>');
    expect(stacked).toContain('<h2>Tasks</h2>');
  });
});
