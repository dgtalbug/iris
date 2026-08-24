import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import { writeIndexPointer } from '../src/lib/indexing.js';
import { resolveProjectIdentity } from '../src/lib/user-config.js';
import { indexCardSection } from '../src/templates/pages/index-card.js';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

describe('index card template', () => {
  it('renders a single disabled line when indexing is off', () => {
    const html = indexCardSection({ status: 'disabled' });
    expect(html).toContain('Code index disabled');
    expect(html).not.toMatch(/gitnexus|mcp/i);
  });

  it('renders enabled stats and staleness without external tool names', () => {
    const html = indexCardSection({
      status: 'enabled',
      symbols: 120,
      flows: 8,
      lastIndexedSha: 'abcdef1234567890',
      staleness: 'stale (2 commits behind)',
    });
    expect(html).toContain('120');
    expect(html).toContain('8');
    expect(html).toContain('abcdef1');
    expect(html).toContain('stale (2 commits behind)');
    expect(html).not.toMatch(/gitnexus|mcp/i);
  });
});

describe('index card on rendered pages', () => {
  it('shows disabled on overview and commands when the pointer is absent', async () => {
    const cwd = await createTempDir('iris-index-card-disabled-');
    expect(await runCli(['init', '--yes', '--tools', 'none'], cwd)).toBe(0);

    for (const page of ['index.html', 'commands.html']) {
      const html = await readFile(path.join(cwd, 'iris', page), 'utf8');
      expect(html, page).toContain('Code index disabled');
      expect(html, page).not.toMatch(/gitnexus|mcp/i);
    }
  });

  it('shows enabled stats when index.json is present', async () => {
    const cwd = await createTempDir('iris-index-card-enabled-');
    expect(await runCli(['init', '--yes', '--tools', 'none'], cwd)).toBe(0);
    const identity = await resolveProjectIdentity(cwd);
    await writeIndexPointer(identity.id, {
      enabled: true,
      lastIndexedSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      symbols: 3331,
      flows: 224,
      indexedAt: '2026-08-24T00:00:00.000Z',
    });

    vi.spyOn(await import('../src/lib/indexing.js'), 'computeStaleness').mockResolvedValue(
      'up to date',
    );

    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    for (const page of ['index.html', 'commands.html']) {
      const html = await readFile(path.join(cwd, 'iris', page), 'utf8');
      expect(html, page).toContain('3331');
      expect(html, page).toContain('224');
      expect(html, page).toContain('up to date');
      expect(html, page).not.toMatch(/gitnexus|mcp/i);
    }
  });
});
