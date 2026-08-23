import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  PACKAGED_ASSETS,
  PACKAGE_FILES_ENTRIES,
  SOURCE_ASSETS,
  assetsMissingFromFilesField,
  assetsMissingFromPayload,
} from '../scripts/packaged-assets.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
const packageVersion = packageJson.version;

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

type ReleaseOverrides = {
  files?: string[];
  changelogVersion?: string;
  omitAssets?: string[];
};

/**
 * Builds the smallest tree `verify-release.mjs` inspects, so a payload defect can
 * be staged without mutating the repository the suite is running in.
 */
async function stageRelease(overrides: ReleaseOverrides = {}): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'iris-release-'));
  tempDirs.push(root);
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  for (const script of ['verify-release.mjs', 'packaged-assets.mjs']) {
    await copyFile(path.join(repoRoot, 'scripts', script), path.join(root, 'scripts', script));
  }
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify(
      {
        name: packageJson.name,
        version: packageVersion,
        files: overrides.files ?? PACKAGE_FILES_ENTRIES,
        publishConfig: { access: 'public' },
      },
      null,
      2,
    ),
  );
  await writeFile(
    path.join(root, 'CHANGELOG.md'),
    `# Changelog\n\n## [${overrides.changelogVersion ?? packageVersion}] - 2026-01-01\n`,
  );
  const omitted = new Set(overrides.omitAssets ?? []);
  for (const asset of SOURCE_ASSETS) {
    if (omitted.has(asset)) continue;
    await mkdir(path.join(root, path.dirname(asset)), { recursive: true });
    await writeFile(path.join(root, asset), '');
  }
  return root;
}

function verifyStaged(root: string, tag = `v${packageVersion}`): void {
  execFileSync('node', [path.join(root, 'scripts', 'verify-release.mjs'), tag], {
    cwd: root,
    stdio: 'pipe',
  });
}

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

  it('accepts a payload that declares every runtime asset', async () => {
    const root = await stageRelease();
    expect(assetsMissingFromFilesField(packageJson.files)).toEqual([]);
    expect(assetsMissingFromPayload(PACKAGED_ASSETS)).toEqual([]);
    expect(() => verifyStaged(root)).not.toThrow();
  });

  it('rejects a payload whose files field would omit an initialization asset', async () => {
    const files = PACKAGE_FILES_ENTRIES.filter((entry) => entry !== 'templates/project');
    expect(assetsMissingFromFilesField(files)).toContain('templates/project/hld.md');
    const root = await stageRelease({ files });
    expect(() => verifyStaged(root)).toThrow(/templates\/project/);
  });

  it('rejects a payload missing an initialization asset on disk', async () => {
    const missing = 'templates/project/overview.md';
    expect(assetsMissingFromPayload(PACKAGED_ASSETS.filter((asset) => asset !== missing))).toEqual([
      missing,
    ]);
    const root = await stageRelease({ omitAssets: [missing] });
    expect(() => verifyStaged(root)).toThrow(new RegExp(missing.replace(/[./]/g, '\\$&')));
  });

  it('rejects a release whose version has no changelog section', async () => {
    const root = await stageRelease({ changelogVersion: '9.9.9' });
    expect(() => verifyStaged(root)).toThrow(/CHANGELOG\.md has no section/);
  });

  it('lists every packaged template and schema in the shared manifest', async () => {
    const onDisk: string[] = [];
    for (const directory of ['templates', 'schemas']) {
      const entries = await readdir(path.join(repoRoot, directory), {
        recursive: true,
        withFileTypes: true,
      });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const parent = path.relative(repoRoot, entry.parentPath);
        onDisk.push(path.join(parent, entry.name).split(path.sep).join('/'));
      }
    }
    expect(onDisk.length).toBeGreaterThan(0);
    expect(onDisk.filter((asset) => !SOURCE_ASSETS.includes(asset))).toEqual([]);
  });

  it('keeps manual runs dry and grants only the publish job OIDC access', async () => {
    const workflow = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('id-token: write');
    expect(workflow).not.toContain('NPM_TOKEN');
    // Only publishing is gated on a real release; everything before it must run on a dispatch.
    expect(workflow).toMatch(
      /run: npm publish --access public --provenance\n\s+if: github\.event_name == 'release'\n/,
    );
    expect(workflow.match(/if: github\.event_name == 'release'/g)).toHaveLength(1);
  });

  it('verifies the payload on a manual dispatch using the package version', async () => {
    const workflow = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(workflow).toContain('RELEASE_TAG: ${{ github.event.release.tag_name }}');
    expect(workflow).toContain(
      'TAG="${RELEASE_TAG:-v$(node -p "require(\'./package.json\').version")}"',
    );
    expect(workflow).toContain('node scripts/verify-release.mjs "$TAG"');
  });

  it('serializes releases across tags and publishes on the Node version npm documents', async () => {
    const workflow = await readFile(path.join(repoRoot, '.github/workflows/release.yml'), 'utf8');
    expect(workflow).toContain('group: npm-release\n');
    expect(workflow).not.toMatch(/group: npm-release-\$\{\{/);
    expect(workflow).toContain('node-version: 22.14.0');
  });

  it('runs the formatting gate and more than one Node version in CI', async () => {
    const workflow = await readFile(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8');
    expect(workflow).toContain('- run: pnpm format');
    const matrix = workflow.match(/node-version: \[(.+)\]/)?.[1].split(',') ?? [];
    expect(matrix.length).toBeGreaterThan(1);
    expect(matrix[0]).toContain('22.13.0');
  });

  it('keeps dependency updates configured for both ecosystems', async () => {
    const dependabot = await readFile(path.join(repoRoot, '.github/dependabot.yml'), 'utf8');
    expect(dependabot).toContain('package-ecosystem: npm');
    expect(dependabot).toContain('package-ecosystem: github-actions');
  });

  it('ships the governance files a public release needs', async () => {
    for (const file of ['LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md']) {
      expect(existsSync(path.join(repoRoot, file)), `${file} is missing`).toBe(true);
    }
    expect(await readFile(path.join(repoRoot, 'LICENSE'), 'utf8')).toContain('MIT License');
    expect(packageJson.scripts.prepack).not.toMatch(/\b(npm|pnpm|yarn)\b/);
    expect(existsSync(path.join(repoRoot, 'package-lock.json'))).toBe(false);
  });
});
