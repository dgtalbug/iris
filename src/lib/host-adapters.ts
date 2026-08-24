import { existsSync } from 'node:fs';
import path from 'node:path';
import { IrisError } from './errors.js';

export type HostAdapterId = 'claude' | 'agents' | 'github' | 'cursor' | 'gemini' | 'codex';

export type HostAdapter = {
  id: HostAdapterId;
  displayName: string;
  /** Project-relative paths; the presence of any one signals this host. */
  detect: string[];
  /** Directory that receives generated `iris-*` skill directories, each holding a SKILL.md. */
  skillsDir: string | null;
  /** Directory that receives generated command files; null for skills-only hosts. */
  commandsDir: string | null;
  /** Command filename template with an `<action>` placeholder; null when commandsDir is null. */
  commandFileFormat: string | null;
  /** Human-facing note when the host only picks up new surfaces after a restart. */
  requiresIdeRestart?: string;
};

export const HOST_ADAPTERS: readonly HostAdapter[] = [
  {
    id: 'claude',
    displayName: 'Claude Code',
    detect: ['.claude/'],
    skillsDir: '.claude/skills',
    commandsDir: '.claude/commands/iris',
    commandFileFormat: '<action>.md',
  },
  {
    id: 'agents',
    displayName: 'Agents (shared)',
    detect: ['.agents/skills/'],
    skillsDir: '.agents/skills',
    commandsDir: null,
    commandFileFormat: null,
  },
  {
    id: 'github',
    displayName: 'GitHub Copilot',
    detect: ['.github/copilot-instructions.md', '.github/prompts', '.github/skills'],
    skillsDir: '.github/skills',
    commandsDir: '.github/prompts',
    commandFileFormat: 'iris-<action>.prompt.md',
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    detect: ['.cursor/'],
    skillsDir: '.cursor/skills',
    commandsDir: '.cursor/commands',
    commandFileFormat: 'iris-<action>.md',
    requiresIdeRestart: 'Reload the Cursor window so the new commands and skills are indexed.',
  },
  {
    id: 'gemini',
    displayName: 'Gemini CLI',
    detect: ['.gemini/'],
    skillsDir: '.gemini/skills',
    commandsDir: null,
    commandFileFormat: null,
    requiresIdeRestart: 'Restart the Gemini CLI session so it picks up the new skills.',
  },
  {
    id: 'codex',
    displayName: 'Codex',
    detect: ['.codex/', 'AGENTS.md'],
    skillsDir: '.agents/skills',
    commandsDir: null,
    commandFileFormat: null,
  },
];

export const HOST_ADAPTER_IDS: readonly HostAdapterId[] = HOST_ADAPTERS.map(
  (adapter) => adapter.id,
);

export function detectHosts(cwd: string): HostAdapter[] {
  return HOST_ADAPTERS.filter((adapter) =>
    adapter.detect.some((signal) => existsSync(path.join(cwd, signal))),
  );
}

export function resolveAdapter(id: string): HostAdapter {
  const adapter = HOST_ADAPTERS.find((entry) => entry.id === id);
  if (!adapter) {
    throw new IrisError(
      1,
      `Unknown host adapter: "${id}". Valid adapters: ${HOST_ADAPTER_IDS.join(', ')}`,
    );
  }
  return adapter;
}

export function commandFileName(adapter: HostAdapter, action: string): string | null {
  if (!adapter.commandFileFormat) return null;
  return adapter.commandFileFormat.replaceAll('<action>', action);
}
