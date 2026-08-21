import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { COMMAND_GROUPS, commandEntry } from '../src/lib/command-catalog.js';
import {
  AGENT_SKILL_TARGETS,
  installAgentSurfaces,
  parseCommandTemplate,
} from '../src/lib/agent-skills.js';

const installAgentSkills = installAgentSurfaces;

function skillTargets(paths: string[]): string[] {
  return paths.filter((target) => (AGENT_SKILL_TARGETS as readonly string[]).includes(target));
}

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
    expect(skillTargets(result.created)).toEqual([...AGENT_SKILL_TARGETS]);
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
    expect(result.created).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(skillTargets(result.unchanged)).toEqual([...AGENT_SKILL_TARGETS]);
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
      (content: string) => content.replace('# Iris workspace', '# Iris workspace (edited)'),
    ],
    [
      'half marker',
      (content: string) => content.replace('<!-- IRIS:MANAGED:END template=iris-workspace -->', ''),
    ],
    [
      'nested marker',
      (content: string) =>
        content.replace('# Iris workspace', '<!-- IRIS:MANAGED:START bogus -->\n# Iris workspace'),
    ],
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
    expect(skillTargets(result.created)).toEqual(AGENT_SKILL_TARGETS.slice(1));
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
    expect(skillTargets(result.created)).toEqual(AGENT_SKILL_TARGETS.slice(1));
  });

  it('isolates a failed surface and still creates independent targets', async () => {
    const cwd = await tempProject();
    await writeFile(path.join(cwd, '.claude'), 'not-a-directory\n');

    const result = await installAgentSkills(cwd);
    expect(skillTargets(result.created)).toEqual([AGENT_SKILL_TARGETS[0], AGENT_SKILL_TARGETS[2]]);
    expect(result.conflicts.every((conflict) => conflict.path.startsWith('.claude/'))).toBe(true);
    expect(await readFile(path.join(cwd, '.claude'), 'utf8')).toBe('not-a-directory\n');
  });
});

describe('generated agent command surfaces', () => {
  it('installs one command file per content action for Claude and Copilot', async () => {
    const cwd = await tempProject();
    const result = await installAgentSkills(cwd);
    expect(result.conflicts).toEqual([]);

    for (const action of ['research', 'bug', 'feature', 'idea', 'plan', 'report']) {
      const claude = path.join(cwd, '.claude', 'commands', 'iris', `${action}.md`);
      const copilot = path.join(cwd, '.github', 'prompts', `iris-${action}.prompt.md`);
      expect(existsSync(claude)).toBe(true);
      expect(existsSync(copilot)).toBe(true);
      const content = await readFile(claude, 'utf8');
      expect(content).toContain('IRIS:MANAGED:START template=iris-command schema=1');
      expect(content).toContain(`iris ${action} <id>`);
      expect(managedBody(content)).toBe(managedBody(await readFile(copilot, 'utf8')));
    }
  });

  it('preserves an unrelated sibling command and reports an edited one', async () => {
    const cwd = await tempProject();
    const sibling = path.join(cwd, '.claude', 'commands', 'iris', 'user.md');
    await installAgentSkills(cwd);
    await writeFile(sibling, 'user-owned\n');

    const target = path.join(cwd, '.claude', 'commands', 'iris', 'research.md');
    const edited = (await readFile(target, 'utf8')).replace('Record research', 'Record nothing');
    await writeFile(target, edited);

    const result = await installAgentSkills(cwd);
    expect(result.conflicts.map((conflict) => conflict.path)).toContain(
      '.claude/commands/iris/research.md',
    );
    expect(await readFile(target, 'utf8')).toBe(edited);
    expect(await readFile(sibling, 'utf8')).toBe('user-owned\n');
  });

  it('maps every content command to an intent in the skill and stays small', async () => {
    const skill = await readFile(
      new URL('../templates/agents/iris-workspace.md', import.meta.url),
      'utf8',
    );
    const contentGroup = COMMAND_GROUPS.find((group) => group.id === 'content');
    expect(contentGroup).toBeDefined();
    for (const entry of contentGroup?.entries ?? []) {
      expect(skill, `skill maps ${entry.name}`).toContain(`\`${entry.usage}\``);
      if (entry.lands)
        expect(skill, `skill names where ${entry.name} lands`).toContain(entry.lands);
    }
    expect(skill).toContain('## When to use this');
    // The intent table only pays for itself if the whole skill stays cheap to read.
    expect(Buffer.byteLength(skill, 'utf8')).toBeLessThan(4096);
  });

  it('derives every generated command from an existing catalog command', async () => {
    const template = await readFile(
      new URL('../templates/agents/iris-commands.md', import.meta.url),
      'utf8',
    );
    const actions = parseCommandTemplate(template);
    expect(actions.length).toBeGreaterThan(0);
    for (const action of actions) {
      expect(commandEntry(action.name), `catalog is missing ${action.name}`).toBeDefined();
    }
  });
});
