import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import { firstMermaidFence, loadProjectDocs, projectDocSkeleton } from '../src/lib/project-docs.js';
import { PROJECT_DOC_NAMES } from '../src/templates/common.js';

describe('project doc skeletons', () => {
  it('ships a front-mattered skeleton for every project doc', async () => {
    for (const name of PROJECT_DOC_NAMES) {
      const skeleton = await projectDocSkeleton(name, 'demo-app');
      expect(skeleton.startsWith('---\n'), name).toBe(true);
      expect(skeleton, name).toContain('status: draft');
      expect(skeleton, name).toContain('demo-app');
      expect(skeleton, name).not.toContain('__PROJECT__');
    }
  });

  it('carries the expected Mermaid diagram type per design doc', async () => {
    const hld = await projectDocSkeleton('hld', 'demo-app');
    expect(hld).toMatch(/```mermaid\nflowchart LR/);
    expect(hld).toContain('classDef focus');
    expect(hld).toContain('## System map');
    expect(await projectDocSkeleton('lld', 'demo-app')).toMatch(/```mermaid\nsequenceDiagram/);
    expect(await projectDocSkeleton('erd', 'demo-app')).toMatch(/```mermaid\nerDiagram/);
    expect(await projectDocSkeleton('overview', 'demo-app')).not.toContain('```mermaid');
    expect(await projectDocSkeleton('decisions', 'demo-app')).toMatch(
      /\| Date\s+\| Decision\s+\| Why\s+\| Status\s+\|/,
    );
  });

  it('keeps a quote in the project name from breaking a Mermaid label', async () => {
    const skeleton = await projectDocSkeleton('hld', 'my "quoted" app');
    expect(skeleton).toContain(`app["my 'quoted' app"]`);
  });

  it('preserves dollar signs in the project name without String.replace interpretation', async () => {
    const skeleton = await projectDocSkeleton('hld', 'weird$&name');
    expect(skeleton).toContain(`app["weird$&name"]`);
    expect(skeleton).not.toContain('__PROJECT__');
  });
});

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-project-docs-'));
  tempDirs.push(dir);
  return dir;
}

async function writeDoc(cwd: string, name: string, content: string): Promise<string> {
  const target = path.join(cwd, 'iris', 'project', `${name}.md`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
  return target;
}

describe('project doc loader', () => {
  it('loads only the five fixed sources, in catalog order, with front matter fallbacks', async () => {
    const cwd = await createTempDir();
    await writeDoc(cwd, 'lld', '# Inner workings\n\ntext\n');
    await writeDoc(
      cwd,
      'hld',
      '---\ntitle: System shape\nstatus: active\nupdated: 2026-08-22\n---\n\n## Map\n\n```mermaid\nflowchart LR\n  A --> B\n```\n',
    );
    await writeDoc(cwd, 'notes', '# ignored\n');

    const snapshot = await loadProjectDocs(cwd);

    expect(snapshot.items.map((item) => item.name)).toEqual(['hld', 'lld']);
    const [hld, lld] = snapshot.items;
    expect(hld.title).toBe('System shape');
    expect(hld.status).toBe('active');
    expect(hld.updated).toBe('2026-08-22');
    expect(hld.agent).toBe('not set');
    expect(hld.path).toBe('iris/project/hld.md');
    expect(lld.title).toBe('Inner workings');
    expect(lld.status).toBe('draft');
    expect(firstMermaidFence(hld.body)).toBe('flowchart LR\n  A --> B');
    expect(firstMermaidFence(lld.body)).toBeNull();
    expect(snapshot.warnings).toEqual([]);
  });

  it('falls back to the doc label when neither front matter nor a heading names it', async () => {
    const cwd = await createTempDir();
    await writeDoc(cwd, 'erd', 'just text\n');
    const { items } = await loadProjectDocs(cwd);
    expect(items[0].title).toBe('ERD');
  });

  it('returns nothing for a project without iris/project', async () => {
    const cwd = await createTempDir();
    expect(await loadProjectDocs(cwd)).toEqual({ items: [], warnings: [] });
  });

  it('warns about symlinked, oversized, and malformed sources without throwing', async () => {
    const cwd = await createTempDir();
    const hld = await writeDoc(cwd, 'hld', '# HLD\n');
    await symlink(hld, path.join(cwd, 'iris', 'project', 'lld.md'));
    await writeDoc(cwd, 'erd', `# ERD\n${'x'.repeat(256 * 1024 + 1)}\n`);
    await writeDoc(cwd, 'decisions', '---\nupdated: not-a-date\n---\n\n# Decisions\n');

    const snapshot = await loadProjectDocs(cwd);

    expect(snapshot.items.map((item) => item.name)).toEqual(['hld', 'decisions']);
    expect(snapshot.warnings.map((warning) => [warning.code, warning.path])).toEqual([
      ['symlink', 'iris/project/lld.md'],
      ['too-large', 'iris/project/erd.md'],
      ['front-matter', 'iris/project/decisions.md'],
    ]);
    expect(snapshot.warnings[2].message).toContain('not an ISO date');
    expect(snapshot.items[1].warnings).toHaveLength(1);
  });

  it.skipIf(process.getuid?.() === 0)(
    'warns instead of silently skipping when a source cannot be inspected',
    async () => {
      const cwd = await createTempDir();
      await writeDoc(cwd, 'hld', '# HLD\n');
      const root = path.join(cwd, 'iris', 'project');
      await chmod(root, 0o000);
      try {
        const snapshot = await loadProjectDocs(cwd);
        expect(snapshot.items).toEqual([]);
        expect(snapshot.warnings.map((warning) => warning.code)).toEqual(
          PROJECT_DOC_NAMES.map(() => 'unreadable'),
        );
        expect(snapshot.warnings[0].path).toBe('iris/project/overview.md');
      } finally {
        await chmod(root, 0o755);
      }
    },
  );
});

function captureStderr(): { lines: string[]; restore: () => void } {
  const lines: string[] = [];
  const spy = vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: unknown) => {
    lines.push(String(chunk));
    return true;
  }) as typeof process.stderr.write);
  return { lines, restore: () => spy.mockRestore() };
}

