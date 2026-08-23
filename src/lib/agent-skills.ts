import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir } from './fs.js';
import { packageRoot, packageVersion } from './package-info.js';

const MARKER_SCHEMA = 2;
const START_PREFIX = '<!-- IRIS:MANAGED:START';
const SKILL_TEMPLATE_ID = 'iris-workspace';
const COMMAND_TEMPLATE_ID = 'iris-command';

const SKILL_TARGETS = [
  '.agents/skills/iris-workspace/SKILL.md',
  '.claude/skills/iris-workspace/SKILL.md',
  '.github/skills/iris-workspace/SKILL.md',
] as const;

const SKILL_FRONTMATTER = `---
name: iris-workspace
description: Record finished agent work as local visual HTML — after fixing a bug, shipping a feature, planning, proposing an idea, researching a question, or wrapping a session. Run iris <type> <id>, fill the source, then iris render.
license: MIT
metadata:
  author: iris
---
`;

/**
 * Front matter earlier revisions of Iris generated, kept so a surface written
 * before the marker recorded ownership can still be attributed and refreshed.
 * The set is closed: no release preceded the one that records ownership, so
 * every surface that can exist was written by a revision listed here or by the
 * current one, and anything else is a human's edit.
 */
const LEGACY_FRONT_MATTER: Record<string, readonly string[]> = {
  [SKILL_TEMPLATE_ID]: [
    `---
name: iris-workspace
description: Use Iris to create and render intentional local visual workspace content.
license: MIT
metadata:
  author: iris
---
`,
  ],
  [COMMAND_TEMPLATE_ID]: [],
};

export type SurfaceDescriptor = {
  templateId: string;
  relativePath: string;
  frontMatter: string;
  body: string;
};

export type SkillInstallResult = {
  created: string[];
  updated: string[];
  unchanged: string[];
  conflicts: Array<{ path: string; reason: string }>;
};

export type CommandAction = {
  name: string;
  title: string;
  description: string;
  body: string;
};

function digest(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function startMarker(descriptor: SurfaceDescriptor, version: string): string {
  return `${START_PREFIX} template=${descriptor.templateId} schema=${MARKER_SCHEMA} version=${version} sha256=${digest(descriptor.body)} fm=${digest(descriptor.frontMatter)} -->`;
}

function endMarker(templateId: string): string {
  return `<!-- IRIS:MANAGED:END template=${templateId} -->`;
}

function confined(cwd: string, target: string): boolean {
  const relative = path.relative(path.resolve(cwd), path.resolve(target));
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
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
      if ((await lstat(current)).isSymbolicLink())
        throw new Error('target path contains a symlink');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }
  }
}

