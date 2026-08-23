import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { COMMAND_GROUPS, commandEntry } from '../src/lib/command-catalog.js';
import { packageVersion } from '../src/lib/package-info.js';
import {
  AGENT_GUARD_TARGETS,
  AGENT_SKILL_TARGETS,
  inspectAgentSurfaces,
  installAgentSurfaces,
  listHostAdapters,
  parseCommandTemplate,
  type HostAdapter,
} from '../src/lib/agent-skills.js';

const installAgentSkills = installAgentSurfaces;

function skillsCapableAdapters(): Array<HostAdapter & { skillsDir: string }> {
  return listHostAdapters().filter(
    (adapter): adapter is HostAdapter & { skillsDir: string } => adapter.skillsDir !== null,
  );
}

function commandsCapableAdapters(): Array<HostAdapter & { commandsDir: string }> {
  return listHostAdapters().filter(
    (adapter): adapter is HostAdapter & { commandsDir: string } => adapter.commandsDir !== null,
  );
}

function skillTargets(paths: string[]): string[] {
  return paths.filter((target) => (AGENT_SKILL_TARGETS as readonly string[]).includes(target));
}

function guardTargets(paths: string[]): string[] {
  return paths.filter((target) => (AGENT_GUARD_TARGETS as readonly string[]).includes(target));
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

const LEGACY_SKILL_FRONTMATTER = `---
name: iris-workspace
description: Use Iris to create and render intentional local visual workspace content.
license: MIT
metadata:
  author: iris
---
`;

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function splitSurface(content: string): { frontMatter: string; marker: string; rest: string } {
  const startIndex = content.indexOf('<!-- IRIS:MANAGED:START');
  const markerEnd = content.indexOf('-->', startIndex) + 3;
  return {
    frontMatter: content.slice(0, startIndex),
    marker: content.slice(startIndex, markerEnd),
    rest: content.slice(markerEnd),
  };
}

/** Rewrites the front matter and the ownership digest that vouches for it. */
function withGeneratedFrontMatter(content: string, frontMatter: string): string {
  const { marker, rest } = splitSurface(content);
  return `${frontMatter}${marker.replace(/ fm=[a-f0-9]{64}/, ` fm=${sha256(frontMatter)}`)}${rest}`;
}

/** Rewrites the front matter without touching the digest, as a human edit would. */
function withEditedFrontMatter(content: string, frontMatter: string): string {
  const { marker, rest } = splitSurface(content);
  return `${frontMatter}${marker}${rest}`;
}

/** Reproduces a surface written before the marker recorded front-matter ownership. */
function asLegacyMarker(content: string): string {
  const { frontMatter, marker, rest } = splitSurface(content);
  const downgraded = marker.replace(' schema=2 ', ' schema=1 ').replace(/ fm=[a-f0-9]{64}/, '');
  return `${frontMatter}${downgraded}${rest}`;
}

/** Swaps the managed body and reseals the digest, as an older release wrote it. */
function withManagedBody(content: string, body: string): string {
  const { frontMatter, marker, rest } = splitSurface(content);
  const suffix = rest.slice(rest.indexOf('<!-- IRIS:MANAGED:END'));
  const resealed = marker.replace(/sha256=[a-f0-9]{64}/, `sha256=${sha256(body)}`);
  return `${frontMatter}${resealed}\n${body}${suffix}`;
}

describe('agent skill installation', () => {
  it('installs the skill directory for every skills-capable host and leaves siblings alone', async () => {
    const cwd = await tempProject();
    const sibling = path.join(cwd, '.agents', 'skills', 'user-skill', 'SKILL.md');
    await mkdir(path.dirname(sibling), { recursive: true });
    await writeFile(sibling, 'user-owned\n');

    const result = await installAgentSkills(cwd);
    expect(result.conflicts).toEqual([]);
    expect(skillTargets(result.created)).toEqual([...AGENT_SKILL_TARGETS]);
    expect(guardTargets(result.created)).toEqual([...AGENT_GUARD_TARGETS]);
    expect(await readFile(sibling, 'utf8')).toBe('user-owned\n');

    for (const adapter of skillsCapableAdapters()) {
      const skillRoot = path.join(cwd, adapter.skillsDir, 'iris-workspace');
      const skill = await readFile(path.join(skillRoot, 'SKILL.md'), 'utf8');
      expect(skill).toContain('name: iris-workspace');
      expect(skill).toContain('IRIS:MANAGED:START template=iris-workspace schema=2');
      expect(skill).not.toMatch(/iris (?:adopt|sync)/);

      for (const reference of ['blueprint.md', 'components.md']) {
        const content = await readFile(path.join(skillRoot, 'references', reference), 'utf8');
        expect(content.startsWith('<!-- IRIS:MANAGED:START template=iris-workspace schema=2')).toBe(
          true,
        );
        expect(content).toContain('<!-- IRIS:MANAGED:END template=iris-workspace -->');
      }

      const guard = await readFile(
        path.join(cwd, adapter.skillsDir, 'iris-guard', 'SKILL.md'),
        'utf8',
      );
      expect(guard).toContain('name: iris-guard');
      expect(guard).toContain('IRIS:MANAGED:START template=iris-guard schema=2');
    }

    const contents = await targetContents(cwd);
    expect(new Set(contents.map(managedBody)).size).toBe(1);
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
    expect(guardTargets(result.unchanged)).toEqual([...AGENT_GUARD_TARGETS]);
    expect(await targetContents(cwd)).toEqual(before);
  });

  it('upgrades a single-file managed install in place and builds the directory around it', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const legacy = withManagedBody(
      await readFile(target, 'utf8'),
      '# Iris workspace\n\nThe pre-directory single-file skill body.\n',
    );
    await writeFile(target, legacy);
    await rm(path.join(cwd, '.claude', 'skills', 'iris-workspace', 'references'), {
      recursive: true,
      force: true,
    });
    await rm(path.join(cwd, '.claude', 'skills', 'iris-guard'), { recursive: true, force: true });

    const result = await installAgentSkills(cwd);
    expect(result.conflicts).toEqual([]);
    expect(result.updated).toContain(AGENT_SKILL_TARGETS[0]);
    const upgraded = await readFile(target, 'utf8');
    expect(upgraded).toContain('## The craft loop');
    expect(upgraded).not.toContain('single-file skill body');
    expect(result.created).toContain('.claude/skills/iris-workspace/references/blueprint.md');
    expect(result.created).toContain('.claude/skills/iris-workspace/references/components.md');
    expect(result.created).toContain('.claude/skills/iris-guard/SKILL.md');
  });

  it('updates an intact managed marker and preserves bytes after the region', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const current = await readFile(target, 'utf8');
    const customized = current
      .replace(`version=${packageVersion()}`, 'version=0.0.1')
      .replace(/\n$/, '\n<!-- user-suffix -->\n');
    await writeFile(target, customized);

    const result = await installAgentSkills(cwd);
    expect(result.updated).toContain(AGENT_SKILL_TARGETS[0]);
    const updated = await readFile(target, 'utf8');
    expect(updated).toContain('<!-- user-suffix -->');
    expect(updated).toContain(`version=${packageVersion()}`);
  });

  it('preserves and reports user bytes added ahead of the managed region', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const customized = (await readFile(target, 'utf8'))
      .replace('<!-- IRIS:MANAGED:START', '<!-- user-prefix -->\n<!-- IRIS:MANAGED:START')
      .replace(`version=${packageVersion()}`, 'version=0.0.1');
    await writeFile(target, customized);

    const result = await installAgentSkills(cwd);
    expect(result.conflicts.map((conflict) => conflict.path)).toContain(AGENT_SKILL_TARGETS[0]);
    expect(await readFile(target, 'utf8')).toBe(customized);
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

  it('preserves a user-edited reference document', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const relativePath = '.claude/skills/iris-workspace/references/components.md';
    const target = path.join(cwd, relativePath);
    const edited = (await readFile(target, 'utf8')).replace(
      '# Electric Markdown components',
      '# My own notes',
    );
    await writeFile(target, edited);

    const result = await installAgentSkills(cwd);
    expect(result.conflicts.map((conflict) => conflict.path)).toContain(relativePath);
    expect(await readFile(target, 'utf8')).toBe(edited);
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
    const agentsConflicts = result.conflicts.filter((conflict) =>
      conflict.path.startsWith('.agents/'),
    );
    expect(agentsConflicts.length).toBeGreaterThan(0);
    expect(agentsConflicts[0]).toMatchObject({ path: AGENT_SKILL_TARGETS[1] });
    expect(existsSync(path.join(outside, 'iris-workspace', 'SKILL.md'))).toBe(false);
    expect(skillTargets(result.created)).toEqual(
      AGENT_SKILL_TARGETS.filter((target) => !target.startsWith('.agents/')),
    );
  });

  it('isolates a failed surface and still creates independent targets', async () => {
    const cwd = await tempProject();
    await writeFile(path.join(cwd, '.claude'), 'not-a-directory\n');

    const result = await installAgentSkills(cwd);
    expect(skillTargets(result.created)).toEqual(
      AGENT_SKILL_TARGETS.filter((target) => !target.startsWith('.claude/')),
    );
    expect(
      result.conflicts.length > 0 &&
        result.conflicts.every((conflict) => conflict.path.startsWith('.claude/')),
    ).toBe(true);
    expect(await readFile(path.join(cwd, '.claude'), 'utf8')).toBe('not-a-directory\n');
  });
});

