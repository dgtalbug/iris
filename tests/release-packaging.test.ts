import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '..');
const packageVersion = JSON.parse(
  await readFile(path.join(repoRoot, 'package.json'), 'utf8'),
).version;

describe('npm release packaging', () => {
  it('accepts the tag matching the package version', () => {
    expect(() =>
      execFileSync('node', ['scripts/verify-release.mjs', `v${packageVersion}`], {
        cwd: repoRoot,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  });

  it('rejects a release tag that does not match package metadata', () => {
    expect(() =>
      execFileSync('node', ['scripts/verify-release.mjs', 'v9.9.9'], {
        cwd: repoRoot,
        stdio: 'pipe',
      }),
    ).toThrow(/does not match package version/);
  });

  it('keeps manual runs dry and grants only the publish job OIDC access', async () => {
    const workflow = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain("if: github.event_name == 'release'");
    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('npm publish --access public --provenance');
    expect(workflow).not.toContain('NPM_TOKEN');
  });
});
