import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SUPPORTED_NODE_VERSION, assertSupportedNode } from '../src/lib/runtime.js';

const repoRoot = path.resolve(import.meta.dirname, '..');

describe('supported Node.js floor', () => {
  it('matches the engines range the package declares', async () => {
    const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
    expect(packageJson.engines.node).toBe(`>=${SUPPORTED_NODE_VERSION}`);
  });

  it.each(['20.19.0', '22.0.0', '22.9.0', '22.12.9'])('rejects %s', (version) => {
    const message = assertSupportedNode(version);
    expect(message).toContain(version);
    expect(message).toContain(SUPPORTED_NODE_VERSION);
    expect(message).toContain('Install a supported Node.js release');
    expect(message?.split('\n')).toHaveLength(1);
  });

  it.each([SUPPORTED_NODE_VERSION, '22.14.0', '23.0.0', '24.4.1'])('accepts %s', (version) => {
    expect(assertSupportedNode(version)).toBeNull();
  });

  it('reports a version it cannot parse instead of assuming it is supported', () => {
    expect(assertSupportedNode('not-a-version')).toContain('not-a-version');
  });
});
