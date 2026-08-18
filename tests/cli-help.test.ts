import { describe, expect, it } from 'vitest';
import { HELP_TEXT } from '../src/cli.js';

describe('cli help', () => {
  it('lists all commands', () => {
    expect(HELP_TEXT).toContain('init');
    expect(HELP_TEXT).toContain('render');
    expect(HELP_TEXT).toContain('update');
  });
});
