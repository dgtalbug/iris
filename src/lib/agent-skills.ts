import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from './errors.js';
import { ensureDir } from './fs.js';
import { packageRoot, packageVersion } from './package-info.js';

const MARKER_SCHEMA = 2;
const START_PREFIX = '<!-- IRIS:MANAGED:START';
const SKILL_TEMPLATE_ID = 'iris-workspace';
const GUARD_TEMPLATE_ID = 'iris-guard';
const COMMAND_TEMPLATE_ID = 'iris-command';

/**
 * Wave-1 integration seam: the authoritative host table, `detectHosts(cwd)`,
 * and `resolveAdapter(id)` live in `src/lib/host-adapters.ts` (owned by
 * workstream A). Until that module lands, this file mirrors its public shape
 * so surface generation is already adapter-driven: the type below is the
 * contract, and the stand-in table keeps generation working. When the module
 * exists, delete the stand-ins and import the real table instead — no other
 * code here changes.
 */
export type HostCommandFormat = 'claude-markdown' | 'copilot-prompt';

export type HostAdapter = {
  /** Stable identifier used by tool selection and reports. */
  id: string;
  /** Human label for the picker and the completion card. */
  displayName: string;
  /** Filesystem signals detection reads; never written to user config. */
  detectPaths: readonly string[];
  /** Directory that receives skill directories; null for command-only hosts. */
  skillsDir: string | null;
  /** Directory that receives generated commands; null for skills-only hosts. */
  commandsDir: string | null;
  /** Command filename pattern; `<name>` is the action name. */
  commandFile: string;
  /** Front-matter dialect for generated commands. */
  commandFormat: HostCommandFormat;
};

/**
 * Stand-in rows pending workstream A's authoritative table. The claude,
 * agents, and github rows reproduce the targets Iris has always written; the
 * cursor, gemini, and codex rows are placeholders the real table replaces.
 */
const FALLBACK_HOST_ADAPTERS: readonly HostAdapter[] = [
  {
    id: 'claude',
    displayName: 'Claude Code',
    detectPaths: ['.claude'],
    skillsDir: '.claude/skills',
    commandsDir: '.claude/commands/iris',
    commandFile: '<name>.md',
    commandFormat: 'claude-markdown',
  },
  {
    id: 'agents',
    displayName: 'Agents',
    detectPaths: ['.agents', 'AGENTS.md'],
    skillsDir: '.agents/skills',
    commandsDir: null,
    commandFile: '<name>.md',
    commandFormat: 'claude-markdown',
  },
  {
    id: 'github',
    displayName: 'GitHub Copilot',
    detectPaths: ['.github/copilot-instructions.md', '.github/instructions'],
    skillsDir: '.github/skills',
    commandsDir: '.github/prompts',
    commandFile: 'iris-<name>.prompt.md',
    commandFormat: 'copilot-prompt',
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    detectPaths: ['.cursor', '.cursorrules'],
    skillsDir: '.cursor/skills',
    commandsDir: '.cursor/commands',
    commandFile: 'iris-<name>.md',
    commandFormat: 'claude-markdown',
  },
  {
    id: 'gemini',
    displayName: 'Gemini',
    detectPaths: ['.gemini', 'GEMINI.md'],
    skillsDir: '.gemini/skills',
    commandsDir: null,
    commandFile: 'iris-<name>.md',
    commandFormat: 'claude-markdown',
  },
  {
    id: 'codex',
    displayName: 'Codex',
    detectPaths: ['.codex'],
    skillsDir: '.codex/skills',
    commandsDir: '.codex/prompts',
    commandFile: 'iris-<name>.md',
    commandFormat: 'claude-markdown',
  },
];

/** The adapter table generation consumes; the workstream-A module's once it lands. */
export function listHostAdapters(): readonly HostAdapter[] {
  return FALLBACK_HOST_ADAPTERS;
}

export function resolveAdapter(id: string): HostAdapter | undefined {
  return FALLBACK_HOST_ADAPTERS.find((adapter) => adapter.id === id);
}

/** Stand-in filesystem detection; workstream A owns the real heuristics. */
export async function detectHosts(cwd: string): Promise<HostAdapter[]> {
  const detected: HostAdapter[] = [];
  for (const adapter of FALLBACK_HOST_ADAPTERS) {
    if (adapter.detectPaths.some((signal) => existsSync(path.join(cwd, signal)))) {
      detected.push(adapter);
    }
  }
  return detected;
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

/** Which hosts receive surfaces; defaults to every known adapter. */
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

const COMMAND_FORMATS: Record<
  HostCommandFormat,
  { frontMatter: (action: CommandAction) => string }
> = {
  'claude-markdown': { frontMatter: claudeCommandFrontMatter },
  'copilot-prompt': { frontMatter: copilotPromptFrontMatter },
};

/** One command file per content action for an adapter that takes commands. */
export function commandSurfaceDescriptors(
  adapter: HostAdapter,
  actions: CommandAction[],
): SurfaceDescriptor[] {
  if (adapter.commandsDir === null) return [];
  const format = COMMAND_FORMATS[adapter.commandFormat];
  return actions.map((action) => ({
    templateId: COMMAND_TEMPLATE_ID,
    relativePath: `${adapter.commandsDir}/${adapter.commandFile.replace(/<name>/g, action.name)}`,
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

/** The flagship skill directory plus the guard skill for one host. */
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
  if (hosts === undefined) return [...FALLBACK_HOST_ADAPTERS];
  return hosts.map((id) => {
    const adapter = resolveAdapter(id);
    if (!adapter) {
      const valid = FALLBACK_HOST_ADAPTERS.map((entry) => entry.id).join(', ');
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

  return selectedAdapters(hosts).flatMap((adapter) => [
    ...skillSurfaceDescriptors(adapter, templates),
    ...commandSurfaceDescriptors(adapter, actions),
  ]);
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
  return FALLBACK_HOST_ADAPTERS.filter((adapter) => adapter.skillsDir !== null).map(
    (adapter) => `${adapter.skillsDir}/${templateId}/${fileName}`,
  );
}

/** The flagship skill's SKILL.md path for every skills-capable host. */
export const AGENT_SKILL_TARGETS: readonly string[] = skillTargets(SKILL_TEMPLATE_ID, 'SKILL.md');

/** The provenance guard's SKILL.md path for every skills-capable host. */
export const AGENT_GUARD_TARGETS: readonly string[] = skillTargets(GUARD_TEMPLATE_ID, 'SKILL.md');

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
