import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import {
  globalDashboardPath,
  globalDesignRoot,
  loadGlobalDashboardModel,
  refreshGlobalDashboard,
  shouldRefreshGlobalDashboard,
} from '../src/lib/global-registry.js';
import { writeIndexPointer } from '../src/lib/indexing.js';
import {
  projectStatePath,
  registerProject,
  resolveProjectIdentity,
} from '../src/lib/user-config.js';
import { createProjectState } from '../src/lib/project-state.js';

const tempDirs: string[] = [];
let home: string;

beforeEach(async () => {
  home = await mkdtemp(path.join(os.tmpdir(), 'iris-global-registry-'));
  tempDirs.push(home);
  vi.stubEnv('IRIS_HOME', home);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(prefix = 'iris-global-project-'): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(cwd);
  return cwd;
}

async function initProject(cwd: string): Promise<string> {
  expect(await runCli(['init', '--yes', '--tools', 'none'], cwd)).toBe(0);
  const identity = await resolveProjectIdentity(cwd);
  return identity.id;
}

describe('global registry aggregation', () => {
  it('aggregates page counts and recent activity from per-project state', async () => {
    const cwd = await tempProject();
    const projectId = await initProject(cwd);
    const state = createProjectState();
    state.page_index = {
      'bug-one': {
        id: 'bug-one',
        type: 'bug',
        title: 'Cache stampede',
        status: 'active',
      },
      'feature-two': {
        id: 'feature-two',
        type: 'feature',
        title: 'Login flow',
        status: 'active',
      },
      'old-page': {
        id: 'old-page',
        type: 'report',
        title: 'Archived report',
        status: 'archived',
      },
    };
    await writeFile(projectStatePath(projectId), `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    const model = await loadGlobalDashboardModel();
    expect(model.projectCount).toBe(1);
    expect(model.totalPages).toBe(3);
    expect(model.projects[0]).toMatchObject({
      id: projectId,
      pageCounts: { total: 3, active: 2, archived: 1 },
      stale: false,
    });
    expect(model.projects[0].recentActivity.map((item) => item.id)).toEqual([
      'feature-two',
      'bug-one',
      'old-page',
    ]);
  });

  it('marks a project stale when its root directory is missing', async () => {
    const cwd = await tempProject();
    const projectId = await initProject(cwd);
    await registerProject(cwd);
    await rm(cwd, { recursive: true, force: true });

    const model = await loadGlobalDashboardModel();
    expect(model.projects).toHaveLength(1);
    expect(model.projects[0]).toMatchObject({ id: projectId, stale: true });
  });

  it('omits index status when the pointer is absent', async () => {
    const cwd = await tempProject();
    await initProject(cwd);

    const model = await loadGlobalDashboardModel();
    expect(model.projects[0].indexStatus).toEqual({ present: false });
  });

  it('includes index status when the pointer is present', async () => {
    const cwd = await tempProject();
    const projectId = await initProject(cwd);
    await writeIndexPointer(projectId, {
      enabled: true,
      lastIndexedSha: 'abc1234567890abc1234567890abc1234567890',
      symbols: 120,
      flows: 8,
      indexedAt: '2026-08-24T00:00:00.000Z',
    });

    const model = await loadGlobalDashboardModel();
    expect(model.projects[0].indexStatus).toMatchObject({
      present: true,
      enabled: true,
      symbols: 120,
      flows: 8,
    });
  });

  it('skips global refresh when only one project is registered', async () => {
    const cwd = await tempProject();
    await initProject(cwd);
    expect(await shouldRefreshGlobalDashboard()).toBe(false);
  });

  it('requests global refresh when more than one project is registered', async () => {
    const first = await tempProject('iris-global-a-');
    const second = await tempProject('iris-global-b-');
    await initProject(first);
    await initProject(second);
    expect(await shouldRefreshGlobalDashboard()).toBe(true);
  });
});

describe('global dashboard refresh smoke', () => {
  it('writes dashboard.html and design assets for a multi-project machine', async () => {
    const first = await tempProject('iris-global-smoke-a-');
    const second = await tempProject('iris-global-smoke-b-');
    const firstId = await initProject(first);
    const secondId = await initProject(second);

    await writeFile(
      projectStatePath(firstId),
      `${JSON.stringify(
        {
          version: 2,
          page_index: {
            alpha: { id: 'alpha', type: 'bug', title: 'Alpha bug', status: 'active' },
          },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    await writeFile(
      projectStatePath(secondId),
      `${JSON.stringify(
        {
          version: 2,
          page_index: {
            beta: { id: 'beta', type: 'feature', title: 'Beta feature', status: 'active' },
          },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    expect(await runCli(['render', '--all'], first)).toBe(0);

    expect(existsSync(globalDashboardPath())).toBe(true);
    expect(existsSync(path.join(globalDesignRoot(), 'tokens.css'))).toBe(true);
    expect(existsSync(path.join(globalDesignRoot(), 'components', 'base.css'))).toBe(true);
    expect(existsSync(path.join(globalDesignRoot(), 'components', 'base.js'))).toBe(true);

    const html = await readFile(globalDashboardPath(), 'utf8');
    expect(html).toContain('All projects');
    expect(html).toContain(firstId);
    expect(html).toContain(secondId);
    expect(html).toContain('Alpha bug');
    expect(html).toContain('Beta feature');
    expect(html).not.toMatch(/gitnexus|mcp/i);
  });

  it('does not write the global dashboard on a single-project render --all', async () => {
    const cwd = await tempProject('iris-global-single-');
    await initProject(cwd);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);
    expect(existsSync(globalDashboardPath())).toBe(false);
  });

  it('refreshGlobalDashboard degrades gracefully without index.json', async () => {
    const first = await tempProject('iris-global-no-index-a-');
    const second = await tempProject('iris-global-no-index-b-');
    await initProject(first);
    await initProject(second);

    await expect(refreshGlobalDashboard()).resolves.toBeUndefined();
    const html = await readFile(globalDashboardPath(), 'utf8');
    expect(html).not.toContain('symbols ·');
  });

  it('leaves the prior dashboard in place when refresh fails', async () => {
    const first = await tempProject('iris-global-fail-a-');
    const second = await tempProject('iris-global-fail-b-');
    await initProject(first);
    await initProject(second);
    await refreshGlobalDashboard();
    const before = await readFile(globalDashboardPath(), 'utf8');

    const registry = await import('../src/lib/global-registry.js');
    vi.spyOn(registry, 'refreshGlobalDashboard').mockRejectedValueOnce(new Error('disk full'));

    expect(await runCli(['render', '--all'], first)).toBe(0);
    expect(await readFile(globalDashboardPath(), 'utf8')).toBe(before);
    vi.restoreAllMocks();
  });
});
