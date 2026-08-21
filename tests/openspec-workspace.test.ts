import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  loadOpenSpecSnapshot,
  parseOpenSpecWorkspace,
  writeOpenSpecSnapshot,
  type OpenSpecParseLimits,
  type OpenSpecSnapshot,
} from '../src/lib/openspec-workspace.js';

const tempDirs: string[] = [];
const fixtureRoot = path.resolve(import.meta.dirname, 'fixtures', 'openspec-workspace');
const defaultTestLimits: OpenSpecParseLimits = {
  maxDepth: 16,
  maxFiles: 1_000,
  maxFileBytes: 1024 * 1024,
  maxTotalBytes: 8 * 1024 * 1024,
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-openspec-'));
  tempDirs.push(cwd);
  return cwd;
}

async function fixtureProject(name: 'observed' | 'synthetic'): Promise<string> {
  const cwd = await tempProject();
  await cp(path.join(fixtureRoot, name, 'openspec'), path.join(cwd, 'openspec'), {
    recursive: true,
  });
  return cwd;
}

describe('OpenSpec workspace parser', () => {
  it('distinguishes absent and empty workspaces', async () => {
    const absent = await tempProject();
    expect(await parseOpenSpecWorkspace(absent)).toMatchObject({ detected: false });

    const empty = await tempProject();
    await mkdir(path.join(empty, 'openspec'));
    expect(await parseOpenSpecWorkspace(empty)).toMatchObject({
      detected: true,
      canonical_specs: [],
      active_changes: [],
      archived_changes: [],
      legacy_archives: [],
      warnings: [],
    });
  });

  it('normalizes every repository-observed layout and real task checkboxes', async () => {
    const snapshot = await parseOpenSpecWorkspace(await fixtureProject('observed'));

    expect(snapshot.context.project?.title).toBe('Fixture project');
    expect(snapshot.context.config?.path).toBe('config.yaml');
    expect(snapshot.canonical_specs.map((spec) => spec.capability)).toEqual(['core']);
    expect(snapshot.active_changes).toHaveLength(1);
    expect(snapshot.active_changes[0]).toMatchObject({
      name: 'active-change',
      lifecycle: 'active',
      completeness: 'incomplete',
      health: 'valid',
    });
    expect(snapshot.active_changes[0].artifacts.tasks?.progress).toEqual({
      complete: 1,
      open: 1,
      total: 2,
    });
    expect(snapshot.archived_changes[0]).toMatchObject({
      name: '2026-08-20-complete-change',
      lifecycle: 'archived',
      completeness: 'complete',
    });
    expect(snapshot.legacy_archives.map((document) => document.path)).toEqual([
      'changes/archive/2026-08-18-legacy.md',
    ]);
  });

  it('preserves nested capabilities and recognizes every delta operation fixture', async () => {
    const snapshot = await parseOpenSpecWorkspace(await fixtureProject('synthetic'));

    expect(snapshot.canonical_specs[0].capability).toBe('platform/identity/access');
    expect(snapshot.active_changes[0].delta_specs[0].capability).toBe('platform/identity/access');
    expect(snapshot.active_changes[0].delta_specs[0].document.operations).toEqual([
      'ADDED',
      'MODIFIED',
      'REMOVED',
      'RENAMED',
    ]);
  });

  it('isolates malformed and unreadable-shaped artifacts while retaining siblings', async () => {
    const cwd = await fixtureProject('observed');
    const proposalPath = path.join(cwd, 'openspec', 'changes', 'active-change', 'proposal.md');
    await rm(proposalPath);
    await mkdir(proposalPath);
    const specPath = path.join(cwd, 'openspec', 'specs', 'unsafe', 'spec.md');
    await mkdir(path.dirname(specPath), { recursive: true });
    await writeFile(specPath, '# <script>globalThis.pwned = true</script>\n');

    const snapshot = await parseOpenSpecWorkspace(cwd);
    expect(snapshot.canonical_specs.some((spec) => spec.capability === 'core')).toBe(true);
    expect(snapshot.active_changes[0]).toMatchObject({ completeness: 'incomplete' });
    expect(snapshot.warnings.map((item) => item.code)).toEqual(
      expect.arrayContaining(['unsupported-entry', 'malformed-spec']),
    );
    expect(
      snapshot.canonical_specs.find((spec) => spec.capability === 'unsafe')?.document.raw,
    ).toContain('<script>');
  });

  it('reports deterministic depth, file-count, file-size, and aggregate-size bounds', async () => {
    const cwd = await fixtureProject('observed');
    const cases: OpenSpecParseLimits[] = [
      { ...defaultTestLimits, maxDepth: 1 },
      { ...defaultTestLimits, maxFiles: 1 },
      { ...defaultTestLimits, maxFileBytes: 8 },
      { ...defaultTestLimits, maxTotalBytes: 8 },
    ];
    const codes = new Set<string>();
    for (const limits of cases) {
      for (const item of (await parseOpenSpecWorkspace(cwd, limits)).warnings) codes.add(item.code);
    }
    expect(codes).toEqual(
      new Set(['depth-limit', 'file-count-limit', 'file-size-limit', 'total-size-limit']),
    );
  });

  it.skipIf(process.platform === 'win32')('refuses symlinked OpenSpec entries', async () => {
    const cwd = await fixtureProject('observed');
    const outside = await tempProject();
    await writeFile(path.join(outside, 'spec.md'), '# Outside\n');
    await symlink(outside, path.join(cwd, 'openspec', 'specs', 'linked'));

    const snapshot = await parseOpenSpecWorkspace(cwd);
    expect(snapshot.warnings).toContainEqual(
      expect.objectContaining({ code: 'symlink-refused', path: 'specs/linked' }),
    );
    expect(snapshot.canonical_specs.some((spec) => spec.capability === 'linked')).toBe(false);
  });

  it.skipIf(process.platform === 'win32')(
    'refuses a symlinked OpenSpec workspace root',
    async () => {
      const cwd = await tempProject();
      const outside = await fixtureProject('observed');
      await symlink(path.join(outside, 'openspec'), path.join(cwd, 'openspec'));

      const snapshot = await parseOpenSpecWorkspace(cwd);
      expect(snapshot).toMatchObject({
        detected: true,
        canonical_specs: [],
        warnings: [expect.objectContaining({ code: 'symlink-refused', path: 'openspec' })],
      });
    },
  );

  it('writes deterministic snapshots atomically and degrades invalid generated state', async () => {
    const cwd = await fixtureProject('observed');
    const first = await writeOpenSpecSnapshot(cwd);
    const firstRaw = await readFile(path.join(cwd, 'iris', 'spec.json'), 'utf8');
    const second = await writeOpenSpecSnapshot(cwd);
    const secondRaw = await readFile(path.join(cwd, 'iris', 'spec.json'), 'utf8');

    expect(second).toEqual(first);
    expect(secondRaw).toBe(firstRaw);
    expect(await loadOpenSpecSnapshot(cwd)).toEqual(first);

    const legacyShape = JSON.parse(firstRaw) as OpenSpecSnapshot;
    delete legacyShape.canonical_specs[0].document.format;
    await writeFile(path.join(cwd, 'iris', 'spec.json'), `${JSON.stringify(legacyShape)}\n`);
    expect((await loadOpenSpecSnapshot(cwd)).canonical_specs[0].document.format).toBeUndefined();

    await writeFile(path.join(cwd, 'iris', 'spec.json'), '{"version":99}\n');
    expect(await loadOpenSpecSnapshot(cwd)).toMatchObject({
      detected: false,
      warnings: [expect.objectContaining({ code: 'snapshot-invalid' })],
    });
  });
});
