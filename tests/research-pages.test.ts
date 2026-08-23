import { existsSync } from 'node:fs';
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
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-research-'));
  tempDirs.push(dir);
  return dir;
}

async function writeResearch(cwd: string, id: string, content: string): Promise<void> {
  const target = path.join(cwd, 'iris', 'research', id, 'index.md');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

describe('markdown research pages', () => {
  it('creates a skeleton and refuses duplicate or malformed ids', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['research', 'cache-stampede-causes'], cwd)).toBe(0);

    const source = await readFile(
      path.join(cwd, 'iris', 'research', 'cache-stampede-causes', 'index.md'),
      'utf8',
    );
    expect(source).toContain('title: Cache Stampede Causes');
    expect(source).toContain('## Question');
    expect(source).toContain('## Findings');
    expect(source).toContain('## Evidence');
    expect(source).toContain('## Next steps');

    expect(await runCli(['research', 'cache-stampede-causes'], cwd)).toBe(1);
    expect(await runCli(['research', 'Not Kebab'], cwd)).toBe(1);
  });

  it('renders front matter, a table of contents, and mermaid source into a document page', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await writeResearch(
      cwd,
      'cache-notes',
      [
        '---',
        'title: Cache notes',
        'status: active',
        'agent: claude-code',
        'updated: 2026-08-21',
        'tags: [cache, performance]',
        '---',
        '',
        '## Question',
        '',
        'Why does the cache stampede?',
        '',
        '## Findings',
        '',
        '### Cold start',
        '',
        'Requests pile up.',
        '',
        '```mermaid',
        'flowchart LR',
        '  A --> B',
        '```',
      ].join('\n'),
    );

    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const page = await readFile(
      path.join(cwd, 'iris', 'research', 'cache-notes', 'page.html'),
      'utf8',
    );
    expect(page).toContain('<h1>Cache notes</h1>');
    expect(page).toContain('agent claude-code');
    expect(page).toContain('updated 2026-08-21');
    expect(page).toContain('<h2 class="section" id="question">Question</h2>');
    expect(page).toContain('href="#cold-start"');
    expect(page).toContain('aria-label="On this page"');
    expect(page).toContain('data-mermaid-figure');
    expect(page).toContain('<script defer src="../../design/vendor/mermaid.min.js">');

    const index = await readFile(path.join(cwd, 'iris', 'research.html'), 'utf8');
    expect(index).toContain('href="./research/cache-notes/page.html"');
    expect(index).toContain('cache · performance');

    const work = await readFile(path.join(cwd, 'iris', 'work.html'), 'utf8');
    expect(work).toContain('data-work-type="research"');
    expect(work).toContain('data-work-tags="cache, performance"');
    expect(work).toContain('data-work-priority="not set"');
    expect(work).toContain('href="./research/cache-notes/page.html"');
  });

  it('falls back honestly when front matter is missing or malformed', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await writeResearch(cwd, 'plain', '# Plain heading\n\nSome text.\n');
    await writeResearch(cwd, 'broken', '---\nstatus: nonsense\n---\n\n# Broken\n');

    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const plain = await readFile(path.join(cwd, 'iris', 'research', 'plain', 'page.html'), 'utf8');
    expect(plain).toContain('<h1>Plain heading</h1>');
    expect(plain).toContain('agent not set');
    expect(plain).toContain('updated not set');
    expect(plain).toContain('tags not set');

    const broken = await readFile(
      path.join(cwd, 'iris', 'research', 'broken', 'page.html'),
      'utf8',
    );
    expect(broken).toContain('Front matter warnings');

    const index = await readFile(path.join(cwd, 'iris', 'research.html'), 'utf8');
    expect(index).toContain('front-matter');
    expect(index).toContain('href="./research/plain/page.html"');
  });

  it('renders hostile markdown as inert text', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await writeResearch(
      cwd,
      'hostile',
      [
        '# Hostile',
        '',
        '<script>globalThis.pwned = true</script>',
        '',
        '[click](javascript:alert(1))',
        '',
        '![tracker](https://example.com/tracker.png)',
      ].join('\n'),
    );

    expect(await runCli(['render', '--all'], cwd)).toBe(0);
    const page = await readFile(path.join(cwd, 'iris', 'research', 'hostile', 'page.html'), 'utf8');
    expect(page).not.toContain('<script>globalThis.pwned = true</script>');
    expect(page).not.toContain('href="javascript:');
    expect(page).not.toContain('<img ');
    expect(page).toContain('Image: tracker (https://example.com/tracker.png)');
  });

  it('archives and publishes a research page', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await writeResearch(cwd, 'movable', '---\ntitle: Movable\n---\n\n## Body\n\ntext\n');
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    expect(await runCli(['publish', 'movable'], cwd)).toBe(0);
    const published = await readFile(
      path.join(cwd, 'iris', 'archive', 'movable-publish.html'),
      'utf8',
    );
    expect(published).not.toContain('data-iris-nav');
    expect(published).not.toContain('class="sidebar"');
    expect(published).toContain('Movable');

    expect(await runCli(['archive', 'movable'], cwd)).toBe(0);
    expect(existsSync(path.join(cwd, 'iris', 'archive', 'movable', 'index.md'))).toBe(true);
    expect(existsSync(path.join(cwd, 'iris', 'research', 'movable'))).toBe(false);

    const work = await readFile(path.join(cwd, 'iris', 'work.html'), 'utf8');
    expect(work).toContain('href="./archive/movable/page.html"');
  });

  it('skips unsafe or oversized sources with a path-specific warning', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await writeResearch(cwd, 'huge', `# Huge\n\n${'x'.repeat(300 * 1024)}`);
    await mkdir(path.join(cwd, 'iris', 'research', 'Bad Id'), { recursive: true });
    await writeFile(path.join(cwd, 'iris', 'research', 'Bad Id', 'index.md'), '# nope\n');
    await mkdir(path.join(cwd, 'iris', 'research', 'no-source'), { recursive: true });

    expect(await runCli(['render', '--all'], cwd)).toBe(0);
    const index = await readFile(path.join(cwd, 'iris', 'research.html'), 'utf8');
    expect(index).toContain('too-large');
    expect(index).toContain('invalid-id');
    expect(index).toContain('missing-source');
    expect(existsSync(path.join(cwd, 'iris', 'research', 'huge', 'page.html'))).toBe(false);
  });
});
