import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateContract } from '../src/lib/schemas.js';
import type { ProjectDocItem } from '../src/lib/project-docs.js';
import type { ResearchItem } from '../src/lib/research-workspace.js';
import { blueprintEntries, renderBlueprint } from '../src/templates/pages/blueprint.js';
import { renderCharts } from '../src/templates/pages/charts.js';
import { renderContractPage } from '../src/templates/pages/contract-page.js';
import { renderElectricMarkdown } from '../src/templates/pages/electric-markdown.js';
import { projectDocContent } from '../src/templates/pages/project-doc.js';
import { researchDocumentContent } from '../src/templates/pages/research.js';

async function loadBase(): Promise<any> {
  const content = await readFile(path.resolve('tests/fixtures/base-valid.json'), 'utf8');
  return JSON.parse(content);
}

function contractFor(type: string, sections: Record<string, unknown>, base: any): any {
  return { ...base, type, id: `${type}-blueprint-test`, sections };
}

const VALID_SECTIONS: Record<string, Record<string, unknown>> = {
  bug: {
    symptom: { md: 'requests spike' },
    severity: 'p1',
    timeline: { events: [{ t: '2026-08-18T00:00:00.000Z', title: 'alarm', level: 'warn' }] },
  },
  feature: {
    problem: { md: 'x' },
    goal: { md: 'y' },
    tasks: [],
  },
  idea: {
    current_state: { md: 'a' },
    proposed: { md: 'b' },
    effort_impact: { effort: 2, impact: 3 },
  },
  plan: {
    goal: { md: 'a' },
    steps: [],
  },
  report: {
    summary: ['one'],
    open_items: { md: 'todo' },
    promotable_as: ['feature'],
  },
};

describe('blueprint schema (additive)', () => {
  it('accepts a draft with sections.blueprint for every contract type', async () => {
    const base = await loadBase();
    for (const [type, sections] of Object.entries(VALID_SECTIONS)) {
      const contract = contractFor(
        type,
        {
          ...sections,
          blueprint: { tldr: 'Short.', findings: 'Found **things**.' },
        },
        base,
      );
      await expect(
        validateContract(type as 'bug', contract, `/tmp/${type}.json`),
      ).resolves.toBeUndefined();
    }
  });

  it('still validates drafts without a blueprint', async () => {
    const base = await loadBase();
    for (const [type, sections] of Object.entries(VALID_SECTIONS)) {
      const contract = contractFor(type, sections, base);
      await expect(
        validateContract(type as 'bug', contract, `/tmp/${type}.json`),
      ).resolves.toBeUndefined();
    }
  });

  it('rejects an unknown blueprint key', async () => {
    const base = await loadBase();
    const contract = contractFor(
      'bug',
      { ...VALID_SECTIONS.bug, blueprint: { tl_dr: 'nope' } },
      base,
    );
    await expect(validateContract('bug', contract, '/tmp/bug.json')).rejects.toThrow(
      /\/sections\/blueprint/,
    );
  });

  it('rejects a non-string blueprint section', async () => {
    const base = await loadBase();
    const contract = contractFor(
      'report',
      { ...VALID_SECTIONS.report, blueprint: { tldr: ['not', 'a', 'string'] } },
      base,
    );
    await expect(validateContract('report', contract, '/tmp/report.json')).rejects.toThrow(
      /\/sections\/blueprint/,
    );
  });

  it('accepts report charts and rejects an unknown chart kind', async () => {
    const base = await loadBase();
    const contract = contractFor(
      'report',
      {
        ...VALID_SECTIONS.report,
        charts: [
          {
            kind: 'bar',
            title: 'Latency',
            labels: ['before', 'after'],
            series: [{ name: 'p50', values: [4, 2] }],
          },
        ],
      },
      base,
    );
    await expect(validateContract('report', contract, '/tmp/report.json')).resolves.toBeUndefined();

    const invalid = contractFor(
      'report',
      {
        ...VALID_SECTIONS.report,
        charts: [{ kind: 'pie', title: 'x', labels: [], series: [{ name: 's', values: [1] }] }],
      },
      base,
    );
    await expect(validateContract('report', invalid, '/tmp/report.json')).rejects.toThrow(
      /\/sections\/charts/,
    );
  });
});

