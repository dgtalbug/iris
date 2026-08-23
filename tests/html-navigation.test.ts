import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-navigation-'));
  tempDirs.push(dir);
  return dir;
}

describe('generated HTML navigation', () => {
  it('links every rendered page from the dashboard', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['feature', 'feature-login-flow'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).toContain('href="./pages/bug-cache-stampede/page.html"');
    expect(dashboard).toContain('href="./pages/feature-login-flow/page.html"');
  });

  it('links each rendered page back to the dashboard', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['render', 'bug-cache-stampede'], cwd)).toBe(0);

    const page = await readFile(
      path.join(cwd, 'iris', 'pages', 'bug-cache-stampede', 'page.html'),
      'utf8',
    );
    expect(page).toContain('href="../../index.html"');
  });

  it('keeps archived pages reachable from the dashboard', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['render', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['archive', 'bug-cache-stampede'], cwd)).toBe(0);

    expect(existsSync(path.join(cwd, 'iris', 'archive', 'bug-cache-stampede', 'page.html'))).toBe(
      true,
    );
    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).toContain('href="./archive/bug-cache-stampede/page.html"');
  });

  it('links the scaffolded project docs from the dashboard', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);

    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).toContain('href="./project/overview.html"');
    expect(dashboard).toContain('href="./project/decisions.html"');
  });

  it('reports real page counts without retired lifecycle copy', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['feature', 'feature-login-flow'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(dashboard).toContain('2 pages');
    expect(dashboard).not.toContain('iris adopt');
    expect(dashboard).not.toContain('iris sync');
  });

  it('scaffolds project placeholders as styled navigable pages, not bare stubs', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);

    const overview = await readFile(path.join(cwd, 'iris', 'project', 'overview.html'), 'utf8');
    expect(overview).toContain('href="../index.html"');
    expect(overview).toContain('href="../design/tokens.css"');
    expect(overview).toContain('data-iris-managed');
    expect(overview).not.toBe('<!doctype html><title>pending</title>\n');
  });

  it('upgrades legacy pending stubs when managed surfaces are updated', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);
    const stubPath = path.join(cwd, 'iris', 'project', 'overview.html');
    await writeFile(stubPath, '<!doctype html><title>pending</title>\n', 'utf8');

    expect(await runCli(['update'], cwd)).toBe(0);

    const upgraded = await readFile(stubPath, 'utf8');
    expect(upgraded).toContain('data-iris-managed');
    expect(upgraded).toContain('href="../index.html"');
  });

  it('keeps generated HTML functional when opened from file://', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);

    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    // Browsers CORS-block module scripts on file://; only classic scripts run.
    expect(dashboard).not.toContain('type="module"');
    const specPage = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    expect(specPage).toContain('<script defer src="./design/vendor/mermaid.min.js">');
    expect(dashboard).toContain('<script defer src="./design/components/base.js">');

    const baseCss = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.css'),
      'utf8',
    );
    const baseJs = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.js'),
      'utf8',
    );
    // Class display values beat the UA [hidden] rule unless the CSS restores it.
    expect(baseCss).toMatch(/\[hidden\]\s*\{\s*display:\s*none/);
    expect(baseJs).not.toContain('import(');
    expect(baseJs).not.toMatch(/https?:\/\//);
  });

  it('renders the Electric hierarchy, shortcuts, and narrow-screen fallback', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);

    const dashboard = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    const baseCss = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.css'),
      'utf8',
    );
    const baseJs = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.js'),
      'utf8',
    );

    const orderedLabels = [
      'what this repo is',
      'aria-label="workspace summary"',
      'Recent work',
      'Spec movement',
      'Architecture',
      'Project docs',
    ];
    const offsets = orderedLabels.map((label) => dashboard.indexOf(label));
    expect(offsets.every((offset) => offset >= 0)).toBe(true);
    expect(offsets).toEqual([...offsets].sort((left, right) => left - right));
    expect(dashboard).toContain('Agent-first visual workspace');
    expect(dashboard).toContain('iris vendor');
    expect(dashboard).toContain('<kbd>/</kbd>');
    expect(baseJs).toContain("event.key === '/'");
    expect(baseJs).toContain("event.key.toLowerCase() === 't'");
    expect(baseJs).toContain("event.key.toLowerCase() === 'b'");
    expect(baseCss).toContain('@media (max-width: 48rem)');
    expect(baseCss).toMatch(/\.strip[^{]*\{[^}]*grid-template-columns:\s*repeat\(auto-fit/);
    expect(baseCss).toMatch(/prefers-reduced-motion:[^)]+\)[\s\S]*?transition: none !important/);

    // The hero states pages-by-type as labelled badges; the aperture ring is gone.
    expect(dashboard).toContain('class="card hero"');
    expect(dashboard).toContain('<h1 class="page" id="briefing-title">');
    expect(dashboard).toMatch(
      /class="hero-types" role="group" aria-label="\d+ pages? by type"|No pages yet/,
    );
    expect(dashboard).not.toContain('aperture');
    expect(baseCss).not.toContain('.aperture');
    expect(dashboard).toContain('class="lucide lucide-radar');
    expect(dashboard).toContain('data-theme-set="dark"');

    for (const section of ['work.html', 'spec.html', 'research.html', 'commands.html']) {
      expect(dashboard).toContain(`href="./${section}"`);
    }
  });

  it('publishes standalone artifacts without tree-relative navigation chrome', async () => {
    const cwd = await createTempDir();

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'bug-cache-stampede'], cwd)).toBe(0);
    expect(await runCli(['publish', 'bug-cache-stampede'], cwd)).toBe(0);

    const published = await readFile(
      path.join(cwd, 'iris', 'archive', 'bug-cache-stampede-publish.html'),
      'utf8',
    );
    expect(published).not.toContain('data-iris-nav');
    expect(published).not.toContain('index.html');
  });
});
