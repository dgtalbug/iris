import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
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
});
