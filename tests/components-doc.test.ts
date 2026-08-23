import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ElectricContainerName } from '../src/lib/markdown-electric.js';

/**
 * The canonical Markdown construct list the flagship skill documents, mirrored
 * against the renderer's container layer (`src/lib/markdown-electric.ts`). The
 * type-level assertion below pins the documented containers to the renderer's
 * `ElectricContainerName` union in both directions, and the runtime probe
 * proves the parser accepts every documented container — so the skill can
 * never document a construct the renderer rejects. Drift fails here.
 */
export type CanonicalComponent = {
  /** Construct name; the cookbook's `## <name>` section heading. */
  name: string;
  /** The fence or inline marker the doc must show. */
  syntax: string;
  /** The token-only CSS classes the doc must name. */
  classes: readonly string[];
};

export const CANONICAL_CONTAINERS = [
  'callout',
  'evidence',
  'steps',
  'timeline',
  'filetree',
  'flow',
  'details',
  'meter',
] as const;

/** Footnotes and confidence badges are inline/core constructs, not containers. */
export const CANONICAL_COMPONENTS: readonly CanonicalComponent[] = [
  {
    name: 'callout',
    syntax: '::: callout',
    classes: ['.callout', '.c-info', '.c-warn', '.c-danger', '.c-success'],
  },
  { name: 'evidence', syntax: '::: evidence src=', classes: ['.evidence', '.src'] },
  { name: 'steps', syntax: '::: steps', classes: ['.steps'] },
  { name: 'timeline', syntax: '::: timeline', classes: ['.timeline', '.when', '.what'] },
  {
    name: 'filetree',
    syntax: '::: filetree',
    classes: ['.filetree', '.dir', '.file', '.hot', '.note'],
  },
  { name: 'flow', syntax: '::: flow', classes: ['.flow', '.node', '.edge'] },
  { name: 'details', syntax: '::: details', classes: ['details.ds'] },
  { name: 'meter', syntax: '::: meter value=', classes: ['.meter', '.track', '.fill'] },
  { name: 'footnotes', syntax: '[^', classes: ['.footnotes', 'sup.fn'] },
  {
    name: 'badges',
    syntax: '**[HIGH]**',
    classes: ['.badge', '.confidence', '.b-success', '.b-warning', '.b-danger'],
  },
];

export const CANONICAL_COMPONENT_NAMES: readonly string[] = CANONICAL_COMPONENTS.map(
  (component) => component.name,
);

type DocumentedContainer = (typeof CANONICAL_CONTAINERS)[number];
type ContainersMatchRenderer = ElectricContainerName extends DocumentedContainer
  ? DocumentedContainer extends ElectricContainerName
    ? true
    : never
  : never;
const containersMatchRenderer: ContainersMatchRenderer = true;
void containersMatchRenderer;

const BLUEPRINT_SECTION_IDS = [
  'tldr',
  'question',
  'map',
  'territory',
  'findings',
  'numbers',
  'paths',
  'risks',
  'proposal',
  'appendix',
] as const;

const repoRoot = path.resolve(import.meta.dirname, '..');

async function readTemplate(relativePath: string): Promise<string> {
  return readFile(path.join(repoRoot, 'templates', 'agents', relativePath), 'utf8');
}

function sections(doc: string): Map<string, string> {
  const headings = [...doc.matchAll(/^## ([a-z]+)$/gm)];
  const map = new Map<string, string>();
  headings.forEach((heading, index) => {
    const start = heading.index ?? 0;
    const end =
      index + 1 < headings.length ? (headings[index + 1].index ?? doc.length) : doc.length;
    map.set(heading[1], doc.slice(start, end));
  });
  return map;
}

describe('the component cookbook', () => {
  it('documents exactly the canonical constructs, in order', async () => {
    const doc = await readTemplate('iris-workspace/references/components.md');
    const headings = [...doc.matchAll(/^## ([a-z]+)$/gm)].map((match) => match[1]);
    expect(headings).toEqual([...CANONICAL_COMPONENT_NAMES]);
  });

  it('shows the syntax and every emitted class for each construct', async () => {
    const doc = await readTemplate('iris-workspace/references/components.md');
    const byName = sections(doc);
    for (const component of CANONICAL_COMPONENTS) {
      const section = byName.get(component.name);
      expect(section, `section for ${component.name}`).toBeDefined();
      expect(section, `${component.name} shows its syntax`).toContain(component.syntax);
      for (const className of component.classes) {
        expect(section, `${component.name} names ${className}`).toContain(className);
      }
      expect(section, `${component.name} carries an example`).toContain('```markdown');
    }
  });

  it('documents the ten blueprint sections in fixed order', async () => {
    const doc = await readTemplate('iris-workspace/references/blueprint.md');
    const ids = [...doc.matchAll(/^## \d+\. .*`#([a-z]+)`/gm)].map((match) => match[1]);
    expect(ids).toEqual([...BLUEPRINT_SECTION_IDS]);
  });

  const rendererModule = path.join(repoRoot, 'src', 'lib', 'markdown-electric.ts');
  it.runIf(existsSync(rendererModule))(
    'the renderer accepts every documented container and rejects others',
    async () => {
      const { parseContainerOpen } = await import('../src/lib/markdown-electric.js');
      for (const name of CANONICAL_CONTAINERS) {
        expect(parseContainerOpen(`::: ${name}`), `renderer accepts ${name}`).not.toBeNull();
      }
      expect(parseContainerOpen('::: mermaid')).toBeNull();
      expect(parseContainerOpen('::: not-a-construct')).toBeNull();
    },
  );
});