describe('blueprint page composition', () => {
  it('renders narrative sections above typed widgets in canonical order', async () => {
    const base = await loadBase();
    const contract = contractFor(
      'bug',
      {
        ...VALID_SECTIONS.bug,
        blueprint: {
          paths: 'Every failing call.',
          tldr: 'Cache stampede, fixed by jitter.',
          findings: 'Warmup hammers the origin.',
        },
      },
      base,
    );
    const html = renderContractPage(contract);
    const tldr = html.indexOf('data-blueprint-section="tldr"');
    const findings = html.indexOf('data-blueprint-section="findings"');
    const paths = html.indexOf('data-blueprint-section="paths"');
    expect(tldr).toBeGreaterThan(-1);
    expect(tldr).toBeLessThan(findings);
    expect(findings).toBeLessThan(paths);
    expect(paths).toBeLessThan(html.indexOf('<h2>Symptom</h2>'));
    expect(paths).toBeLessThan(html.indexOf('<h2>Timeline</h2>'));
  });

  it('renders the legacy layout when blueprint is absent', async () => {
    const base = await loadBase();
    const html = renderContractPage(contractFor('bug', VALID_SECTIONS.bug, base));
    expect(html).not.toContain('blueprint-section');
    expect(html).toContain('<h2>Symptom</h2>');
    expect(html).toContain('<h2>Timeline</h2>');
  });

  it('omits empty blueprint sections', () => {
    const entries = blueprintEntries({
      blueprint: { tldr: 'Real content.', question: '', map: '   ', findings: 'More.' },
    });
    expect(entries.map((entry) => entry.id)).toEqual(['tldr', 'findings']);
    const html = renderBlueprint('report', 'r1', {
      blueprint: { tldr: 'Real content.', question: '', findings: 'More.' },
    });
    expect(html).toContain('data-blueprint-section="tldr"');
    expect(html).not.toContain('data-blueprint-section="question"');
  });

  it('emphasizes bug findings and danger-toned error paths', () => {
    const html = renderBlueprint('bug', 'b1', {
      blueprint: { tldr: 't', findings: 'f', paths: 'p' },
    });
    expect(html).toContain(
      '<section class="card doc-body blueprint-section c-danger" id="blueprint-paths" data-blueprint-section="paths">',
    );
    expect(html).toContain(
      '<section class="card doc-body blueprint-section" id="blueprint-findings" data-blueprint-section="findings">',
    );
    expect(html).toContain('<details class="ds blueprint-section" id="blueprint-tldr"');
  });

  it('puts feature proposal, options, and tradeoffs in tabs', () => {
    const html = renderBlueprint('feature', 'f1', {
      blueprint: { tldr: 't', proposal: 'p', territory: 'alt', risks: 'cost' },
    });
    expect(html).toContain('role="tablist"');
    expect(html).toContain('data-blueprint-tabs="proposal territory risks"');
    expect(html).toContain('>Proposal</button>');
    expect(html).toContain('>Options</button>');
    expect(html).toContain('>Tradeoffs</button>');
    expect(html.indexOf('data-blueprint-section="tldr"')).toBeLessThan(
      html.indexOf('data-blueprint-tabs='),
    );
  });

  it('opens tldr and numbers on reports, question and proposal on ideas, proposal on plans', () => {
    const report = renderBlueprint('report', 'r1', {
      blueprint: { tldr: 't', numbers: 'n', risks: 'r' },
    });
    expect(report).toContain(
      '<section class="card doc-body blueprint-section" id="blueprint-tldr"',
    );
    expect(report).toContain(
      '<section class="card doc-body blueprint-section" id="blueprint-numbers"',
    );
    expect(report).toContain('<details class="ds blueprint-section" id="blueprint-risks"');

    const idea = renderBlueprint('idea', 'i1', {
      blueprint: { question: 'q', proposal: 'p', map: 'm' },
    });
    expect(idea).toContain(
      '<section class="card doc-body blueprint-section" id="blueprint-question"',
    );
    expect(idea).toContain(
      '<section class="card doc-body blueprint-section" id="blueprint-proposal"',
    );
    expect(idea).toContain('<details class="ds blueprint-section" id="blueprint-map"');

    const plan = renderBlueprint('plan', 'p1', { blueprint: { proposal: 'p', risks: 'r' } });
    expect(plan).toContain(
      '<section class="card doc-body blueprint-section" id="blueprint-proposal"',
    );
    expect(plan).toContain('<details class="ds blueprint-section" id="blueprint-risks"');
  });
});