describe('host selection', () => {
  it('generates surfaces only for the selected hosts', async () => {
    const cwd = await tempProject();
    const result = await installAgentSurfaces(cwd, { hosts: ['claude'] });
    expect(result.conflicts).toEqual([]);
    expect(result.created.length).toBeGreaterThan(0);
    expect(result.created.every((target) => target.startsWith('.claude/'))).toBe(true);

    for (const file of ['SKILL.md', 'references/blueprint.md', 'references/components.md']) {
      expect(existsSync(path.join(cwd, '.claude', 'skills', 'iris-workspace', file))).toBe(true);
    }
    expect(existsSync(path.join(cwd, '.claude', 'skills', 'iris-guard', 'SKILL.md'))).toBe(true);
    expect(existsSync(path.join(cwd, '.claude', 'commands', 'iris', 'research.md'))).toBe(true);
    expect(existsSync(path.join(cwd, '.github'))).toBe(false);
  });

  it('installs no commands for a skills-only host', async () => {
    const cwd = await tempProject();
    const result = await installAgentSurfaces(cwd, { hosts: ['agents'] });
    expect(result.conflicts).toEqual([]);
    expect(result.created.length).toBeGreaterThan(0);
    expect(result.created.every((target) => target.startsWith('.agents/skills/'))).toBe(true);
    expect(existsSync(path.join(cwd, '.agents', 'skills', 'iris-guard', 'SKILL.md'))).toBe(true);
  });

  it('rejects an unknown host with the list of valid identifiers', async () => {
    const cwd = await tempProject();
    await expect(installAgentSurfaces(cwd, { hosts: ['emacs'] })).rejects.toThrow(
      /Unknown agent host 'emacs'; valid hosts: .*claude/,
    );
  });

  it('reads the directory surfaces back off disk', async () => {
    const cwd = await tempProject();
    await installAgentSurfaces(cwd, { hosts: ['claude'] });
    const reports = await inspectAgentSurfaces(cwd, { hosts: ['claude'] });
    expect(reports.length).toBeGreaterThan(0);
    expect(reports.every((report) => report.status === 'installed')).toBe(true);

    const blueprint = '.claude/skills/iris-workspace/references/blueprint.md';
    await writeFile(path.join(cwd, blueprint), 'user notes\n');
    const after = await inspectAgentSurfaces(cwd, { hosts: ['claude'] });
    expect(after.find((report) => report.relativePath === blueprint)?.status).toBe('unmanaged');
    expect(after.find((report) => report.relativePath === AGENT_SKILL_TARGETS[0])?.status).toBe(
      'installed',
    );
  });
});

