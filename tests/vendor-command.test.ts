import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import { MERMAID_VERSION } from '../src/commands/vendor.js';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-vendor-'));
  tempDirs.push(dir);
  return dir;
}

describe('vendor command', () => {
  it('requires an initialized workspace without creating a partial one', async () => {
    const cwd = await createTempDir();
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    expect(await runCli(['vendor'], cwd)).toBe(1);
    expect(stderr).toHaveBeenCalledWith(
      expect.stringContaining("run 'iris init' before 'iris vendor'"),
    );
    await expect(stat(path.join(cwd, 'iris'))).rejects.toThrow();
  });

  it('installs and refreshes the pinned browser bundle and upstream license', async () => {
    const cwd = await createTempDir();
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['vendor'], cwd)).toBe(0);

    const vendorRoot = path.join(cwd, 'iris', 'design', 'vendor');
    const bundlePath = path.join(vendorRoot, 'mermaid.min.js');
    const licensePath = path.join(vendorRoot, 'LICENSE.mermaid.txt');
    const [bundle, license] = await Promise.all([
      readFile(bundlePath, 'utf8'),
      readFile(licensePath, 'utf8'),
    ]);
    expect(bundle.length).toBeGreaterThan(1_000_000);
    expect(bundle).toContain('mermaid');
    expect(license).toContain('MIT License');
    expect(stdout).toHaveBeenCalledWith(`vendored Mermaid ${MERMAID_VERSION}\n`);

    await writeFile(bundlePath, 'stale bytes');
    expect(await runCli(['vendor'], cwd)).toBe(0);
    expect(await readFile(bundlePath, 'utf8')).toBe(bundle);
  });
});
