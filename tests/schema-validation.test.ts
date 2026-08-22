import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateContract } from '../src/lib/schemas.js';

async function loadFixture(name: string): Promise<any> {
  const content = await readFile(path.resolve(`tests/fixtures/${name}`), 'utf8');
  return JSON.parse(content);
}

describe('schema validation', () => {
  it('accepts a valid bug fixture', async () => {
    const valid = await loadFixture('base-valid.json');
    await expect(
      validateContract('bug', valid, 'pages/bug-cache-stampede/data.json'),
    ).resolves.toBeUndefined();
  });

  it('rejects invalid report fixture with actionable error', async () => {
    const invalid = await loadFixture('base-valid.json');
    invalid.type = 'report';
    invalid.sections = {
      summary: ['a', 'b', 'c', 'd', 'e', 'f'],
      open_items: { md: 'todo' },
      promotable_as: ['feature'],
    };
    await expect(validateContract('report', invalid, '/tmp/report.json')).rejects.toThrow(
      /field: \/sections\/summary/,
    );
  });

  it('rejects invalid feature fixture with actionable error', async () => {
    const invalid = await loadFixture('base-valid.json');
    invalid.type = 'feature';
    invalid.sections = {
      problem: { md: 'x' },
      goal: { md: 'y' },
      tasks: [{ id: 'a', title: 't', done: 'no' }],
    };
    await expect(validateContract('feature', invalid, '/tmp/feature.json')).rejects.toThrow(
      /hint:/,
    );
  });

  it('accepts optional feature design sections and rejects unknown design keys', async () => {
    const feature = await loadFixture('base-valid.json');
    feature.type = 'feature';
    feature.sections = {
      problem: { md: 'x' },
      goal: { md: 'y' },
      tasks: [],
      design: { hld: { md: '```mermaid\nflowchart LR\n  A --> B\n```' }, lld: { md: 'seq' } },
    };
    await expect(
      validateContract('feature', feature, '/tmp/feature.json'),
    ).resolves.toBeUndefined();

    feature.sections.design = { erd: { md: 'nope' } };
    await expect(validateContract('feature', feature, '/tmp/feature.json')).rejects.toThrow(
      /field: \/sections\/design/,
    );
  });

  it('rejects invalid bug fixture with actionable error', async () => {
    const invalid = await loadFixture('base-valid.json');
    invalid.sections.severity = 'critical';
    await expect(validateContract('bug', invalid, '/tmp/bug.json')).rejects.toThrow(/expected:/);
  });

  it('rejects invalid idea fixture with actionable error', async () => {
    const invalid = await loadFixture('base-valid.json');
    invalid.type = 'idea';
    invalid.sections = {
      current_state: { md: 'a' },
      proposed: { md: 'b' },
      effort_impact: { effort: 7, impact: 2 },
    };
    await expect(validateContract('idea', invalid, '/tmp/idea.json')).rejects.toThrow(/field:/);
  });

  it('rejects invalid plan fixture with actionable error', async () => {
    const invalid = await loadFixture('base-valid.json');
    invalid.type = 'plan';
    invalid.sections = { goal: { md: 'a' }, steps: [{ id: 2, title: 'wrong' }] };
    await expect(validateContract('plan', invalid, '/tmp/plan.json')).rejects.toThrow(
      /fix hint|hint:/,
    );
  });
});
