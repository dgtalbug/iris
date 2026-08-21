import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AGENT_SKILL_TARGETS, installAgentSkills } from '../src/lib/agent-skills.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-skills-'));
  tempDirs.push(cwd);
  return cwd;
}

async function targetContents(cwd: string): Promise<string[]> {
  return Promise.all(AGENT_SKILL_TARGETS.map((target) => readFile(path.join(cwd, target), 'utf8')));
}

function managedBody(content: string): string {
  const start = content.indexOf('-->\n', content.indexOf('IRIS:MANAGED:START'));
  const end = content.indexOf('<!-- IRIS:MANAGED:END');
  return content.slice(start + 4, end);
}

describe('agent skill installation', () => {
  it('installs three canonical skill surfaces and leaves siblings alone', async () => {
    const cwd = await tempProject();
    const sibling = path.join(cwd, '.agents', 'skills', 'user-skill', 'SKILL.md');
    await mkdir(path.dirname(sibling), { recursive: true });
    await writeFile(sibling, 'user-owned\n');

    const result = await installAgentSkills(cwd);
    expect(result.created).toEqual([...AGENT_SKILL_TARGETS]);
    expect(result.conflicts).toEqual([]);
    expect(await readFile(sibling, 'utf8')).toBe('user-owned\n');

    const contents = await targetContents(cwd);
    expect(new Set(contents.map(managedBody)).size).toBe(1);
    for (const content of contents) {
      expect(content).toContain('name: iris-workspace');
      expect(content).toContain('IRIS:MANAGED:START template=iris-workspace schema=1');
      expect(content).not.toMatch(/iris (?:adopt|sync)/);
    }
  });

  it('does not rewrite an unchanged rerun', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const before = await targetContents(cwd);
    const result = await installAgentSkills(cwd);
    expect(result).toMatchObject({
      created: [],
      updated: [],
      unchanged: [...AGENT_SKILL_TARGETS],
      conflicts: [],
    });
    expect(await targetContents(cwd)).toEqual(before);
  });

  it('updates an intact managed marker and preserves bytes outside the region', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const current = await readFile(target, 'utf8');
    const customized = current
      .replace('<!-- IRIS:MANAGED:START', '<!-- user-prefix -->\n<!-- IRIS:MANAGED:START')
      .replace('version=0.1.0', 'version=0.0.1')
      .replace(/\n$/, '\n<!-- user-suffix -->\n');
    await writeFile(target, customized);

    const result = await installAgentSkills(cwd);
    expect(result.updated).toContain(AGENT_SKILL_TARGETS[0]);
    const updated = await readFile(target, 'utf8');
    expect(updated).toContain('<!-- user-prefix -->');
    expect(updated).toContain('<!-- user-suffix -->');
    expect(updated).toContain('version=0.1.0');
  });

  it.each([
    [
      'edited managed body',
      (content: string) =>
        content.replace('Use Iris to turn intentional', 'Use modified Iris to turn intentional'),
    ],
    ['half marker', (content: string) => content.replace('<!-- IRIS:MANAGED:END template=iris-workspace -->', '')],
    ['nested marker', (content: string) => content.replace('# Iris workspace', '<!-- IRIS:MANAGED:START bogus -->\n# Iris workspace')],
  ])('preserves a target with %s', async (_label, mutate) => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const changed = mutate(await readFile(target, 'utf8'));
    await writeFile(target, changed);

    const result = await installAgentSkills(cwd);
    expect(result.conflicts.map((conflict) => conflict.path)).toContain(AGENT_SKILL_TARGETS[0]);
    expect(await readFile(target, 'utf8')).toBe(changed);
  });

  it('preserves an unmarked user-owned target', async () => {
    const cwd = await tempProject();
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'user-owned\n');

    const result = await installAgentSkills(cwd);
    expect(result.conflicts[0]).toMatchObject({ path: AGENT_SKILL_TARGETS[0] });
    expect(await readFile(target, 'utf8')).toBe('user-owned\n');
    expect(result.created).toEqual(AGENT_SKILL_TARGETS.slice(1));
  });

  it.skipIf(process.platform === 'win32')('refuses a symlinked skill root', async () => {
    const cwd = await tempProject();
    const outside = await mkdtemp(path.join(os.tmpdir(), 'iris-skills-outside-'));
    tempDirs.push(outside);
    await mkdir(path.join(cwd, '.agents'), { recursive: true });
    await symlink(outside, path.join(cwd, '.agents', 'skills'));

    const result = await installAgentSkills(cwd);
    expect(result.conflicts[0]).toMatchObject({ path: AGENT_SKILL_TARGETS[0] });
    expect(existsSync(path.join(outside, 'iris-workspace', 'SKILL.md'))).toBe(false);
    expect(result.created).toEqual(AGENT_SKILL_TARGETS.slice(1));
  });

  it('isolates a failed surface and still creates independent targets', async () => {
    const cwd = await tempProject();
    await writeFile(path.join(cwd, '.claude'), 'not-a-directory\n');

    const result = await installAgentSkills(cwd);
    expect(result.created).toEqual([AGENT_SKILL_TARGETS[0], AGENT_SKILL_TARGETS[2]]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].path).toBe(AGENT_SKILL_TARGETS[1]);
    expect(await readFile(path.join(cwd, '.claude'), 'utf8')).toBe('not-a-directory\n');
  });
});