async function atomicWrite(target: string, content: string): Promise<void> {
  await ensureDir(path.dirname(target));
  const temporary = path.join(
    path.dirname(target),
    `.${path.basename(target)}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

const MARKER_CONFLICT = 'managed markers or digest are invalid; preserved the file';
const UNMANAGED_CONFLICT = 'existing file is not Iris-managed; preserved the file';
const FRONT_MATTER_CONFLICT =
  'front matter above the managed region is not the front matter Iris generated; preserved the file';

type ManagedRewrite = { content: string } | { conflict: string };

/**
 * A marker written before ownership was recorded proves only the body. Its
 * front matter is attributed by reconstruction instead: Iris owns it when it is
 * byte-for-byte what this release, or a revision listed above, generates.
 */
function frontMatterIsOwned(
  frontMatter: string,
  descriptor: SurfaceDescriptor,
  recordedDigest: string | undefined,
): boolean {
  if (recordedDigest !== undefined) return digest(frontMatter) === recordedDigest;
  if (frontMatter === descriptor.frontMatter) return true;
  return (LEGACY_FRONT_MATTER[descriptor.templateId] ?? []).includes(frontMatter);
}

function updateManagedContent(
  existing: string,
  descriptor: SurfaceDescriptor,
  version: string,
): ManagedRewrite {
  const unreadable = existing.includes(START_PREFIX)
    ? { conflict: MARKER_CONFLICT }
    : { conflict: UNMANAGED_CONFLICT };

  const starts = [...existing.matchAll(/<!-- IRIS:MANAGED:START[^>]*-->/g)];
  const ends = [...existing.matchAll(/<!-- IRIS:MANAGED:END[^>]*-->/g)];
  if (starts.length !== 1 || ends.length !== 1) return unreadable;
  const start = starts[0];
  const end = ends[0];
  if (
    start.index === undefined ||
    end.index === undefined ||
    start.index >= end.index ||
    start[0].includes('\n') ||
    end[0] !== endMarker(descriptor.templateId)
  ) {
    return unreadable;
  }
  const marker = start[0].match(
    new RegExp(
      `^<!-- IRIS:MANAGED:START template=${descriptor.templateId} schema=([12]) version=\\S+ sha256=([a-f0-9]{64})(?: fm=([a-f0-9]{64}))? -->$`,
    ),
  );
  if (!marker) return unreadable;
  const recordedFrontMatter = marker[3];
  // Only the schema that introduced the field may carry it, so a hand-mixed
  // marker is rejected rather than half-trusted.
  if ((marker[1] === '2') !== (recordedFrontMatter !== undefined)) return unreadable;

  const bodyStart = start.index + start[0].length + 1;
  if (existing[start.index + start[0].length] !== '\n' || bodyStart > end.index) return unreadable;
  const currentBody = existing.slice(bodyStart, end.index);
  if (digest(currentBody) !== marker[2]) return unreadable;

  if (!frontMatterIsOwned(existing.slice(0, start.index), descriptor, recordedFrontMatter)) {
    return { conflict: FRONT_MATTER_CONFLICT };
  }

  return {
    content: `${descriptor.frontMatter}${startMarker(descriptor, version)}\n${descriptor.body}${existing.slice(end.index)}`,
  };
}

/**
 * Parses the packaged command template into one action per `## <name>` section.
 * The first line of a section is its description; the rest is the command body.
 */
export function parseCommandTemplate(template: string): CommandAction[] {
  const actions: CommandAction[] = [];
  const sections = template.split(/^## /m).slice(1);
  for (const section of sections) {
    const lines = section.split('\n');
    const heading = (lines.shift() ?? '').trim();
    const match = heading.match(/^([a-z][a-z0-9-]*)\s*—\s*(.+)$/);
    if (!match) continue;
    const body = lines.join('\n').trim();
    if (body === '') continue;
    actions.push({
      name: match[1],
      title: `Iris: ${match[1]}`,
      description: match[2].trim(),
      body: `${body}\n`,
    });
  }
  return actions;
}

function claudeCommandFrontMatter(action: CommandAction): string {
  return `---
name: "${action.title}"
description: "${action.description.replace(/"/g, "'")}"
---
`;
}

function copilotPromptFrontMatter(action: CommandAction): string {
  return `---
description: "${action.description.replace(/"/g, "'")}"
---
`;
}

export function commandSurfaceDescriptors(actions: CommandAction[]): SurfaceDescriptor[] {
  return actions.flatMap((action) => [
    {
      templateId: COMMAND_TEMPLATE_ID,
      relativePath: `.claude/commands/iris/${action.name}.md`,
      frontMatter: claudeCommandFrontMatter(action),
      body: action.body,
    },
    {
      templateId: COMMAND_TEMPLATE_ID,
      relativePath: `.github/prompts/iris-${action.name}.prompt.md`,
      frontMatter: copilotPromptFrontMatter(action),
      body: action.body,
    },
  ]);
}

async function installSurface(
  cwd: string,
  descriptor: SurfaceDescriptor,
  version: string,
  result: SkillInstallResult,
): Promise<void> {
  const target = path.resolve(cwd, descriptor.relativePath);
  const initial = `${descriptor.frontMatter}${startMarker(descriptor, version)}\n${descriptor.body}${endMarker(descriptor.templateId)}\n`;
  try {
    await assertNoSymlinkComponents(cwd, target);
    if (!existsSync(target)) {
      await atomicWrite(target, initial);
      result.created.push(descriptor.relativePath);
      return;
    }
    const existing = await readFile(target, 'utf8');
    const desired = updateManagedContent(existing, descriptor, version);
    if ('conflict' in desired) {
      result.conflicts.push({ path: descriptor.relativePath, reason: desired.conflict });
    } else if (desired.content === existing) {
      result.unchanged.push(descriptor.relativePath);
    } else {
      await atomicWrite(target, desired.content);
      result.updated.push(descriptor.relativePath);
    }
  } catch (error) {
    result.conflicts.push({ path: descriptor.relativePath, reason: (error as Error).message });
  }
}

export async function loadSurfaceDescriptors(): Promise<SurfaceDescriptor[]> {
  const root = packageRoot();
  const [skillTemplate, commandTemplate] = await Promise.all([
    readFile(path.join(root, 'templates', 'agents', 'iris-workspace.md'), 'utf8'),
    readFile(path.join(root, 'templates', 'agents', 'iris-commands.md'), 'utf8'),
  ]);
  const skillBody = skillTemplate.endsWith('\n') ? skillTemplate : `${skillTemplate}\n`;

  return [
    ...SKILL_TARGETS.map((relativePath) => ({
      templateId: SKILL_TEMPLATE_ID,
      relativePath,
      frontMatter: SKILL_FRONTMATTER,
      body: skillBody,
    })),
    ...commandSurfaceDescriptors(parseCommandTemplate(commandTemplate)),
  ];
}

export async function installAgentSurfaces(cwd: string): Promise<SkillInstallResult> {
  const version = packageVersion();
  const descriptors = await loadSurfaceDescriptors();
  const result: SkillInstallResult = { created: [], updated: [], unchanged: [], conflicts: [] };
  for (const descriptor of descriptors) {
    await installSurface(cwd, descriptor, version, result);
  }
  return result;
}

export const AGENT_SKILL_TARGETS = SKILL_TARGETS;
export { installAgentSurfaces as installAgentSkills };

export type AgentSurfaceStatus = 'installed' | 'missing' | 'unmanaged';

export type AgentSurfaceReport = {
  relativePath: string;
  templateId: string;
  status: AgentSurfaceStatus;
};

/**
 * Reads the surfaces back off disk instead of reporting what installation
 * intended, so a file a user later took ownership of is reported as theirs
 * rather than as an Iris surface.
 */
export async function inspectAgentSurfaces(cwd: string): Promise<AgentSurfaceReport[]> {
  const descriptors = await loadSurfaceDescriptors();
  const reports: AgentSurfaceReport[] = [];
  for (const descriptor of descriptors) {
    const target = path.resolve(cwd, descriptor.relativePath);
    let status: AgentSurfaceStatus = 'missing';
    if (existsSync(target)) {
      try {
        const content = await readFile(target, 'utf8');
        status = content.includes(`${START_PREFIX} template=${descriptor.templateId}`)
          ? 'installed'
          : 'unmanaged';
      } catch {
        status = 'unmanaged';
      }
    }
    reports.push({
      relativePath: descriptor.relativePath,
      templateId: descriptor.templateId,
      status,
    });
  }
  return reports;
}
