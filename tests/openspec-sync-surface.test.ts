import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runCli } from '../src/cli.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('OpenSpec sync surfaces', () => {
  it('does not alter OpenSpec delta-to-main synchronization instructions', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-openspec-sync-'));
    tempDirs.push(cwd);
    const commandPath = path.join(cwd, '.claude', 'commands', 'opsx', 'sync.md');
    const skillPath = path.join(cwd, '.agents', 'skills', 'openspec-sync-specs', 'SKILL.md');
    const command = '# OpenSpec /opsx:sync\nSync delta specs from a change to main specs.\n';
    const skill =
      '---\nname: openspec-sync-specs\n---\nSync delta specs from a change to main specs.\n';

    await Promise.all([
      mkdir(path.dirname(commandPath), { recursive: true }),
      mkdir(path.dirname(skillPath), { recursive: true }),
    ]);
    await Promise.all([writeFile(commandPath, command), writeFile(skillPath, skill)]);

    expect(await runCli(['init'], cwd)).toBe(0);
    expect(await runCli(['update'], cwd)).toBe(0);

    expect(await readFile(commandPath, 'utf8')).toBe(command);
    expect(await readFile(skillPath, 'utf8')).toBe(skill);
  });
});