describe('project docs workspace', () => {
  it('scaffolds five Markdown sources on init and renders them as managed pages', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    for (const name of PROJECT_DOC_NAMES) {
      expect(existsSync(path.join(cwd, 'iris', 'project', `${name}.md`)), name).toBe(true);
      const html = await readFile(path.join(cwd, 'iris', 'project', `${name}.html`), 'utf8');
      expect(html, name).toContain('data-iris-managed');
      expect(html, name).toContain('href="../index.html"');
      expect(html, name).toContain(`iris/project/${name}.md`);
      expect(html, name).not.toContain('not written yet');
    }

    const hld = await readFile(path.join(cwd, 'iris', 'project', 'hld.html'), 'utf8');
    expect(hld).toContain('<h1>HLD</h1>');
    expect(hld).toContain('data-mermaid-figure');
    expect(hld).toContain('<h2 id="system-map">System map</h2>');
    expect(hld).toContain('aria-label="On this page"');
    expect(hld).toContain('href="./lld.html"');
    expect(hld).toContain('design/vendor/mermaid.min.js');

    const overview = await readFile(path.join(cwd, 'iris', 'project', 'overview.html'), 'utf8');
    expect(overview).not.toContain('data-mermaid-figure');
  });

  it('keeps an edited source across init and update, and re-renders from it', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    const source = path.join(cwd, 'iris', 'project', 'hld.md');
    const edited =
      '---\ntitle: Real shape\nstatus: active\n---\n\n## Map\n\n```mermaid\nflowchart LR\n  cli --> renderer\n```\n';
    await writeFile(source, edited, 'utf8');

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await readFile(source, 'utf8')).toBe(edited);
    expect(await runCli(['update'], cwd)).toBe(0);
    expect(await readFile(source, 'utf8')).toBe(edited);

    const html = await readFile(path.join(cwd, 'iris', 'project', 'hld.html'), 'utf8');
    expect(html).toContain('<h1>Real shape</h1>');
    expect(html).toContain('cli --&gt; renderer');
  });

  it('preserves a user-owned HTML page, does not scaffold over it, and says how to migrate', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await rm(path.join(cwd, 'iris', 'project', 'hld.md'));
    const page = path.join(cwd, 'iris', 'project', 'hld.html');
    await writeFile(page, '<!doctype html><title>mine</title>', 'utf8');

    const stderr = captureStderr();
    try {
      expect(await runCli(['update'], cwd)).toBe(0);
    } finally {
      stderr.restore();
    }

    expect(existsSync(path.join(cwd, 'iris', 'project', 'hld.md'))).toBe(false);
    expect(await readFile(page, 'utf8')).toBe('<!doctype html><title>mine</title>');
    expect(stderr.lines.join('')).toContain(
      'preserved user-owned iris/project/hld.html; move its content to iris/project/hld.md to let Iris render it',
    );
    const index = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(index).toContain('href="./project/hld.html"');
  });

  it('surfaces front-matter warnings on the page and on stderr during render', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    await writeFile(
      path.join(cwd, 'iris', 'project', 'erd.md'),
      '---\nupdated: not-a-date\n---\n\n# ERD\n\ntext\n',
      'utf8',
    );

    const stderr = captureStderr();
    try {
      expect(await runCli(['render', '--all'], cwd)).toBe(0);
    } finally {
      stderr.restore();
    }

    const html = await readFile(path.join(cwd, 'iris', 'project', 'erd.html'), 'utf8');
    expect(html).toContain('Front matter warnings');
    expect(html).toContain('is not an ISO date');
    expect(stderr.lines.join('')).toContain('iris/project/erd.md');
  });

  it('writes no project pages when the project has no iris/project directory', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['bug', 'some-bug'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);
    expect(existsSync(path.join(cwd, 'iris', 'project'))).toBe(false);
  });
});
