import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/cli.js';
import { COMMAND_GROUPS, helpText } from '../src/lib/command-catalog.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-shell-'));
  tempDirs.push(dir);
  return dir;
}

const SECTIONS = ['index.html', 'work.html', 'spec.html', 'research.html', 'commands.html'];

describe('workspace navigation shell', () => {
  it('generates every section page and links them from each other', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    for (const section of SECTIONS) {
      expect(existsSync(path.join(cwd, 'iris', section))).toBe(true);
    }

    for (const section of SECTIONS) {
      const html = await readFile(path.join(cwd, 'iris', section), 'utf8');
      for (const target of SECTIONS) {
        expect(html, `${section} should link ${target}`).toContain(`href="./${target}"`);
      }
      expect(html).toContain('aria-label="Workspace sections"');
      expect(html).toContain('data-nav-toggle');
      expect(html).toContain('data-menu-toggle');
      expect(html).toContain('aria-label="Breadcrumb"');
    }
  });

  it('marks the current section on every page exactly once', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    for (const [section, href] of Object.entries({
      'index.html': './index.html',
      'work.html': './work.html',
      'spec.html': './spec.html',
      'research.html': './research.html',
      'commands.html': './commands.html',
    })) {
      const html = await readFile(path.join(cwd, 'iris', section), 'utf8');
      const current = [...html.matchAll(/aria-current="page"/g)];
      expect(current, `${section} marks one current entry`).toHaveLength(1);
      expect(html).toContain(`href="${href}" aria-current="page"`);
    }
  });

  it('resolves shell links from nested page depths', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'nested-bug'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const contract = await readFile(
      path.join(cwd, 'iris', 'pages', 'nested-bug', 'page.html'),
      'utf8',
    );
    for (const target of SECTIONS) {
      expect(contract).toContain(`href="../../${target}"`);
    }
    expect(contract).toContain('href="../../design/tokens.css"');

    const projectDoc = await readFile(path.join(cwd, 'iris', 'project', 'hld.html'), 'utf8');
    for (const target of SECTIONS) {
      expect(projectDoc).toContain(`href="../${target}"`);
    }
    expect(projectDoc).toContain('href="../design/tokens.css"');
  });

  it('keeps the sidebar usable without JavaScript and collapsible with it', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    const html = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    const css = await readFile(path.join(cwd, 'iris', 'design', 'components', 'base.css'), 'utf8');
    const script = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.js'),
      'utf8',
    );

    expect(html).not.toContain('data-nav="collapsed"');
    expect(css).toContain("[data-nav='collapsed'] .nav-item { justify-content: center");
    expect(script).toContain("readStored('iris-nav')");
    expect(script).toContain("writeStored('iris-nav'");
    expect(script).toContain("event.key.toLowerCase() === 'b'");
    expect(script).toContain('try {');
    expect(script).not.toMatch(/https?:\/\//);
  });

  it('emits the configured theme and keeps the local override', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8')).toContain(
      '<html lang="en" data-theme="dark">',
    );

    await writeFile(
      path.join(cwd, 'iris', 'config.yaml'),
      'project: themed\ntheme: light\nasset_base: local\n',
      'utf8',
    );
    expect(await runCli(['render', '--all'], cwd)).toBe(0);
    const html = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(html).toContain('<html lang="en" data-theme="light">');

    const script = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.js'),
      'utf8',
    );
    expect(script).toContain("readStored('iris-theme')");
  });
});

describe('overview page', () => {
  it('summarizes each section and links out instead of embedding it', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['bug', 'summary-bug'], cwd)).toBe(0);
    expect(await runCli(['render', '--all'], cwd)).toBe(0);

    const overview = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    const spec = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');

    expect(overview).toContain('Recent work');
    expect(overview).toContain('Spec movement');
    expect(overview).toContain('Open Work &rarr;');
    expect(overview).toContain('Open Spec &rarr;');
    expect(overview).toContain('work items');
    expect(overview).toContain('data-work-id="summary-bug"');

    // Spec artifact bodies belong to the Spec page, keeping the overview small.
    expect(overview).not.toContain('spec-source');
    expect(overview).not.toContain('spec-card');
    expect(spec).toContain('Canonical specs');
  });

  it('names the commands that populate an empty workspace', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);

    const overview = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    const work = await readFile(path.join(cwd, 'iris', 'work.html'), 'utf8');
    const research = await readFile(path.join(cwd, 'iris', 'research.html'), 'utf8');

    expect(overview).toContain('No work recorded yet');
    expect(overview).toContain('<code>iris research my-question</code>');
    expect(work).toContain('<code>iris render --all</code>');
    expect(research).toContain('<code>iris research my-question</code>');
    expect(research).toContain('No research pages yet');
  });
});

