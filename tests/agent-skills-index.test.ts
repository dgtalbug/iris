import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AGENT_SKILL_TARGETS,
  installAgentSurfaces,
  loadSurfaceDescriptors,
} from '../src/lib/agent-skills.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-skills-index-'));
  tempDirs.push(cwd);
  return cwd;
}

function managedBody(content: string): string {
  const start = content.indexOf('-->\n', content.indexOf('IRIS:MANAGED:START'));
  const end = content.indexOf('<!-- IRIS:MANAGED:END');
  return content.slice(start + 4, end);
}

describe('index-aware iris-workspace skill', () => {
  it('includes the index section in the source template', async () => {
    const root = path.dirname(new URL(import.meta.url).pathname);
    const skill = await readFile(
      path.join(root, '..', 'templates', 'agents', 'iris-workspace', 'SKILL.md'),
      'utf8',
    );
    expect(skill).toContain('## When the index is enabled');
    expect(skill).toContain('gitnexus_impact');
    expect(skill).toContain('gitnexus impact');
    expect(skill).toContain('gitnexus_query');
    expect(skill).toContain('gitnexus query');
  });

  it('renders the index section for every host that receives the flagship skill', async () => {
    const cwd = await tempProject();
    await installAgentSurfaces(cwd);
    const descriptors = await loadSurfaceDescriptors();
    const skillPaths = descriptors
      .filter((descriptor) => descriptor.templateId === 'iris-workspace' && descriptor.relativePath.endsWith('/SKILL.md'))
      .map((descriptor) => descriptor.relativePath);

    expect(skillPaths.length).toBeGreaterThan(0);
    for (const relativePath of skillPaths) {
      const content = await readFile(path.join(cwd, relativePath), 'utf8');
      const body = managedBody(content);
      expect(body, relativePath).toContain('## When the index is enabled');
      expect(body, relativePath).toContain('gitnexus_impact');
      expect(body, relativePath).toContain('gitnexus impact');
    }

    for (const target of AGENT_SKILL_TARGETS) {
      const content = await readFile(path.join(cwd, target), 'utf8');
      expect(content, target).toContain('## When the index is enabled');
    }
  });
});
