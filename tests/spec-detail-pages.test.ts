import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { renderDocument } from '../src/lib/markdown.js';
import { specDetailDepth, specDetailPath } from '../src/templates/pages/spec-detail.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function fixtureProject(fixture: 'observed' | 'synthetic'): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-spec-detail-'));
  tempDirs.push(cwd);
  await cp(
    path.join(process.cwd(), 'tests', 'fixtures', 'openspec-workspace', fixture, 'openspec'),
    path.join(cwd, 'openspec'),
    { recursive: true },
  );
  return cwd;
}

describe('heading id prefixes', () => {
  it('namespaces ids so documents can share one page', () => {
    const source = '## Why\n\ntext\n\n### Detail\n\nmore\n';
    const plain = renderDocument(source);
    const prefixed = renderDocument(source, { idPrefix: 'proposal' });

    expect(plain.html).toContain('<h2 id="why">');
    expect(prefixed.html).toContain('<h2 id="proposal-why">');
    expect(prefixed.headings.map((heading) => heading.id)).toEqual([
      'proposal-why',
      'proposal-detail',
    ]);
    expect(plain.headings.map((heading) => heading.id)).toEqual(['why', 'detail']);
  });

  it('keeps ids unique within one document and distinct across prefixes', () => {
    const repeated = renderDocument('## Why\n\na\n\n## Why\n\nb\n', { idPrefix: 'design' });
    expect(repeated.headings.map((heading) => heading.id)).toEqual(['design-why', 'design-why-2']);
    const other = renderDocument('## Why\n\na\n', { idPrefix: 'tasks' });
    expect(other.headings[0].id).toBe('tasks-why');
  });
});

describe('spec detail page paths', () => {
  it('separates namespaces and preserves nested capability paths', () => {
    expect(specDetailPath('capability', 'core')).toBe('spec/capabilities/core/page.html');
    expect(specDetailPath('capability', 'platform/identity/access')).toBe(
      'spec/capabilities/platform/identity/access/page.html',
    );
    expect(specDetailPath('change', 'add-auth')).toBe('spec/changes/add-auth/page.html');
    expect(specDetailPath('legacy', '2026-08-18-legacy')).toBe(
      'spec/legacy/2026-08-18-legacy/page.html',
    );
  });

  it('refuses unsafe path segments', () => {
    for (const unsafe of ['../escape', 'a/../b', 'has space', '', '/', 'x/..']) {
      expect(specDetailPath('capability', unsafe), unsafe).toBeUndefined();
    }
  });

  it('derives depth from the generated path', () => {
    expect(specDetailDepth('spec/capabilities/core/page.html')).toBe(3);
    expect(specDetailDepth('spec/capabilities/platform/identity/access/page.html')).toBe(5);
  });
});

describe('generated spec detail pages', () => {
  it('links every index row to a detail page that exists', async () => {
    const cwd = await fixtureProject('observed');
    expect(await runCli(['init'], cwd)).toBe(0);

    const index = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    const links = [...index.matchAll(/href="\.\/(spec\/[^"]+\/page\.html)"/g)].map(
      (match) => match[1],
    );
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(existsSync(path.join(cwd, 'iris', link)), link).toBe(true);
    }
  });

  it('renders a nested capability path at the right depth', async () => {
    const cwd = await fixtureProject('synthetic');
    expect(await runCli(['init'], cwd)).toBe(0);

    const nested = path.join(
      cwd,
      'iris',
      'spec',
      'capabilities',
      'platform',
      'identity',
      'access',
      'page.html',
    );
    expect(existsSync(nested)).toBe(true);
    const html = await readFile(nested, 'utf8');
    // Five directories deep: assets and navigation must resolve back to iris/.
    expect(html).toContain('href="../../../../../design/tokens.css"');
    expect(html).toContain('href="../../../../../spec.html"');
    expect(html).toContain('aria-current="page"');
  });

  it('gives a change page one namespace per artifact and a table of contents', async () => {
    const cwd = await fixtureProject('synthetic');
    expect(await runCli(['init'], cwd)).toBe(0);

    const page = await readFile(
      path.join(cwd, 'iris', 'spec', 'changes', 'all-operations', 'page.html'),
      'utf8',
    );
    expect(page).toContain('id="proposal-artifact"');
    expect(page).toContain('id="design-artifact"');
    expect(page).toContain('id="tasks-artifact"');
    expect(page).toContain('aria-label="On this page"');
    expect(page).toContain('&larr; Spec index');

    const ids = [...page.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size, 'ids on a change page must be unique').toBe(ids.length);
  });

  it('states missing artifacts instead of hiding them', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-spec-partial-'));
    tempDirs.push(cwd);
    const change = path.join(cwd, 'openspec', 'changes', 'partial-change');
    await mkdir(change, { recursive: true });
    await writeFile(path.join(change, 'proposal.md'), '## Why\n\nOnly a proposal.\n');

    expect(await runCli(['init'], cwd)).toBe(0);
    const page = await readFile(
      path.join(cwd, 'iris', 'spec', 'changes', 'partial-change', 'page.html'),
      'utf8',
    );
    expect(page).toContain('Only a proposal.');
    expect(page).toContain('This artifact is missing from the change directory.');
  });

  it('keeps the index free of artifact bodies', async () => {
    const cwd = await fixtureProject('observed');
    expect(await runCli(['init'], cwd)).toBe(0);

    const index = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    const detail = await readFile(
      path.join(cwd, 'iris', 'spec', 'changes', 'active-change', 'page.html'),
      'utf8',
    );
    expect(index).not.toContain('spec-document');
    expect(index).not.toContain('<summary>Exact source</summary>');
    expect(detail).toContain('<summary>Exact source</summary>');
    expect(index.length).toBeLessThan(detail.length * 2);
  });
});
