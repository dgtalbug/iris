import { existsSync, readFileSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';
import { renderDocument } from '../src/lib/markdown.js';
import {
  encodeSpecBundle,
  specRecordHash,
  specRecordKey,
  type SpecRecord,
} from '../src/templates/pages/spec-detail.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function fixtureProject(fixture: 'observed' | 'synthetic'): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-spec-bundle-'));
  tempDirs.push(cwd);
  await cp(
    path.join(process.cwd(), 'tests', 'fixtures', 'openspec-workspace', fixture, 'openspec'),
    path.join(cwd, 'openspec'),
    { recursive: true },
  );
  return cwd;
}

/** Evaluates the generated bundle the way a browser would, with a fake global. */
function loadBundle(cwd: string): Record<string, SpecRecord> {
  const source = readFileSync(path.join(cwd, 'iris', 'spec', 'data.js'), 'utf8');
  const scope: { IRIS_SPEC?: { records: Record<string, SpecRecord> } } = {};
  new Function('globalThis', source)(scope);
  return scope.IRIS_SPEC?.records ?? {};
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
  });

  it('keeps ids unique within one document and distinct across prefixes', () => {
    const repeated = renderDocument('## Why\n\na\n\n## Why\n\nb\n', { idPrefix: 'design' });
    expect(repeated.headings.map((heading) => heading.id)).toEqual(['design-why', 'design-why-2']);
    expect(renderDocument('## Why\n\na\n', { idPrefix: 'tasks' }).headings[0].id).toBe('tasks-why');
  });
});

describe('spec bundle encoding', () => {
  it('makes script and comment terminators inexpressible while round-tripping exactly', () => {
    const html =
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><!-- c --></script><script>alert(2)</script>';
    const record: SpecRecord = {
      kind: 'legacy',
      name: 'hostile',
      title: 'Hostile',
      path: 'changes/archive/hostile.md',
      html,
    };
    const bundle = encodeSpecBundle({ [specRecordKey('legacy', 'hostile')]: record });

    expect(bundle).not.toContain('</script>');
    expect(bundle).not.toContain('<script');
    expect(bundle).not.toContain('<!--');
    expect(bundle).not.toMatch(/</);

    const scope: { IRIS_SPEC?: { records: Record<string, SpecRecord> } } = {};
    new Function('globalThis', bundle)(scope);
    expect(scope.IRIS_SPEC?.records['legacy:hostile'].html).toBe(html);
  });

  it('escapes the line separators that are legal JSON but illegal in JavaScript', () => {
    const html = `a b c`;
    const bundle = encodeSpecBundle({
      'legacy:sep': { kind: 'legacy', name: 'sep', title: 'S', path: 'p', html },
    });
    expect(bundle).not.toContain(' ');
    expect(bundle).not.toContain(' ');
    const scope: { IRIS_SPEC?: { records: Record<string, SpecRecord> } } = {};
    new Function('globalThis', bundle)(scope);
    expect(scope.IRIS_SPEC?.records['legacy:sep'].html).toBe(html);
  });

  it('addresses records by kind and name', () => {
    expect(specRecordKey('capability', 'core')).toBe('capability:core');
    expect(specRecordHash('capability', 'platform/identity/access')).toBe(
      '#/capability/platform/identity/access',
    );
    expect(specRecordHash('change', 'add-auth')).toBe('#/change/add-auth');
  });
});

describe('generated spec bundle', () => {
  it('resolves every index row to a bundle record', async () => {
    const cwd = await fixtureProject('observed');
    expect(await runCli(['init'], cwd)).toBe(0);

    const index = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    const records = loadBundle(cwd);
    const hashes = [...index.matchAll(/href="#\/([^"]+)"/g)].map((match) => match[1]);

    expect(hashes.length).toBeGreaterThan(0);
    for (const hash of hashes) {
      const [kind, ...rest] = hash.split('/');
      const key = `${kind}:${rest.join('/')}`;
      expect(records[key], `bundle is missing ${key}`).toBeDefined();
    }
    expect(existsSync(path.join(cwd, 'iris', 'spec', 'data.js'))).toBe(true);
  });

  it('no longer generates a file per record', async () => {
    const cwd = await fixtureProject('observed');
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(existsSync(path.join(cwd, 'iris', 'spec', 'capabilities'))).toBe(false);
    expect(existsSync(path.join(cwd, 'iris', 'spec', 'changes'))).toBe(false);
    expect(existsSync(path.join(cwd, 'iris', 'spec', 'legacy'))).toBe(false);
  });

  it('carries nested capability paths as one record', async () => {
    const cwd = await fixtureProject('synthetic');
    expect(await runCli(['init'], cwd)).toBe(0);

    const records = loadBundle(cwd);
    const nested = records['capability:platform/identity/access'];
    expect(nested).toBeDefined();
    expect(nested.path).toContain('platform/identity/access');

    const index = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    expect(index).toContain('href="#/capability/platform/identity/access"');
  });

  it('gives a change record one namespace per artifact and a table of contents', async () => {
    const cwd = await fixtureProject('synthetic');
    expect(await runCli(['init'], cwd)).toBe(0);

    const record = loadBundle(cwd)['change:all-operations'];
    expect(record).toBeDefined();
    expect(record.html).toContain('id="proposal-artifact"');
    expect(record.html).toContain('id="design-artifact"');
    expect(record.html).toContain('id="tasks-artifact"');
    expect(record.html).toContain('aria-label="On this page"');
    expect(record.html).toContain('data-spec-back');

    const ids = [...record.html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size, 'ids within one record must be unique').toBe(ids.length);
  });

  it('states missing artifacts instead of hiding them', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-spec-partial-'));
    tempDirs.push(cwd);
    const change = path.join(cwd, 'openspec', 'changes', 'partial-change');
    await mkdir(change, { recursive: true });
    await writeFile(path.join(change, 'proposal.md'), '## Why\n\nOnly a proposal.\n');

    expect(await runCli(['init'], cwd)).toBe(0);
    const record = loadBundle(cwd)['change:partial-change'];
    expect(record.html).toContain('Only a proposal.');
    expect(record.html).toContain('This artifact is missing from the change directory.');
  });

  it('keeps the index complete and script-independent', async () => {
    const cwd = await fixtureProject('observed');
    expect(await runCli(['init'], cwd)).toBe(0);

    const index = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    expect(index).toContain('<noscript>');
    expect(index).toContain('needs JavaScript');
    // Source paths are the fallback: the listing still says what exists and where.
    expect(index).toContain('openspec/specs/core/spec.md'.replace('openspec/', ''));
    expect(index).not.toContain('spec-document');
    expect(index).toContain('data-spec-detail');
    expect(index).toContain('<script defer src="./spec/data.js">');
  });
});
