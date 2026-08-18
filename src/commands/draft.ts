import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { writeAlways } from '../lib/fs.js';
import { validateContract } from '../lib/schemas.js';

export type DraftKind = 'report' | 'feature' | 'bug' | 'idea' | 'plan';

function titleFromId(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildDraftPayload(kind: DraftKind, id: string): Record<string, unknown> {
  const created = new Date().toISOString();
  const title = titleFromId(id);

  switch (kind) {
    case 'report':
      return {
        iris: '1',
        type: 'report',
        id,
        title,
        status: 'draft',
        agent: 'copilot',
        created,
        updated: created,
        commit: '0'.repeat(40),
        tags: ['report'],
        sections: {
          summary: ['Draft summary'],
          open_items: { md: 'Add open items here.' },
          promotable_as: ['feature'],
        },
      };
    case 'feature':
      return {
        iris: '1',
        type: 'feature',
        id,
        title,
        status: 'draft',
        agent: 'copilot',
        created,
        updated: created,
        commit: '0'.repeat(40),
        tags: ['feature'],
        sections: {
          problem: { md: 'Describe the problem.' },
          goal: { md: 'Describe the outcome.' },
          tasks: [{ id: '1', title: 'Draft task', done: false }],
        },
      };
    case 'bug':
      return {
        iris: '1',
        type: 'bug',
        id,
        title,
        status: 'draft',
        agent: 'copilot',
        created,
        updated: created,
        commit: '0'.repeat(40),
        tags: ['bug'],
        sections: {
          symptom: { md: 'Describe the bug symptom.' },
          severity: 'p2',
          timeline: {
            events: [{ t: '0m', title: 'Reproduced', level: 'info' }],
          },
        },
      };
    case 'idea':
      return {
        iris: '1',
        type: 'idea',
        id,
        title,
        status: 'draft',
        agent: 'copilot',
        created,
        updated: created,
        commit: '0'.repeat(40),
        tags: ['idea'],
        sections: {
          current_state: { md: 'Describe the current state.' },
          proposed: { md: 'Describe the proposal.' },
          effort_impact: { effort: 2, impact: 3 },
        },
      };
    case 'plan':
      return {
        iris: '1',
        type: 'plan',
        id,
        title,
        status: 'draft',
        agent: 'copilot',
        created,
        updated: created,
        commit: '0'.repeat(40),
        tags: ['plan'],
        sections: {
          goal: { md: 'Describe the goal.' },
          steps: [{ id: '1', title: 'Draft first step' }],
        },
      };
    default:
      throw new IrisError(1, `Unsupported draft kind: ${kind}`);
  }
}

export async function runDraftCommand(cwd: string, kind: DraftKind, id: string): Promise<void> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new IrisError(1, `Draft id must be lowercase kebab-case: ${id}`);
  }

  const payload = buildDraftPayload(kind, id);
  const dataPath = path.join(cwd, 'iris', 'pages', id, 'data.json');

  await validateContract(kind, payload, dataPath);
  await writeAlways(dataPath, JSON.stringify(payload, null, 2) + '\n');

  process.stdout.write(`created ${path.relative(cwd, dataPath)}\n`);
}
