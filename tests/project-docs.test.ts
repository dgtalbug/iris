import { describe, expect, it } from 'vitest';
import { projectDocSkeleton } from '../src/lib/project-docs.js';
import { PROJECT_DOC_NAMES } from '../src/templates/common.js';

describe('project doc skeletons', () => {
  it('ships a front-mattered skeleton for every project doc', async () => {
    for (const name of PROJECT_DOC_NAMES) {
      const skeleton = await projectDocSkeleton(name, 'demo-app');
      expect(skeleton.startsWith('---\n'), name).toBe(true);
      expect(skeleton, name).toContain('status: draft');
      expect(skeleton, name).toContain('demo-app');
      expect(skeleton, name).not.toContain('__PROJECT__');
    }
  });

  it('carries the expected Mermaid diagram type per design doc', async () => {
    const hld = await projectDocSkeleton('hld', 'demo-app');
    expect(hld).toMatch(/```mermaid\nflowchart LR/);
    expect(hld).toContain('classDef focus');
    expect(hld).toContain('## System map');
    expect(await projectDocSkeleton('lld', 'demo-app')).toMatch(/```mermaid\nsequenceDiagram/);
    expect(await projectDocSkeleton('erd', 'demo-app')).toMatch(/```mermaid\nerDiagram/);
    expect(await projectDocSkeleton('overview', 'demo-app')).not.toContain('```mermaid');
    expect(await projectDocSkeleton('decisions', 'demo-app')).toMatch(
      /\| Date\s+\| Decision\s+\| Why\s+\| Status\s+\|/,
    );
  });

  it('keeps a quote in the project name from breaking a Mermaid label', async () => {
    const skeleton = await projectDocSkeleton('hld', 'my "quoted" app');
    expect(skeleton).toContain(`app["my 'quoted' app"]`);
  });
});
