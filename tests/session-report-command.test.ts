import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runDraftCommand } from '../src/commands/draft.js';
import { runInitCommand } from '../src/commands/init.js';
import { ingestSessionSource, runReportFromSessionCommand } from '../src/commands/report.js';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function createTempDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'iris-session-report-'));
  tempDirs.push(dir);
  return dir;
}

describe('session report ingestion', () => {
  it('combines known directory artifacts into structured evidence and a discoverable report', async () => {
    const cwd = await createTempDir();
    const sessionDir = path.join(cwd, 'agent-session');
    await mkdir(sessionDir, { recursive: true });
    await runInitCommand(cwd);
    await runDraftCommand(cwd, 'bug', 'existing-bug');

    await writeFile(
      path.join(sessionDir, 'metadata.json'),
      JSON.stringify({
        title: 'Session ingestion',
        branch: 'feat/session-report',
        repo: 'dgtalbug/iris',
        status: 'completed',
        created_at: '2026-08-18T08:00:00.000Z',
        updated_at: '2026-08-18T09:00:00.000Z',
      }),
    );
    await writeFile(
      path.join(sessionDir, 'turns.json'),
      JSON.stringify({
        turns: [{ summary: 'Implemented deterministic local session parsing.' }],
        files_touched: ['src/commands/report.ts', 'tests/session-report-command.test.ts'],
        tool_activity: ['pnpm test'],
      }),
    );
    await writeFile(
      path.join(sessionDir, 'checkpoints.json'),
      JSON.stringify({
        checkpoints: ['Parser and contract verified'],
      }),
    );
    await writeFile(
      path.join(sessionDir, 'references.json'),
      JSON.stringify({
        references: [
          'https://github.com/dgtalbug/iris/pull/42',
          '0123456789abcdef0123456789abcdef01234567',
        ],
      }),
    );
    await writeFile(
      path.join(sessionDir, 'random.json'),
      JSON.stringify({ summary: 'This irrelevant file must be ignored.' }),
    );

    const evidence = await ingestSessionSource(cwd, './agent-session');
    expect(evidence).toMatchObject({
      inputShape: 'directory',
      workstream: 'Session ingestion',
      branch: 'feat/session-report',
      repo: 'dgtalbug/iris',
      status: 'completed',
    });
    expect(evidence.filesTouched).toContain('src/commands/report.ts');
    expect(evidence.references).toContain('https://github.com/dgtalbug/iris/pull/42');
    expect(evidence.highlights).not.toContain('This irrelevant file must be ignored.');

    await runReportFromSessionCommand(cwd, './agent-session', 'session-review');

    const data = JSON.parse(
      await readFile(path.join(cwd, 'iris/pages/session-review/data.json'), 'utf8'),
    );
    expect(data.status).toBe('done');
    expect(data.commit).toBe('0123456789abcdef0123456789abcdef01234567');
    expect(data.sections.session_evidence).toMatchObject({
      branch: 'feat/session-report',
      repo: 'dgtalbug/iris',
      files_touched: ['src/commands/report.ts', 'tests/session-report-command.test.ts'],
    });
    expect(data.sections.summary.join('\n')).toContain('Branch: feat/session-report');

    const state = JSON.parse(await readFile(path.join(cwd, 'iris/state.json'), 'utf8'));
    expect(state.page_index['session-review']).toMatchObject({
      id: 'session-review',
      type: 'report',
      title: 'Session Review',
      status: 'active',
    });
    expect(state.page_index['existing-bug']).toMatchObject({
      id: 'existing-bug',
      type: 'bug',
      status: 'active',
    });
    expect(state.content_hashes['pages/session-review/data.json']).toMatch(/^[0-9a-f]{64}$/);

    const reportHtml = await readFile(
      path.join(cwd, 'iris/pages/session-review/page.html'),
      'utf8',
    );
    const dashboardHtml = await readFile(path.join(cwd, 'iris/index.html'), 'utf8');
    expect(reportHtml).toContain('Session Review');
    expect(reportHtml).toContain('feat/session-report');
    expect(dashboardHtml).toContain('Session Review');
    expect(dashboardHtml).toContain('Existing Bug');
  });

  it('supports exported JSON and local text dumps with partial evidence', async () => {
    const cwd = await createTempDir();
    await writeFile(
      path.join(cwd, 'session-export.json'),
      JSON.stringify({
        session: { workstream: 'Export review' },
        messages: [{ text: 'Reviewed the exported session without a remote service.' }],
        changedFiles: ['src/index.ts'],
      }),
    );
    await writeFile(
      path.join(cwd, 'session-notes.md'),
      '# Review\n\n- Captured a useful local checkpoint.\n',
    );

    const jsonEvidence = await ingestSessionSource(cwd, './session-export.json');
    const textEvidence = await ingestSessionSource(cwd, './session-notes.md');
    expect(jsonEvidence.inputShape).toBe('json-export');
    expect(jsonEvidence.filesTouched).toEqual(['src/index.ts']);
    expect(jsonEvidence.highlights).toContain(
      'Reviewed the exported session without a remote service.',
    );
    expect(textEvidence.inputShape).toBe('text-export');
    expect(textEvidence.highlights.join(' ')).toContain('Captured a useful local checkpoint.');
  });

  it('rejects missing, unsupported, malformed, empty, and evidence-free sources', async () => {
    const cwd = await createTempDir();
    await writeFile(path.join(cwd, 'session.yaml'), 'summary: unsupported');
    await writeFile(path.join(cwd, 'session.json'), '{broken');
    await writeFile(path.join(cwd, 'empty-session.json'), '{}');
    await mkdir(path.join(cwd, 'noise'));
    await writeFile(
      path.join(cwd, 'noise', 'package.json'),
      JSON.stringify({ summary: 'not session evidence' }),
    );

    await expect(ingestSessionSource(cwd, './missing')).rejects.toThrow(/Session source not found/);
    await expect(ingestSessionSource(cwd, './session.yaml')).rejects.toThrow(
      /Unsupported session input format/,
    );
    await expect(ingestSessionSource(cwd, './session.json')).rejects.toThrow(
      /Malformed session JSON/,
    );
    await expect(ingestSessionSource(cwd, './empty-session.json')).rejects.toThrow(
      /No reportable session evidence/,
    );
    await expect(ingestSessionSource(cwd, './noise')).rejects.toThrow(/No supported session files/);
  });

  it('requires an initialized project before the CLI writes a report', async () => {
    const cwd = await createTempDir();
    await writeFile(path.join(cwd, 'session.md'), 'Completed a local report checkpoint.');
    const writeError = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    expect(await runCli(['report', '--from-session', './session.md', 'review'], cwd)).toBe(1);
    expect(writeError).toHaveBeenCalledWith(expect.stringMatching(/run 'iris init' first/));
    writeError.mockRestore();
  });
});