describe('inline SVG charts', () => {
  const charts = [
    {
      kind: 'bar',
      title: 'Latency budget',
      labels: ['before', 'after'],
      series: [
        { name: 'p50', values: [4, 2] },
        { name: 'p99', values: [9, 5] },
      ],
    },
    {
      kind: 'line',
      title: 'Trend',
      labels: ['a', 'b', 'c'],
      series: [{ name: 's', values: [1, 3, 2] }],
    },
    {
      kind: 'doughnut',
      title: 'Share',
      labels: ['x', 'y'],
      series: [{ name: 'share', values: [3, 1] }],
    },
  ];

  it('renders bar, line, and doughnut as inline SVG with token-order colors', () => {
    const html = renderCharts(charts);
    expect(html).toContain('data-chart="bar"');
    expect(html).toContain('data-chart="line"');
    expect(html).toContain('data-chart="doughnut"');
    expect(html).toContain('<svg');
    expect(html).toContain('<polyline');
    expect(html).toContain('stroke-dasharray');
    expect(html.indexOf('var(--primary)')).toBeLessThan(html.indexOf('var(--accent-1)'));
  });

  it('carries no network or file reference', () => {
    const html = renderCharts(charts);
    expect(html).not.toMatch(/https?:|src=|href=|url\(/);
  });

  it('is deterministic and skips malformed entries', () => {
    expect(renderCharts(charts)).toBe(renderCharts(charts));
    expect(renderCharts([{ kind: 'pie' }, { kind: 'bar', series: [] }, null])).toBe('');
    expect(renderCharts(undefined)).toBe('');
  });

  it('renders charts on report pages above the typed summary', async () => {
    const base = await loadBase();
    const contract = contractFor('report', { ...VALID_SECTIONS.report, charts: [charts[0]] }, base);
    const html = renderContractPage(contract);
    const chart = html.indexOf('data-chart="bar"');
    expect(chart).toBeGreaterThan(-1);
    expect(chart).toBeLessThan(html.indexOf('<h2>Summary</h2>'));
  });
});

describe('electric markdown seam and report chrome', () => {
  it('returns html, toc, and meta from the pipeline', () => {
    const { html, toc, meta } = renderElectricMarkdown('## Question\n\nWhy?');
    expect(html).toContain('<h2 id="question">Question</h2>');
    expect(toc).toEqual([{ level: 2, id: 'question', text: 'Question' }]);
    expect(meta).toEqual([]);
  });

  it('builds the research page TOC and meta-row from the pipeline result', () => {
    const item: ResearchItem = {
      id: 'cache-notes',
      path: 'iris/research/cache-notes/index.md',
      title: 'Cache notes',
      status: 'active',
      tags: ['cache'],
      agent: 'claude-code',
      updated: '2026-08-21',
      body: '## Question\n\nWhy?\n\n## Findings\n\nBecause.',
      warnings: [],
    };
    const html = researchDocumentContent(item);
    expect(html).toContain('aria-label="On this page"');
    expect(html).toContain('href="#question"');
    expect(html).toContain('href="#findings"');
    expect(html).toContain('doc-meta');
  });

  it('builds the project doc TOC and meta-row from the pipeline result', () => {
    const item: ProjectDocItem = {
      name: 'overview',
      path: 'iris/project/overview.md',
      title: 'Overview',
      status: 'active',
      agent: 'claude-code',
      updated: '2026-08-21',
      body: '## Scope\n\nWhat.\n\n## Audience\n\nWho.',
      warnings: [],
    };
    const html = projectDocContent(item, ['overview', 'hld']);
    expect(html).toContain('aria-label="On this page"');
    expect(html).toContain('href="#scope"');
    expect(html).toContain('href="#audience"');
    expect(html).toContain('doc-meta');
  });
});
