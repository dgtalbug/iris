import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SCAN_TARGETS,
  PROVENANCE_DENYLIST,
  loadAllowlist,
  reportProvenanceWarnings,
  scan,
} from '../src/lib/provenance.js';

const tempDirs: string[] = [];
const repoRoot = path.resolve(import.meta.dirname, '..');
const lintScript = path.join(repoRoot, 'scripts', 'provenance-lint.mjs');

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempRepo(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-provenance-'));
  tempDirs.push(cwd);
  return cwd;
}

async function write(cwd: string, relative: string, content: string): Promise<void> {
  const target = path.join(cwd, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, 'utf8');
}

function runLint(root: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [lintScript, root], { encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('provenance scanner', () => {
  it('flags every denylisted name with file, line, and a suggestion', async () => {
    const cwd = await tempRepo();
    const lines = PROVENANCE_DENYLIST.map((entry) => `mention of ${entry.name} here`);
    await write(cwd, 'docs/names.md', `${lines.join('\n')}\n`);

    const findings = await scan(['docs/**'], { cwd, allowlist: [] });

    expect(findings).toHaveLength(PROVENANCE_DENYLIST.length);
    findings.forEach((finding, index) => {
      expect(finding.file).toBe('docs/names.md');
      expect(finding.line).toBe(index + 1);
      expect(finding.match.toLowerCase()).toBe(PROVENANCE_DENYLIST[index].name.toLowerCase());
      expect(finding.suggestion).not.toBe('');
      expect(finding.managed).toBe(false);
    });
  });

  it('matches case-insensitively', async () => {
    const cwd = await tempRepo();
    await write(cwd, 'docs/case.md', 'OPENSPEC OpenSpec openSpec\n');

    const findings = await scan(['docs/**'], { cwd, allowlist: [] });

    expect(findings).toHaveLength(3);
    expect(findings.map((finding) => finding.match)).toEqual(['OPENSPEC', 'OpenSpec', 'openSpec']);
  });

  it('respects word boundaries and does not flag substrings', async () => {
    const cwd = await tempRepo();
    await write(
      cwd,
      'docs/boundaries.md',
      [
        'openspecify is not a hit',
        'OpenSpecSnapshot is not a hit',
        'fissionable is not a hit',
        'vision-reporter is not a hit',
        'opsxen is not a hit',
        'vision-electric-v2 is a hit',
        'openspec-workspace is a hit',
      ].join('\n'),
    );

    const findings = await scan(['docs/**'], { cwd, allowlist: [] });

    expect(findings).toHaveLength(2);
    expect(findings.map((finding) => finding.line)).toEqual([6, 7]);
    expect(findings.map((finding) => finding.match)).toEqual(['vision-electric', 'openspec']);
  });

  it('suppresses an allowlisted detection-code path but not user-facing copy', async () => {
    const cwd = await tempRepo();
    await write(
      cwd,
      'src/lib/openspec-workspace.ts',
      "export const dir = path.join(cwd, 'openspec');\n",
    );
    await write(cwd, 'src/cli.ts', "console.log('OpenSpec snapshot refreshed');\n");

    const findings = await scan(['src/**/*.ts'], {
      cwd,
      allowlist: [
        {
          path: 'src/lib/openspec-workspace.ts',
          pattern: 'openspec',
          justification: 'Detection code reads the on-disk directory name.',
        },
      ],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ file: 'src/cli.ts', line: 1, match: 'OpenSpec' });
  });

  it('scopes an allowlist entry to matching lines when linePattern is set', async () => {
    const cwd = await tempRepo();
    await write(
      cwd,
      'src/spec.ts',
      [
        "import { parse } from './openspec-workspace.js';",
        "const empty = 'No OpenSpec workspace detected';",
      ].join('\n'),
    );

    const findings = await scan(['src/**/*.ts'], {
      cwd,
      allowlist: [
        {
          path: 'src/**',
          pattern: 'openspec',
          linePattern: 'openspec-workspace\\.js',
          justification: 'Import specifier of the detection module.',
        },
      ],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ file: 'src/spec.ts', line: 2, match: 'OpenSpec' });
  });

  it('rejects an allowlist entry that carries no justification', async () => {
    const cwd = await tempRepo();
    await write(cwd, 'docs/a.md', 'openspec\n');

    await expect(
      scan(['docs/**'], { cwd, allowlist: [{ path: 'docs/**', justification: '' }] }),
    ).rejects.toThrow(/justification/);
  });

  it('rejects an allowlist file whose entries lack justification', async () => {
    const cwd = await tempRepo();
    await write(cwd, 'docs/a.md', 'openspec\n');
    await write(
      cwd,
      'provenance.allowlist.json',
      JSON.stringify({ version: 1, allowlist: [{ path: 'docs/**' }] }),
    );

    await expect(scan(['docs/**'], { cwd })).rejects.toThrow(/justification/);
  });

  it('marks findings inside managed blocks for regeneration instead of editing', async () => {
    const cwd = await tempRepo();
    await write(
      cwd,
      'docs/managed.md',
      [
        'before openspec',
        '<!-- IRIS:MANAGED:START template=t schema=2 -->',
        'inside vision-electric',
        '<!-- IRIS:MANAGED:END template=t -->',
        'after fission',
      ].join('\n'),
    );

    const findings = await scan(['docs/**'], { cwd, allowlist: [] });

    expect(findings).toHaveLength(3);
    expect(findings.map((finding) => finding.managed)).toEqual([false, true, false]);
    expect(findings[1].suggestion).toMatch(/regenerate/i);
    expect(findings[0].suggestion).not.toMatch(/regenerate/i);
  });

  it('scans the surfaces the contract names', () => {
    expect(DEFAULT_SCAN_TARGETS).toEqual(
      expect.arrayContaining([
        '**/skills/iris-*/**',
        '.claude/commands/iris/**',
        '.github/prompts/iris-*.prompt.md',
        '.cursor/**/iris-*',
        'templates/**',
        'src/**/*.ts',
        'README.md',
        'docs/**',
      ]),
    );
  });

  it('loads the repository allowlist with a justification on every entry', async () => {
    const entries = await loadAllowlist(repoRoot);

    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.justification.trim()).not.toBe('');
    }
  });

  it('reportProvenanceWarnings writes findings to stderr without throwing', async () => {
    const cwd = await tempRepo();
    await write(cwd, 'docs/warn.md', 'mentions openspec here\n');
    const stderr: string[] = [];
    const original = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      stderr.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      const count = await reportProvenanceWarnings(cwd, ['docs/**']);
      expect(count).toBe(1);
      expect(stderr.join('')).toMatch(/provenance: docs\/warn\.md:1/);
      expect(stderr.join('')).toMatch(/1 finding\(s\)/);
    } finally {
      process.stderr.write = original;
    }
  });
});

describe('provenance-lint script', () => {
  it('exits 0 when the scanned surfaces are clean', async () => {
    const cwd = await tempRepo();
    await write(cwd, 'docs/page.md', 'Iris Electric tokens, all native.\n');

    const result = runLint(cwd);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/clean/);
  }, 15000);

  it('exits 1 and reports file:line on a non-allowlisted hit', async () => {
    const cwd = await tempRepo();
    await write(cwd, 'README.md', 'Tracks OpenSpec changes.\n');

    const result = runLint(cwd);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/README\.md:1/);
    expect(result.stderr).toMatch(/1 finding/);
  }, 15000);

  it('exits 0 when the only hits are allowlisted', async () => {
    const cwd = await tempRepo();
    await write(
      cwd,
      'src/lib/openspec-workspace.ts',
      "export const dir = path.join(cwd, 'openspec');\n",
    );
    await write(
      cwd,
      'provenance.allowlist.json',
      JSON.stringify({
        version: 1,
        allowlist: [
          {
            path: 'src/lib/openspec-workspace.ts',
            pattern: 'openspec',
            justification: 'Detection code reads the on-disk directory name.',
          },
        ],
      }),
    );

    const result = runLint(cwd);

    expect(result.status).toBe(0);
  }, 15000);
});