describe('generated commands page', () => {
  it('renders every catalog command with an explicit status', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    const page = await readFile(path.join(cwd, 'iris', 'commands.html'), 'utf8');

    for (const group of COMMAND_GROUPS) {
      expect(page).toContain(group.label);
      for (const entry of group.entries) {
        expect(page, `commands page lists ${entry.name}`).toContain(`<code>${entry.name}</code>`);
        expect(page).toContain(
          `>${entry.status}</span>`,
        );
      }
    }

    expect(page).toContain('class="badge b-muted">stubbed</span>');
    expect(page).toContain('class="badge b-warning">partial</span>');
  });

  it('derives CLI help from the same catalog', () => {
    const help = helpText('9.9.9');
    expect(help).toContain('iris v9.9.9');
    for (const group of COMMAND_GROUPS) {
      expect(help).toContain(group.label);
      for (const entry of group.entries) expect(help).toContain(entry.usage);
    }
    expect(help).toContain('(stubbed)');
    expect(help).toContain('(partial)');
  });
});

describe('retired project docs', () => {
  it('removes the managed commands placeholder and preserves a user-owned one', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(existsSync(path.join(cwd, 'iris', 'project', 'commands.html'))).toBe(false);

    const userOwned = path.join(cwd, 'iris', 'project', 'commands.html');
    await writeFile(userOwned, '<!doctype html><title>mine</title>\n', 'utf8');
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await readFile(userOwned, 'utf8')).toBe('<!doctype html><title>mine</title>\n');
  });
});

describe('openspec signal', () => {
  it('counts the Spec badge from canonical specs when no change is active', async () => {
    const cwd = await createTempDir();
    await mkdir(path.join(cwd, 'openspec', 'specs', 'sample-capability'), { recursive: true });
    await writeFile(
      path.join(cwd, 'openspec', 'specs', 'sample-capability', 'spec.md'),
      '# sample-capability\n\n## Requirements\n\n### Requirement: A thing\n\nIt MUST hold.\n\n#### Scenario: it holds\n\n- **WHEN** asked\n- **THEN** it MUST hold\n',
    );
    expect(await runCli(['init'], cwd)).toBe(0);

    const spec = await readFile(path.join(cwd, 'iris', 'spec.json'), 'utf8');
    expect(JSON.parse(spec).active_changes).toHaveLength(0);

    const index = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    const badge = index.match(/Spec<\/span><em class="nav-count">(\d+)</)?.[1];
    expect(badge).toBe('1');
    expect(index).toContain('canonical');
    expect(index).not.toMatch(/No OpenSpec records found/);
  });

  it('omits derived tool detection from the generated configuration', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    const config = await readFile(path.join(cwd, 'iris', 'config.yaml'), 'utf8');
    expect(config).not.toContain('detected_tools');
  });
});

describe('agent surface reporting', () => {
  it('reports how many surfaces initialization installed', async () => {
    const cwd = await createTempDir();
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      expect(await runCli(['init'], cwd)).toBe(0);
      const written = stdout.mock.calls.map((call) => String(call[0])).join('');
      expect(written).toMatch(/agent surfaces: \d+ installed \(\d+ created, \d+ updated, \d+ unchanged\)/);
    } finally {
      stdout.mockRestore();
    }
  });

  it('lists every installed surface and its destination on the commands page', async () => {
    const cwd = await createTempDir();
    expect(await runCli(['init'], cwd)).toBe(0);
    const commands = await readFile(path.join(cwd, 'iris', 'commands.html'), 'utf8');
    expect(commands).toContain('Agent surfaces');
    for (const target of ['.agents/skills', '.claude/skills', '.github/skills']) {
      expect(commands).toContain(target);
    }
    expect(commands).toContain('Generic / Codex');
    expect(commands).toContain('GitHub Copilot');
  });
});
