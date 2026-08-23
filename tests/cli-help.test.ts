import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cliHelpText, runCli } from '../src/cli.js';

const repoRoot = path.resolve(import.meta.dirname, '..');
const packageVersion = JSON.parse(
  await readFile(path.join(repoRoot, 'package.json'), 'utf8'),
).version;

function captureStream(stream: 'stdout' | 'stderr'): () => string {
  const chunks: string[] = [];
  vi.spyOn(process[stream], 'write').mockImplementation((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  });
  return () => chunks.join('');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('cli help', () => {
  it('lists all commands', () => {
    const help = cliHelpText();
    expect(help).toContain('init');
    expect(help).toContain('render');
    expect(help).toContain('update');
    expect(help).toContain('iris --version');
    expect(help).not.toContain('  - adopt');
    expect(help).not.toContain('  - sync');
  });

  it('rejects retired product lifecycle commands', async () => {
    expect(await runCli(['adopt'])).toBe(1);
    expect(await runCli(['sync'])).toBe(1);
  });
});

describe('cli version', () => {
  it.each([['--version'], ['-v']])('prints the bare installed version for %s', async (flag) => {
    const stdout = captureStream('stdout');
    expect(await runCli([flag])).toBe(0);
    expect(stdout()).toBe(`${packageVersion}\n`);
  });
});

describe('unrecognized invocations', () => {
  it('reports an unknown option on one line and exits 1', async () => {
    const stderr = captureStream('stderr');
    expect(await runCli(['--bogus'])).toBe(1);
    const output = stderr();
    expect(output.trimEnd().split('\n')).toHaveLength(1);
    expect(output).toContain('--bogus');
    expect(output).toContain('iris --help');
    expect(output).not.toContain('    at ');
    expect(output).not.toContain('ERR_PARSE_ARGS');
  });

  it('reports an unknown command on one line and exits 1', async () => {
    const stderr = captureStream('stderr');
    expect(await runCli(['nonsense'])).toBe(1);
    const output = stderr();
    expect(output.trimEnd().split('\n')).toHaveLength(1);
    expect(output).toContain('nonsense');
    expect(output).not.toContain('    at ');
  });
});
