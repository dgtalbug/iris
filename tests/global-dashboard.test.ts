import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GlobalDashboardModel } from '../src/lib/global-registry.js';
import {
  globalDashboardContent,
  renderGlobalDashboardHtml,
} from '../src/templates/pages/global-dashboard.js';

const tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function sampleModel(overrides: Partial<GlobalDashboardModel> = {}): GlobalDashboardModel {
  return {
    theme: 'dark',
    projectCount: 1,
    totalPages: 2,
    projects: [
      {
        id: 'iris-a1b2c3d4',
        name: 'iris',
        root: '/tmp/iris-project',
        remote: 'github.com/example/iris',
        lastSeen: '2026-08-24T12:00:00.000Z',
        stale: false,
        pageCounts: { total: 2, active: 2, archived: 0 },
        recentActivity: [{ id: 'bug-one', type: 'bug', title: 'Cache stampede', status: 'active' }],
        indexStatus: { present: false },
        dashboardHref: '/tmp/iris-project/iris/index.html',
      },
    ],
    ...overrides,
  };
}

describe('global dashboard template', () => {
  it('renders a self-contained offline document with Electric shell assets', () => {
    const html = renderGlobalDashboardHtml(sampleModel());
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('href="./design/tokens.css"');
    expect(html).toContain('href="./design/components/base.css"');
    expect(html).toContain('<script defer src="./design/components/base.js">');
    expect(html).not.toContain('https://');
    expect(html).not.toContain('<script src="http');
  });

  it('lists project metadata, page counts, and recent activity', () => {
    const html = globalDashboardContent(sampleModel());
    expect(html).toContain('iris-a1b2c3d4');
    expect(html).toContain('/tmp/iris-project');
    expect(html).toContain('github.com/example/iris');
    expect(html).toContain('2026-08-24');
    expect(html).toContain('Cache stampede');
    expect(html).toContain('2');
    expect(html).toContain('active');
  });

  it('shows index status when present and omits the row when absent', () => {
    const withoutIndex = globalDashboardContent(sampleModel());
    expect(withoutIndex).not.toContain('symbols ·');

    const withIndex = globalDashboardContent(
      sampleModel({
        projects: [
          {
            ...sampleModel().projects[0],
            indexStatus: {
              present: true,
              enabled: true,
              symbols: 3331,
              flows: 224,
              staleness: 'up to date',
            },
          },
        ],
      }),
    );
    expect(withIndex).toContain('3331');
    expect(withIndex).toContain('224');
    expect(withIndex).toContain('up to date');
    expect(withIndex).not.toMatch(/gitnexus|mcp/i);
  });

  it('marks stale projects and avoids dashboard links', () => {
    const html = globalDashboardContent(
      sampleModel({
        projects: [
          {
            ...sampleModel().projects[0],
            stale: true,
          },
        ],
      }),
    );
    expect(html).toContain('stale — root missing');
    expect(html).toContain('dashboard unavailable');
    expect(html).not.toContain('Open project dashboard');
  });

  it('uses the global sidebar mode', () => {
    const html = renderGlobalDashboardHtml(sampleModel());
    expect(html).toContain('all projects');
    expect(html).toContain('aria-label="Global dashboard"');
    expect(html).not.toContain('aria-label="Workspace sections"');
  });
});

describe('open --global smoke', () => {
  it('opens the global dashboard when it exists', async () => {
    const { mkdir, writeFile } = await import('node:fs/promises');
    const { runOpenCommand } = await import('../src/commands/open.js');
    const { globalDashboardPath } = await import('../src/lib/global-registry.js');

    const home = await mkdtemp(path.join(os.tmpdir(), 'iris-open-global-'));
    tempDirs.push(home);
    vi.stubEnv('IRIS_HOME', home);
    await mkdir(path.dirname(globalDashboardPath()), { recursive: true });
    await writeFile(globalDashboardPath(), '<!doctype html><title>global</title>\n', 'utf8');

    const invocations: string[] = [];
    await runOpenCommand(
      '/tmp/unused',
      async (command, args) => {
        invocations.push([command, ...args].join(' '));
      },
      { global: true },
    );

    expect(invocations).toHaveLength(1);
    expect(invocations[0]).toContain(globalDashboardPath());
  });
});
