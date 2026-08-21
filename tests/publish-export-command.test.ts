import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-publish-export-'));
  tempDirs.push(dir);
  return dir;
}

async function createBugPage(cwd: string): Promise<void> {
  expect(await runCli(['init'], cwd)).toBe(0);
  expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
}

describe('publish and export commands', () => {
  it('publishes portable HTML to an explicit path and creates its parents', async () => {
    const cwd = await createTempDir();
    await createBugPage(cwd);
    const dataPath = path.join(cwd, 'iris', 'pages', 'bug-cache-stampede', 'data.json');
    const contract = JSON.parse(await readFile(dataPath, 'utf8')) as {
      sections: { symptom: { md: string } };
    };
    contract.sections.symptom.md = '```mermaid\nflowchart LR\n  A --> B\n```';
    await writeFile(dataPath, `${JSON.stringify(contract, null, 2)}\n`);

    expect(
      await runCli(
        ['publish', 'bug-cache-stampede', '--output', 'artifacts/review/page.html'],
        cwd,
      ),
    ).toBe(0);

    const artifactPath = path.join(cwd, 'artifacts', 'review', 'page.html');
    const html = await readFile(artifactPath, 'utf8');
    expect(html).toContain('Bug Cache Stampede');
    expect(html).toContain('<style data-iris-standalone>');
    expect(html).toContain('--bg:');
    expect(html).toContain('.page-shell');
    expect(html).not.toMatch(/<link\b[^>]*\b(?:href|src)=/i);
    expect(html).not.toMatch(/<script\b[^>]*\bsrc=/i);
    expect(html).not.toContain('design/vendor/mermaid.min.js');
    expect(html).toContain('data-mermaid-fallback');
    expect(html).toContain('flowchart LR');
    expect(html).not.toMatch(/@import\s|url\s*\(/i);

    await rm(path.join(cwd, 'iris'), { recursive: true, force: true });
    await expect(readFile(artifactPath, 'utf8')).resolves.toBe(html);
  });

  it('uses deterministic default names for publish and single-file export', async () => {
    const cwd = await createTempDir();
    await createBugPage(cwd);

    expect(await runCli(['publish', 'bug-cache-stampede'], cwd)).toBe(0);
    await expect(
      access(path.join(cwd, 'iris', 'archive', 'bug-cache-stampede-publish.html')),
    ).resolves.toBeUndefined();

    expect(await runCli(['export', 'bug-cache-stampede', '--single'], cwd)).toBe(0);
    await expect(
      access(path.join(cwd, 'iris', 'archive', 'bug-cache-stampede.html')),
    ).resolves.toBeUndefined();
  });

  it('fails clearly for a missing page without creating its directory', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    expect(await runCli(['publish', 'missing-page'], cwd)).toBe(1);
    await expect(access(path.join(cwd, 'iris', 'pages', 'missing-page'))).rejects.toThrow();
  });

  it('rejects export requests that cannot be produced honestly', async () => {
    const cwd = await createTempDir();
    const writeError = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    expect(await runCli(['export'], cwd)).toBe(1);
    expect(await runCli(['export', 'bug-cache-stampede', '--png'], cwd)).toBe(1);
    expect(await runCli(['export', 'bug-cache-stampede', '--single', '--pdf'], cwd)).toBe(1);
    expect(writeError).toHaveBeenCalledWith(
      expect.stringMatching(
        /no browser renderer meets the deterministic offline contract; use --single/,
      ),
    );
    writeError.mockRestore();
  });
});
