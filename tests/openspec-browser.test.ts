import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];
const fixtureRoot = path.resolve(
  import.meta.dirname,
  'fixtures',
  'openspec-workspace',
  'observed',
  'openspec',
);

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(withFixture = true): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-spec-browser-'));
  tempDirs.push(cwd);
  if (withFixture) {
    await cp(fixtureRoot, path.join(cwd, 'openspec'), { recursive: true });
  }
  return cwd;
}

async function snapshotRaw(cwd: string): Promise<string> {
  return readFile(path.join(cwd, 'iris', 'spec.json'), 'utf8');
}

describe('OpenSpec Spec browser orchestration', () => {
  it('refreshes only during init and full render operations', async () => {
    const cwd = await tempProject();
    const proposal = path.join(cwd, 'openspec', 'changes', 'active-change', 'proposal.md');
    expect(await runCli(['init'], cwd)).toBe(0);
    const initial = await snapshotRaw(cwd);
    await writeFile(proposal, '## Why\n\nchanged once\n');

    expect(await runCli(['bug', 'refresh-proof'], cwd)).toBe(0);
    expect(await runCli(['render', 'refresh-proof'], cwd)).toBe(0);
    expect(await runCli(['update'], cwd)).toBe(0);

    const sessionDir = path.join(cwd, 'session');
    await mkdir(sessionDir);
    await writeFile(path.join(sessionDir, 'summary.md'), '# Session\n\nNo implicit refresh.\n');
    expect(await runCli(['report', '--from-session', sessionDir, 'session-proof'], cwd)).toBe(0);
    expect(await runCli(['archive', 'refresh-proof'], cwd)).toBe(0);
    expect(await snapshotRaw(cwd)).toBe(initial);

    expect(await runCli(['render', '--all'], cwd)).toBe(0);
    expect(await snapshotRaw(cwd)).toContain('changed once');
    await writeFile(proposal, '## Why\n\nchanged twice\n');
    expect(await runCli(['render'], cwd)).toBe(0);
    expect(await snapshotRaw(cwd)).toContain('changed twice');
    await writeFile(proposal, '## Why\n\nchanged by init\n');
    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await snapshotRaw(cwd)).toContain('changed by init');
  });

  it('renders semantic Markdown, literal YAML, exact source, and inert hostile content', async () => {
    const cwd = await tempProject();
    const proposal = path.join(cwd, 'openspec', 'changes', 'active-change', 'proposal.md');
    const legacy = path.join(cwd, 'openspec', 'changes', 'archive', '2026-08-18-legacy.md');
    const malformed = path.join(cwd, 'openspec', 'specs', 'malformed', 'spec.md');
    await writeFile(legacy, '# Legacy <script>globalThis.pwned=true</script>\n');
    await mkdir(path.dirname(malformed), { recursive: true });
    await writeFile(malformed, '# Malformed without requirements\n');
    await writeFile(
      proposal,
      `${await readFile(proposal, 'utf8')}\n\`\`\`mermaid\nflowchart LR\n  A --> B\n\`\`\`\n`,
    );
    expect(await runCli(['init'], cwd)).toBe(0);

    const overview = await readFile(path.join(cwd, 'iris', 'index.html'), 'utf8');
    expect(overview).toContain('href="./spec.html"');
    const dashboard = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    expect(dashboard).toContain('<span>Spec</span>');
    expect(dashboard).toContain('Canonical specs');
    expect(dashboard).toContain('Active changes');
    expect(dashboard).toContain('Project context');
    expect(dashboard).toContain('active-change');
    expect(dashboard).toContain('2026-08-20-complete-change');
    expect(dashboard).toContain('archived · legacy');
    expect(dashboard).toContain('1/2 tasks · 1 open');
    expect(dashboard).toContain('health-invalid');
    expect(dashboard).toContain('malformed-spec');
    expect(dashboard).toContain('data-document-format="markdown"');
    expect(dashboard).toContain('data-document-format="yaml"');
    expect(dashboard).toContain('<div class="spec-document"><h2>Why</h2>');
    expect(dashboard).toContain('<strong>active layout</strong>');
    expect(dashboard).toContain('href="./design.md" rel="noopener noreferrer"');
    expect(dashboard).toContain('<blockquote>');
    expect(dashboard).toContain('class="task-list-item"');
    expect(dashboard).toContain('disabled checked aria-label="completed task"');
    expect(dashboard).toContain('<table>');
    expect(dashboard).toContain('<pre><code class="language-ts">');
    expect(dashboard).toContain('data-mermaid-figure');
    expect(dashboard).toContain('data-mermaid-host aria-label="Mermaid diagram"');
    expect(dashboard).toContain('<script defer src="./design/vendor/mermaid.min.js">');
    expect(dashboard).toContain('<summary>Exact source</summary>');
    expect(dashboard).toContain('- [x] completed task evidence');
    expect(dashboard).toContain('schema: spec-driven');
    expect(dashboard).toContain('Image: remote tracker (https://example.com/tracker.png)');
    expect(dashboard).toContain('&lt;script&gt;globalThis.pwned=true&lt;/script&gt;');
    expect(dashboard).not.toContain('<script>globalThis.pwned=true</script>');
    expect(dashboard).not.toContain('<script data-attack="script">');
    expect(dashboard).not.toContain('<iframe ');
    expect(dashboard).not.toContain('<style>body');
    expect(dashboard).not.toContain('<img ');
    expect(dashboard).not.toContain('href="javascript:');
    expect(dashboard).not.toContain('href="data:');
    expect(dashboard).not.toContain('src="https://example.com');
  });

  it('generates accessible offline tabs and responsive reduced-motion styles', async () => {
    const cwd = await tempProject();
    expect(await runCli(['init'], cwd)).toBe(0);
    const dashboard = await readFile(path.join(cwd, 'iris', 'spec.html'), 'utf8');
    const tokens = await readFile(path.join(cwd, 'iris', 'design', 'tokens.css'), 'utf8');
    const css = await readFile(path.join(cwd, 'iris', 'design', 'components', 'base.css'), 'utf8');
    const script = await readFile(
      path.join(cwd, 'iris', 'design', 'components', 'base.js'),
      'utf8',
    );
    const ids = [...dashboard.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);

    expect(new Set(ids).size).toBe(ids.length);
    expect(dashboard).toContain('aria-label="Workspace sections"');
    expect(dashboard).toContain('<a class="nav-item" href="./spec.html" aria-current="page"');
    expect(dashboard).toContain('aria-label="Breadcrumb"');
    expect(dashboard).toContain('<script defer src="./design/components/base.js">');
    expect(dashboard).not.toContain('type="module"');
    expect(dashboard).not.toMatch(/(?:src|href)="https?:\/\//);
    expect(script).toContain("['ArrowLeft', 'ArrowRight', 'Home', 'End']");
    expect(script).toContain("securityLevel: 'strict'");
    expect(script).toContain('for (const figure of figures)');
    expect(script).toContain('nodes: [host]');
    expect(script).toContain('host.getClientRects().length === 0');
    expect(script).toContain("details.addEventListener('toggle'");
    expect(script).toContain("'iris:visibilitychange'");
    expect(script).toContain('Escaped source is shown below');
    expect(script).not.toContain('import(');
    expect(script).not.toMatch(/https?:\/\//);
    expect(tokens).toContain("[data-theme='light']");
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media (max-width: 48rem)');
    expect(css).toMatch(
      /\.grid-2, \.doc-layout, \.spec-grid \{ grid-template-columns: minmax\(0, 1fr\)/,
    );
    expect(css).toContain('.spec-document table');
    expect(css).toContain('.spec-document pre');
    expect(css).toContain('.spec-source-details');
    expect(css).toMatch(/@media print[\s\S]*\.spec-document pre/);
  });

  it('renders distinct absent and empty OpenSpec states', async () => {
    const absent = await tempProject(false);
    expect(await runCli(['init'], absent)).toBe(0);
    expect(await readFile(path.join(absent, 'iris', 'spec.html'), 'utf8')).toContain(
      'No OpenSpec workspace detected',
    );

    const empty = await tempProject(false);
    await mkdir(path.join(empty, 'openspec'));
    expect(await runCli(['init'], empty)).toBe(0);
    expect(await readFile(path.join(empty, 'iris', 'spec.html'), 'utf8')).toContain(
      'OpenSpec workspace is empty',
    );
  });
});
