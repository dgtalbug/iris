import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from './errors.js';
import {
  HOST_ADAPTERS,
  commandFileName,
  detectHosts as detectHostAdapters,
  type HostAdapterId,
} from './host-adapters.js';
import { ensureDir } from './fs.js';
import { packageRoot, packageVersion } from './package-info.js';

const MARKER_SCHEMA = 2;
const START_PREFIX = '<!-- IRIS:MANAGED:START';
const SKILL_TEMPLATE_ID = 'iris-workspace';
const GUARD_TEMPLATE_ID = 'iris-guard';
const COMMAND_TEMPLATE_ID = 'iris-command';

export type HostCommandFormat = 'claude-markdown' | 'copilot-prompt';

export type HostAdapter = {
  /** Stable identifier used by tool selection and reports. */
  id: HostAdapterId;
  /** Human label for the picker and the completion card. */
  displayName: string;
  /** Filesystem signals detection reads; never written to user config. */
  detectPaths: readonly string[];
  /** Directory that receives skill directories; null for command-only hosts. */
  skillsDir: string | null;
  /** Directory that receives generated commands; null for skills-only hosts. */
  commandsDir: string | null;
  /** Command filename pattern; `<action>` is the action name. */
  commandFile: string | null;
  /** Front-matter dialect for generated commands. */
  commandFormat: HostCommandFormat;
  /** Human-facing note when the host only picks up new surfaces after a restart. */
  requiresIdeRestart?: string;
};

const COMMAND_FORMAT_BY_ID: Record<HostAdapterId, HostCommandFormat> = {
  claude: 'claude-markdown',
  agents: 'claude-markdown',
  github: 'copilot-prompt',
  cursor: 'claude-markdown',
  gemini: 'claude-markdown',
  codex: 'claude-markdown',
};

function toHostAdapter(id: HostAdapterId): HostAdapter {
  const adapter = HOST_ADAPTERS.find((entry) => entry.id === id);
  if (!adapter) {
    throw new IrisError(1, `Unknown host adapter: ${id}`);
  }
  return {
    id: adapter.id,
    displayName: adapter.displayName,
    detectPaths: adapter.detect,
    skillsDir: adapter.skillsDir,
    commandsDir: adapter.commandsDir,
    commandFile: adapter.commandFileFormat,
    commandFormat: COMMAND_FORMAT_BY_ID[adapter.id],
    ...(adapter.requiresIdeRestart ? { requiresIdeRestart: adapter.requiresIdeRestart } : {}),
  };
}

const HOST_TABLE: readonly HostAdapter[] = HOST_ADAPTERS.map((entry) => toHostAdapter(entry.id));

/** The adapter table generation consumes; the authoritative source is `host-adapters.ts`. */
export function listHostAdapters(): readonly HostAdapter[] {
  return HOST_TABLE;
}

export function resolveAdapter(id: string): HostAdapter | undefined {
  return HOST_TABLE.find((adapter) => adapter.id === id);
}

/** Filesystem-backed host detection; delegates to `host-adapters.ts`. */
export function detectHosts(cwd: string): HostAdapter[] {
  return detectHostAdapters(cwd).map((adapter) => toHostAdapter(adapter.id));
}

const SKILL_FRONTMATTER = `---
name: iris-workspace
description: Record finished agent work as local visual HTML — after fixing a bug, shipping a feature, planning, proposing an idea, researching a question, or wrapping a session. Run iris <type> <id>, fill the source, then iris render.
license: MIT
metadata:
  author: iris
---
`;

const GUARD_FRONTMATTER = `---
name: iris-guard
description: Keep every Iris workspace page in Iris's own voice — no external tool, framework, or design-system names; run the denylist self-check before iris render.
license: MIT
metadata:
  author: iris
---
`;

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
  [GUARD_TEMPLATE_ID]: [],
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

