import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-work-board-'));
  tempDirs.push(dir);
  return dir;
}

async function updateContract(
  cwd: string,
  id: string,
  update: (payload: Record<string, unknown>) => void,
): Promise<void> {
  const dataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');
  const payload = JSON.parse(await readFile(dataPath, 'utf8')) as Record<string, unknown>;
  update(payload);
  await writeFile(dataPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

describe('dense Work board', () => {
  it('projects honest contract metadata into List, Table, Kanban, and one detail drawer', async () => {
    const cwd = await createTempDir();
    for (const [kind, id] of [
      ['bug', 'cache-stampede'],
      ['feature', 'guided-onboarding'],
      ['idea', 'search-ranking'],
      ['plan', 'release-train'],
      ['report', 'weekly-review'],
    ] as const) {
      expect(await runCli([kind, id], cwd)).toBe(0);
    }

    await updateContract(cwd, 'cache-stampede', (payload) => {
      const sections = payload.sections as Record<string, unknown>;
      const symptom = sections.symptom as Record<string, unknown>;
      const timeline = sections.timeline as Record<string, unknown>;
      payload.title = 'Cache "stampede" during warmup';
      payload.status = 'active';
      payload.agent = 'codex';
      payload.updated = '2026-08-21T08:30:00.000Z';
      payload.tags = ['cache', 'production'];
      symptom.md = 'Requests spike when a cold region begins serving traffic.';
      sections.severity = 'p0';
      (timeline.events as Array<Record<string, string>>).push({
        t: '5m',
        title: 'Added jitter',
        level: 'warn',
      });
    });
    await updateContract(cwd, 'guided-onboarding', (payload) => {
      const sections = payload.sections as Record<string, unknown>;
      const goal = sections.goal as Record<string, unknown>;
      payload.status = 'done';
      goal.md = 'Guide a new contributor to a verified first render.';
      (sections.tasks as Array<Record<string, unknown>>).push({
        id: '2',
        title: 'Verify output',
        done: true,
      });
    });
    await updateContract(cwd, 'weekly-review', (payload) => {
      payload.status = 'archived';
    });

    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).toContain('data-tab-id="list">List</button>');
    expect(dashboard).toContain('data-tab-id="table">Table</button>');
    expect(dashboard).toContain('data-tab-id="kanban">Kanban</button>');
    expect(dashboard).toContain('<table class="work-table">');
    expect(dashboard).toContain('<th class="col-priority" scope="col">Priority</th>');
    expect(dashboard).toContain('aria-label="Draft work"');
    expect(dashboard).toContain('aria-label="Active work"');
    expect(dashboard).toContain('aria-label="Done work"');
    expect(dashboard).toContain('aria-label="Archived work"');

    expect(dashboard).toContain('data-work-priority="urgent"');
    expect(dashboard).toContain('data-work-priority="not set"');
    expect(dashboard).toContain('data-work-updated="2026-08-21"');
    expect(dashboard).toContain('data-work-agent="codex"');
    expect(dashboard).toContain('data-work-tags="cache, production"');
    expect(dashboard).toContain(
      'data-work-description="Requests spike when a cold region begins serving traffic."',
    );
    expect(dashboard).toContain('data-work-evidence="p0 · 2 timeline events"');
    expect(dashboard).toContain('Cache &quot;stampede&quot; during warmup');
    expect(dashboard).toContain('href="./pages/cache-stampede/page.html"');

    expect(dashboard).toContain('data-work-drawer hidden');
    expect(dashboard).toContain('role="dialog" aria-modal="true"');
    expect(dashboard).toContain('data-work-drawer-full-page');
    expect(dashboard).not.toContain('draggable="true"');
  });

  it('ships offline classic-script filtering, keyboard, hash, and focus behavior', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'keyboard-proof'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const baseJs = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.js'),
      'utf8',
    );
    const baseCss = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.css'),
      'utf8',
    );

    expect(baseJs).toContain("document.querySelectorAll('[data-work-item]')");
    expect(baseJs).toContain("event.key !== ' '");
    expect(baseJs).toContain("event.key === 'Escape'");
    expect(baseJs).toContain("event.key !== 'Tab'");
    expect(baseJs).toContain("main.setAttribute('inert', '')");
    expect(baseJs).toContain("history.pushState(null, '', hash)");
    expect(baseJs).toContain("window.addEventListener('hashchange', syncHash)");
    expect(baseJs).not.toMatch(/\bimport\s|https?:\/\//);

    expect(baseCss).toContain('.work-drawer {');
    expect(baseCss).toContain('@media (max-width: 40rem)');
    expect(baseCss).toContain('.work-drawer { width: 100%; border-left: 0; }');
    expect(baseCss).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