describe('generated metadata ownership', () => {
  it('refreshes stale generated metadata and reports the surface as updated', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const current = await readFile(target, 'utf8');
    await writeFile(target, withGeneratedFrontMatter(current, LEGACY_SKILL_FRONTMATTER));

    const result = await installAgentSkills(cwd);
    expect(result.updated).toContain(AGENT_SKILL_TARGETS[0]);
    expect(result.conflicts).toEqual([]);
    expect(await readFile(target, 'utf8')).toBe(current);
  });

  it('preserves and reports metadata a user edited', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const edited = withEditedFrontMatter(
      await readFile(target, 'utf8'),
      LEGACY_SKILL_FRONTMATTER.replace('license: MIT', 'license: Apache-2.0'),
    );
    await writeFile(target, edited);

    const result = await installAgentSkills(cwd);
    expect(result.updated).not.toContain(AGENT_SKILL_TARGETS[0]);
    expect(result.conflicts.map((conflict) => conflict.path)).toContain(AGENT_SKILL_TARGETS[0]);
    expect(await readFile(target, 'utf8')).toBe(edited);
  });

  it.each([
    ['metadata an earlier release generated', LEGACY_SKILL_FRONTMATTER],
    ['metadata this release generates', null],
  ])('migrates a marker without recorded ownership carrying %s', async (_label, frontMatter) => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const current = await readFile(target, 'utf8');
    const legacy = asLegacyMarker(
      frontMatter === null ? current : withEditedFrontMatter(current, frontMatter),
    );
    await writeFile(target, legacy);

    const result = await installAgentSkills(cwd);
    expect(result.updated).toContain(AGENT_SKILL_TARGETS[0]);
    expect(result.conflicts).toEqual([]);
    const migrated = await readFile(target, 'utf8');
    expect(migrated).toBe(current);
    expect(migrated).toMatch(/schema=2 version=\S+ sha256=[a-f0-9]{64} fm=[a-f0-9]{64} -->/);
  });

  it('preserves a marker without recorded ownership whose metadata it cannot attribute', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const target = path.join(cwd, AGENT_SKILL_TARGETS[0]);
    const legacy = asLegacyMarker(
      withEditedFrontMatter(
        await readFile(target, 'utf8'),
        LEGACY_SKILL_FRONTMATTER.replace('author: iris', 'author: someone-else'),
      ),
    );
    await writeFile(target, legacy);

    const result = await installAgentSkills(cwd);
    expect(result.conflicts.map((conflict) => conflict.path)).toContain(AGENT_SKILL_TARGETS[0]);
    expect(await readFile(target, 'utf8')).toBe(legacy);
  });

  it('refreshes a generated command description alongside the skill', async () => {
    const cwd = await tempProject();
    await installAgentSkills(cwd);
    const relativePath = '.claude/commands/iris/research.md';
    const target = path.join(cwd, relativePath);
    const current = await readFile(target, 'utf8');
    const stale = withGeneratedFrontMatter(
      current,
      '---\nname: "Iris: research"\ndescription: "An older description"\n---\n',
    );
    await writeFile(target, stale);

    const result = await installAgentSkills(cwd);
    expect(result.updated).toContain(relativePath);
    expect(await readFile(target, 'utf8')).toBe(current);
  });

  it('converges after migrating every surface, reporting a second run unchanged', async () => {
    const cwd = await tempProject();
    const created = (await installAgentSkills(cwd)).created;
    for (const relativePath of created) {
      const target = path.join(cwd, relativePath);
      await writeFile(target, asLegacyMarker(await readFile(target, 'utf8')));
    }

    const migration = await installAgentSkills(cwd);
    expect(migration.conflicts).toEqual([]);
    expect(migration.updated.sort()).toEqual([...created].sort());

    const rerun = await installAgentSkills(cwd);
    expect(rerun.conflicts).toEqual([]);
    expect(rerun.updated).toEqual([]);
    expect(rerun.unchanged.sort()).toEqual([...created].sort());
  });
});

