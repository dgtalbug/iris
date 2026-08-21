import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDir } from './fs.js';

const TEMPLATE_ID = 'iris-workspace';
const MARKER_SCHEMA = 1;
const END_MARKER = '<!-- IRIS:MANAGED:END template=iris-workspace -->';
const START_PREFIX = '<!-- IRIS:MANAGED:START';
const SKILL_TARGETS = [
  '.agents/skills/iris-workspace/SKILL.md',
  '.claude/skills/iris-workspace/SKILL.md',
  '.github/skills/iris-workspace/SKILL.md',
] as const;
const FRONTMATTER = `---
name: iris-workspace
description: Use Iris to create and render intentional local visual workspace content.
license: MIT
metadata:
  author: iris
---
`;

export type SkillInstallResult = {
  created: string[];
  updated: string[];
  unchanged: string[];
  conflicts: Array<{ path: string; reason: string }>;
};

function packageRoot(): string {
  let current = path.dirname(fileURLToPath(import.meta.url));
  while (true) {
    if (existsSync(path.join(current, 'package.json')) && existsSync(path.join(current, 'templates'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) throw new Error('Could not locate the installed Iris package templates');
    current = parent;
  }
}

function digest(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function startMarker(version: string, body: string): string {
  return `${START_PREFIX} template=${TEMPLATE_ID} schema=${MARKER_SCHEMA} version=${version} sha256=${digest(body)} -->`;
}

function confined(cwd: string, target: string): boolean {
  const relative = path.relative(path.resolve(cwd), path.resolve(target));
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function assertNoSymlinkComponents(cwd: string, target: string): Promise<void> {
  const root = path.resolve(cwd);
  const resolved = path.resolve(target);
  if (!confined(root, resolved)) throw new Error('target escapes the repository');
  const parts = path.relative(root, resolved).split(path.sep);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error('target path contains a symlink');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}

async function atomicWrite(target: string, content: string): Promise<void> {
  await ensureDir(path.dirname(target));
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

function updateManagedContent(existing: string, body: string, version: string): string | null {
  const starts = [...existing.matchAll(/<!-- IRIS:MANAGED:START[^>]*-->/g)];
  const ends = [...existing.matchAll(/<!-- IRIS:MANAGED:END[^>]*-->/g)];
  if (starts.length !== 1 || ends.length !== 1) return null;
  const start = starts[0];
  const end = ends[0];
  if (
    start.index === undefined ||
    end.index === undefined ||
    start.index >= end.index ||
    start[0].includes('\n') ||
    end[0] !== END_MARKER
  ) {
    return null;
  }
  const marker = start[0].match(
    /^<!-- IRIS:MANAGED:START template=iris-workspace schema=1 version=\S+ sha256=([a-f0-9]{64}) -->$/,
  );
  if (!marker) return null;

  const bodyStart = start.index + start[0].length + 1;
  if (existing[start.index + start[0].length] !== '\n' || bodyStart > end.index) return null;
  const currentBody = existing.slice(bodyStart, end.index);
  if (digest(currentBody) !== marker[1]) return null;

  return `${existing.slice(0, start.index)}${startMarker(version, body)}\n${body}${existing.slice(end.index)}`;
}

export async function installAgentSkills(cwd: string): Promise<SkillInstallResult> {
  const root = packageRoot();
  const [template, packageJson] = await Promise.all([
    readFile(path.join(root, 'templates', 'agents', 'iris-workspace.md'), 'utf8'),
    readFile(path.join(root, 'package.json'), 'utf8'),
  ]);
  const version = (JSON.parse(packageJson) as { version?: unknown }).version;
  if (typeof version !== 'string') throw new Error('Installed Iris package has no version');
  const body = template.endsWith('\n') ? template : `${template}\n`;
  const initial = `${FRONTMATTER}${startMarker(version, body)}\n${body}${END_MARKER}\n`;
  const result: SkillInstallResult = { created: [], updated: [], unchanged: [], conflicts: [] };

  for (const relativePath of SKILL_TARGETS) {
    const target = path.resolve(cwd, relativePath);
    try {
      await assertNoSymlinkComponents(cwd, target);
      if (!existsSync(target)) {
        await atomicWrite(target, initial);
        result.created.push(relativePath);
        continue;
      }
      const existing = await readFile(target, 'utf8');
      const desired = updateManagedContent(existing, body, version);
      if (desired === null) {
        result.conflicts.push({
          path: relativePath,
          reason: existing.includes(START_PREFIX)
            ? 'managed markers or digest are invalid; preserved the file'
            : 'existing file is not Iris-managed; preserved the file',
        });
      } else if (desired === existing) {
        result.unchanged.push(relativePath);
      } else {
        await atomicWrite(target, desired);
        result.updated.push(relativePath);
      }
    } catch (error) {
      result.conflicts.push({ path: relativePath, reason: (error as Error).message });
    }
  }
  return result;
}

export const AGENT_SKILL_TARGETS = SKILL_TARGETS;
