import { describe, expect, it } from 'vitest';
import { HELP_TEXT, runCli } from '../src/cli.js';

describe('cli help', () => {
  it('lists all commands', () => {
    expect(HELP_TEXT).toContain('init');
    expect(HELP_TEXT).toContain('render');
    expect(HELP_TEXT).toContain('update');
    expect(HELP_TEXT).not.toContain('  - adopt');
    expect(HELP_TEXT).not.toContain('  - sync');
  });

  it('rejects retired product lifecycle commands', async () => {
    expect(await runCli(['adopt'])).toBe(1);
    expect(await runCli(['sync'])).toBe(1);
  });
});