describe('generated agent command surfaces', () => {
  it('installs one command file per content action for every commands-capable host', async () => {
    const cwd = await tempProject();
    const result = await installAgentSkills(cwd);
    expect(result.conflicts).toEqual([]);

    for (const action of ['research', 'bug', 'feature', 'idea', 'plan', 'report']) {
      const claude = path.join(cwd, '.claude', 'commands', 'iris', `${action}.md`);
      const copilot = path.join(cwd, '.github', 'prompts', `iris-${action}.prompt.md`);
      const cursor = path.join(cwd, '.cursor', 'commands', `iris-${action}.md`);
      const codex = path.join(cwd, '.codex', 'prompts', `iris-${action}.md`);
      for (const target of [claude, copilot, cursor, codex]) {
        expect(existsSync(target), `${target} exists`).toBe(true);
      }
      const content = await readFile(claude, 'utf8');
      expect(content).toContain('IRIS:MANAGED:START template=iris-command schema=2');
      expect(content).toContain(`iris ${action} <id>`);
      expect(content).toContain(`name: "Iris: ${action}"`);
      const bodies = await Promise.all(
        [copilot, cursor, codex].map(async (target) => managedBody(await readFile(target, 'utf8'))),
      );
      for (const body of bodies) {
        expect(body).toBe(managedBody(content));
      }
    }

    const skillsOnly = listHostAdapters().filter((adapter) => adapter.commandsDir === null);
    expect(skillsOnly.length).toBeGreaterThan(0);
    for (const adapter of skillsOnly) {
      const root = `.${adapter.id}`;
      expect(existsSync(path.join(cwd, root, 'skills', 'iris-workspace', 'SKILL.md'))).toBe(true);
      const created = result.created.filter((target) => target.startsWith(`${root}/`));
      expect(created.length).toBeGreaterThan(0);
      expect(created.every((target) => target.startsWith(`${root}/skills/`))).toBe(true);
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
      new URL('../templates/agents/iris-workspace/SKILL.md', import.meta.url),
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
    expect(skill).toContain('## When not to use this');
    expect(skill).toContain('## The craft loop');
    expect(skill).toContain('## The color law for diagrams');
    expect(skill).toContain('## Verification checklist');
    expect(skill).toContain('iris/project/hld.md');
    expect(skill).toContain('`design.lld`');
    // The checklist ends with the provenance self-check.
    const checklist = skill.slice(skill.indexOf('## Verification checklist'));
    const items = checklist.trimEnd().split('\n').filter(Boolean);
    expect(items[items.length - 1]).toContain('iris-guard');
    // The intent tables only pay for themselves if the skill stays cheap to read;
    // the depth lives in references/.
    expect(Buffer.byteLength(skill, 'utf8')).toBeLessThan(8192);
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
