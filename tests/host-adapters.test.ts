import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { IrisError } from '../src/lib/errors.js';
import {
  commandFileName,
  detectHosts,
  HOST_ADAPTERS,
  resolveAdapter,
} from '../src/lib/host-adapters.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'iris-hosts-'));
  tempDirs.push(cwd);
  return cwd;
}

function detectedIds(cwd: string): string[] {
  return detectHosts(cwd).map((adapter) => adapter.id);
}

describe('host adapter table', () => {
  it('ships exactly the six wave-1 adapters in stable order', () => {
    expect(HOST_ADAPTERS.map((adapter) => adapter.id)).toEqual([
      'claude',
      'agents',
      'github',
      'cursor',
      'gemini',
      'codex',
    ]);
  });

  it('gives every adapter a skills target and consistent command fields', () => {
    for (const adapter of HOST_ADAPTERS) {
      expect(adapter.detect.length).toBeGreaterThan(0);
      expect(adapter.skillsDir).not.toBeNull();
      expect(adapter.commandsDir === null).toBe(adapter.commandFileFormat === null);
    }
    const skillsOnly = HOST_ADAPTERS.filter((adapter) => adapter.commandsDir === null).map(
      (adapter) => adapter.id,
    );
    expect(skillsOnly).toEqual(['agents', 'gemini', 'codex']);
  });
});

describe('detectHosts', () => {
  it('detects nothing in an empty project', async () => {
    expect(detectedIds(await tempProject())).toEqual([]);
  });

  it('detects claude from the .claude directory', async () => {
    const cwd = await tempProject();
    await mkdir(path.join(cwd, '.claude'));
    expect(detectedIds(cwd)).toEqual(['claude']);
  });

  it('detects the shared agents host from .agents/skills', async () => {
    const cwd = await tempProject();
    await mkdir(path.join(cwd, '.agents', 'skills'), { recursive: true });
    expect(detectedIds(cwd)).toEqual(['agents']);
  });

  it('detects github from any one of its signals', async () => {
    const bySkills = await tempProject();
    await mkdir(path.join(bySkills, '.github', 'skills'), { recursive: true });
    expect(detectedIds(bySkills)).toEqual(['github']);

    const byInstructions = await tempProject();
    await mkdir(path.join(byInstructions, '.github'));
    await writeFile(path.join(byInstructions, '.github', 'copilot-instructions.md'), '');
    expect(detectedIds(byInstructions)).toEqual(['github']);
  });

  it('detects cursor and gemini from their directories', async () => {
    const cwd = await tempProject();
    await mkdir(path.join(cwd, '.cursor'));
    await mkdir(path.join(cwd, '.gemini'));
    expect(detectedIds(cwd)).toEqual(['cursor', 'gemini']);
  });

  it('detects codex from .codex or AGENTS.md', async () => {
    const byDir = await tempProject();
    await mkdir(path.join(byDir, '.codex'));
    expect(detectedIds(byDir)).toEqual(['codex']);

    const byFile = await tempProject();
    await writeFile(path.join(byFile, 'AGENTS.md'), '# Agents\n');
    expect(detectedIds(byFile)).toEqual(['codex']);
  });

  it('reports multiple hosts in table order', async () => {
    const cwd = await tempProject();
    await mkdir(path.join(cwd, '.cursor'));
    await mkdir(path.join(cwd, '.claude'));
    await writeFile(path.join(cwd, 'AGENTS.md'), '# Agents\n');
    expect(detectedIds(cwd)).toEqual(['claude', 'cursor', 'codex']);
  });
});

describe('resolveAdapter', () => {
  it('returns the adapter for a known id', () => {
    expect(resolveAdapter('cursor').id).toBe('cursor');
    expect(resolveAdapter('codex').skillsDir).toBe('.agents/skills');
  });

  it('throws with the valid id list on an unknown id', () => {
    let thrown: unknown;
    try {
      resolveAdapter('vscode');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(IrisError);
    const message = (thrown as Error).message;
    expect(message).toContain('vscode');
    for (const id of ['claude', 'agents', 'github', 'cursor', 'gemini', 'codex']) {
      expect(message).toContain(id);
    }
  });
});

describe('commandFileName', () => {
  it('expands the action placeholder per host format', () => {
    expect(commandFileName(resolveAdapter('claude'), 'research')).toBe('research.md');
    expect(commandFileName(resolveAdapter('github'), 'research')).toBe('iris-research.prompt.md');
    expect(commandFileName(resolveAdapter('cursor'), 'research')).toBe('iris-research.md');
  });

  it('returns null for skills-only hosts', () => {
    expect(commandFileName(resolveAdapter('agents'), 'research')).toBeNull();
    expect(commandFileName(resolveAdapter('gemini'), 'research')).toBeNull();
    expect(commandFileName(resolveAdapter('codex'), 'research')).toBeNull();
  });
});
