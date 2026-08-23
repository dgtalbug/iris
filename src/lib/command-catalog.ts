export type CommandStatus = 'implemented' | 'partial' | 'stubbed';

export type CommandEntry = {
  /** Display name; may cover several sibling commands that share one contract shape. */
  name: string;
  /** Command words this entry dispatches, in CLI order. */
  commands: string[];
  usage: string;
  synopsis: string;
  flags: string[];
  status: CommandStatus;
  /** Present for entries that create editable content; used by agent guidance. */
  intent?: string;
  /** Where the created or refreshed output lands. */
  lands?: string;
};

export type CommandGroup = {
  id: string;
  label: string;
  entries: CommandEntry[];
};

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    id: 'setup',
    label: 'Set up the workspace',
    entries: [
      {
        name: 'init',
        commands: ['init'],
        usage: 'iris init',
        synopsis:
          'Create or safely upgrade the workspace, agent surfaces, OpenSpec snapshot, and generated pages.',
        flags: ['--json'],
        status: 'implemented',
      },
      {
        name: 'update',
        commands: ['update'],
        usage: 'iris update',
        synopsis:
          'Refresh managed design assets, the editor task, and agent surfaces while preserving user content.',
        flags: ['--json'],
        status: 'implemented',
      },
      {
        name: 'vendor',
        commands: ['vendor'],
        usage: 'iris vendor',
        synopsis: 'Copy the pinned Mermaid runtime locally so diagrams render offline.',
        flags: ['--json'],
        status: 'implemented',
      },
      {
        name: 'open',
        commands: ['open'],
        usage: 'iris open',
        synopsis: 'Open the generated workspace in the default browser.',
        flags: ['--json'],
        status: 'implemented',
      },
    ],
  },
  {
    id: 'content',
    label: 'Record work',
    entries: [
      {
        name: 'research',
        commands: ['research'],
        usage: 'iris research <id>',
        synopsis:
          'Start a Markdown research page for an investigation, comparison, or written-up answer.',
        flags: ['--json'],
        status: 'implemented',
        intent: 'You investigated something or wrote up an answer',
        lands: 'iris/research/<id>/index.md',
      },
      {
        name: 'report',
        commands: ['report'],
        usage: 'iris report <id>',
        synopsis: 'Draft a report contract summarizing a session or a review.',
        flags: ['--json', '--from-session <path>'],
        status: 'implemented',
        intent: 'You finished a working session and want a summary',
        lands: 'iris/pages/<id>/data.json',
      },
      {
        name: 'bug',
        commands: ['bug'],
        usage: 'iris bug <id>',
        synopsis: 'Draft a bug contract with symptom, severity, and timeline.',
        flags: ['--json'],
        status: 'implemented',
        intent: 'You reproduced, diagnosed, or fixed a bug',
        lands: 'iris/pages/<id>/data.json',
      },
      {
        name: 'feature',
        commands: ['feature'],
        usage: 'iris feature <id>',
        synopsis: 'Draft a feature contract with problem, goal, and tasks.',
        flags: ['--json'],
        status: 'implemented',
        intent: 'You built or scoped a feature',
        lands: 'iris/pages/<id>/data.json',
      },
      {
        name: 'idea',
        commands: ['idea'],
        usage: 'iris idea <id>',
        synopsis: 'Draft an idea contract with current state, proposal, and effort/impact.',
        flags: ['--json'],
        status: 'implemented',
        intent: 'You proposed something worth keeping',
        lands: 'iris/pages/<id>/data.json',
      },
      {
        name: 'plan',
        commands: ['plan'],
        usage: 'iris plan <id>',
        synopsis: 'Draft a plan contract with a goal and ordered steps.',
        flags: ['--json'],
        status: 'implemented',
        intent: 'You planned a milestone or a sequence of steps',
        lands: 'iris/pages/<id>/data.json',
      },
    ],
  },
  {
    id: 'render',
    label: 'Render',
    entries: [
      {
        name: 'render',
        commands: ['render'],
        usage: 'iris render [<id>|--all]',
        synopsis:
          'Render contracts and research to HTML and refresh every section page; a full render also refreshes the OpenSpec snapshot.',
        flags: ['--all', '--json'],
        status: 'implemented',
        intent: 'You edited any source and want the workspace updated',
        lands: 'iris/index.html and the section pages',
      },
    ],
  },
  {
    id: 'lifecycle',
    label: 'Lifecycle',
    entries: [
      {
        name: 'archive',
        commands: ['archive'],
        usage: 'iris archive <id>',
        synopsis: 'Move a page into the archive and refresh navigation.',
        flags: ['--json'],
        status: 'implemented',
      },
      {
        name: 'promote',
        commands: ['promote'],
        usage: 'iris promote <report-id> <feature|bug|idea>',
        synopsis: 'Remap report sections into a promoted page and link both.',
        flags: ['--json'],
        status: 'stubbed',
      },
    ],
  },
  {
    id: 'share',
    label: 'Share',
    entries: [
      {
        name: 'publish',
        commands: ['publish'],
        usage: 'iris publish [<id>] [--output path]',
        synopsis: 'Write a portable standalone HTML artifact with workspace chrome removed.',
        flags: ['--output', '--json'],
        status: 'implemented',
      },
      {
        name: 'export',
        commands: ['export'],
        usage: 'iris export <id> --single',
        synopsis:
          'Export standalone HTML. PNG and PDF remain unavailable until a deterministic browser policy is approved.',
        flags: ['--single', '--png', '--pdf', '--output', '--json'],
        status: 'partial',
      },
    ],
  },
];

export const ALL_COMMANDS: string[] = COMMAND_GROUPS.flatMap((group) =>
  group.entries.flatMap((entry) => entry.commands),
);

/** Content actions that get a generated slash-command surface. */
export const CONTENT_ACTIONS: string[] =
  COMMAND_GROUPS.find((group) => group.id === 'content')?.entries.flatMap(
    (entry) => entry.commands,
  ) ?? [];

export function commandEntry(name: string): CommandEntry | undefined {
  for (const group of COMMAND_GROUPS) {
    const found = group.entries.find((entry) => entry.commands.includes(name));
    if (found) return found;
  }
  return undefined;
}

export function statusCounts(): Record<CommandStatus, number> {
  const counts: Record<CommandStatus, number> = { implemented: 0, partial: 0, stubbed: 0 };
  for (const group of COMMAND_GROUPS) {
    for (const entry of group.entries) counts[entry.status] += 1;
  }
  return counts;
}

export function helpText(version: string): string {
  const groups = COMMAND_GROUPS.map((group) => {
    const width = Math.max(...group.entries.map((entry) => entry.usage.length));
    const lines = group.entries.map((entry) => {
      const suffix = entry.status === 'implemented' ? '' : `  (${entry.status})`;
      return `  ${entry.usage.padEnd(width)}  ${entry.synopsis}${suffix}`;
    });
    return `${group.label}:\n${lines.join('\n')}`;
  }).join('\n\n');

  return `iris v${version}
Usage: iris <command> [options]

${groups}

Every command accepts --json. Run iris --version to print the installed version.
Full reference: iris/commands.html
`;
}
