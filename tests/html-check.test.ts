import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const scriptPath = path.join(__dirname, '..', 'scripts', 'html-check.mjs');

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-html-check-'));
  tempDirs.push(dir);
  return dir;
}

async function runHtmlCheck(root: string): Promise<{ code: number; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, root]);
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: failure.code ?? 1, output: `${failure.stdout ?? ''}${failure.stderr ?? ''}` };
  }
}

describe('html-check script', () => {
  it('passes a tree whose local references all resolve', async () => {
    const root = await createTempDir();
    await mkdir(path.join(root, 'pages', 'demo'), { recursive: true });
    await writeFile(path.join(root, 'style.css'), 'body {}', 'utf8');
    await writeFile(
      path.join(root, 'index.html'),
      '<html><head><link rel="stylesheet" href="./style.css" /></head>' +
        '<body><a href="./pages/demo/page.html">demo</a>' +
        '<a href="https://example.com">ext</a><a href="#top">top</a></body></html>',
      'utf8',
    );
    await writeFile(
      path.join(root, 'pages', 'demo', 'page.html'),
      '<html><body><a href="../../index.html">back</a></body></html>',
      'utf8',
    );

    const result = await runHtmlCheck(root);
    expect(result.output).toContain('html-check');
    expect(result.code).toBe(0);
  });

  it('fails and names the file when a local reference is missing', async () => {
    const root = await createTempDir();
    await writeFile(
      path.join(root, 'index.html'),
      '<html><body><a href="./pages/ghost/page.html">ghost</a></body></html>',
      'utf8',
    );

    const result = await runHtmlCheck(root);
    expect(result.code).toBe(1);
    expect(result.output).toContain('index.html');
    expect(result.output).toContain('pages/ghost/page.html');
  });

  it('flags empty href references', async () => {
    const root = await createTempDir();
    await writeFile(
      path.join(root, 'index.html'),
      '<html><body><a href="">nowhere</a></body></html>',
      'utf8',
    );

    const result = await runHtmlCheck(root);
    expect(result.code).toBe(1);
    expect(result.output).toContain('empty');
  });
});