export type AgentSurfaceSelection = {
  hosts?: readonly string[];
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

const COMMAND_FORMATS: Record<
  HostCommandFormat,
  { frontMatter: (action: CommandAction) => string }
> = {
  'claude-markdown': { frontMatter: claudeCommandFrontMatter },
  'copilot-prompt': { frontMatter: copilotPromptFrontMatter },
};

function actionFileName(adapter: HostAdapter, actionName: string): string | null {
  if (!adapter.commandFile) return null;
  return adapter.commandFile.replaceAll('<action>', actionName);
}

export function commandSurfaceDescriptors(
  adapter: HostAdapter,
  actions: CommandAction[],
): SurfaceDescriptor[] {
  if (adapter.commandsDir === null) return [];
  const format = COMMAND_FORMATS[adapter.commandFormat];
  return actions.map((action) => ({
    templateId: COMMAND_TEMPLATE_ID,
    relativePath: `${adapter.commandsDir}/${actionFileName(adapter, action.name)}`,
    frontMatter: format.frontMatter(action),
    body: action.body,
  }));
}

type SkillTemplates = {
  skill: string;
  blueprint: string;
  components: string;
  guard: string;
};

function skillSurfaceDescriptors(
  adapter: HostAdapter,
  templates: SkillTemplates,
): SurfaceDescriptor[] {
  if (adapter.skillsDir === null) return [];
  const skillRoot = `${adapter.skillsDir}/iris-workspace`;
  return [
    {
      templateId: SKILL_TEMPLATE_ID,
      relativePath: `${skillRoot}/SKILL.md`,
      frontMatter: SKILL_FRONTMATTER,
      body: templates.skill,
    },
    {
      templateId: SKILL_TEMPLATE_ID,
      relativePath: `${skillRoot}/references/blueprint.md`,
      frontMatter: '',
      body: templates.blueprint,
    },
    {
      templateId: SKILL_TEMPLATE_ID,
      relativePath: `${skillRoot}/references/components.md`,
      frontMatter: '',
      body: templates.components,
    },
    {
      templateId: GUARD_TEMPLATE_ID,
      relativePath: `${adapter.skillsDir}/iris-guard/SKILL.md`,
      frontMatter: GUARD_FRONTMATTER,
      body: templates.guard,
    },
  ];
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

function selectedAdapters(hosts?: readonly string[]): HostAdapter[] {
  if (hosts === undefined) return [...HOST_TABLE];
  return hosts.map((id) => {
    const adapter = resolveAdapter(id);
    if (!adapter) {
      const valid = HOST_TABLE.map((entry) => entry.id).join(', ');
      throw new IrisError(1, `Unknown agent host '${id}'; valid hosts: ${valid}`);
    }
    return adapter;
  });
}

function asBody(template: string): string {
  return template.endsWith('\n') ? template : `${template}\n`;
}

export async function loadSurfaceDescriptors(
  hosts?: readonly string[],
): Promise<SurfaceDescriptor[]> {
  const root = packageRoot();
  const agentsDir = path.join(root, 'templates', 'agents');
  const [skill, blueprint, components, guard, commandTemplate] = await Promise.all([
    readFile(path.join(agentsDir, 'iris-workspace', 'SKILL.md'), 'utf8'),
    readFile(path.join(agentsDir, 'iris-workspace', 'references', 'blueprint.md'), 'utf8'),
    readFile(path.join(agentsDir, 'iris-workspace', 'references', 'components.md'), 'utf8'),
    readFile(path.join(agentsDir, 'iris-guard', 'SKILL.md'), 'utf8'),
    readFile(path.join(agentsDir, 'iris-commands.md'), 'utf8'),
  ]);
  const templates: SkillTemplates = {
    skill: asBody(skill),
    blueprint: asBody(blueprint),
    components: asBody(components),
    guard: asBody(guard),
  };
  const actions = parseCommandTemplate(commandTemplate);

  const descriptors = selectedAdapters(hosts).flatMap((adapter) => [
    ...skillSurfaceDescriptors(adapter, templates),
    ...commandSurfaceDescriptors(adapter, actions),
  ]);
  // Codex shares the agents skills directory; emit each unique path once so a
  // shared surface is installed (and reported) a single time.
  const seen = new Set<string>();
  return descriptors.filter((descriptor) => {
    if (seen.has(descriptor.relativePath)) return false;
    seen.add(descriptor.relativePath);
    return true;
  });
}

export async function installAgentSurfaces(
  cwd: string,
  selection: AgentSurfaceSelection = {},
): Promise<SkillInstallResult> {
  const version = packageVersion();
  const descriptors = await loadSurfaceDescriptors(selection.hosts);
  const result: SkillInstallResult = { created: [], updated: [], unchanged: [], conflicts: [] };
  for (const descriptor of descriptors) {
    await installSurface(cwd, descriptor, version, result);
  }
  return result;
}

function skillTargets(templateId: string, fileName: string): string[] {
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const adapter of HOST_TABLE) {
    if (adapter.skillsDir === null) continue;
    const target = `${adapter.skillsDir}/${templateId}/${fileName}`;
    if (seen.has(target)) continue;
    seen.add(target);
    targets.push(target);
  }
  return targets;
}

export const AGENT_SKILL_TARGETS: readonly string[] = skillTargets(SKILL_TEMPLATE_ID, 'SKILL.md');

export const AGENT_GUARD_TARGETS: readonly string[] = skillTargets(GUARD_TEMPLATE_ID, 'SKILL.md');

export { installAgentSurfaces as installAgentSkills };

export type AgentSurfaceStatus = 'installed' | 'missing' | 'unmanaged';

export type AgentSurfaceReport = {
  relativePath: string;
  templateId: string;
  status: AgentSurfaceStatus;
};

export async function inspectAgentSurfaces(
  cwd: string,
  selection: AgentSurfaceSelection = {},
): Promise<AgentSurfaceReport[]> {
  const descriptors = await loadSurfaceDescriptors(selection.hosts);
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

export { commandFileName } from './host-adapters.js';
