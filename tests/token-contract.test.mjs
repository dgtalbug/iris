import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { validateTokenContract } from '../scripts/token-contract.mjs';

const designSource = await readFile(new URL('../src/templates/tokens.ts', import.meta.url), 'utf8');
const tokenCss = designSource.match(/export const TOKENS_CSS = `([\s\S]*?)`;/)?.[1];

describe('Aperture token contract', () => {
  it('accepts the shipped dark and light themes', () => {
    expect(tokenCss).toBeDefined();
    expect(validateTokenContract(tokenCss ?? '')).toEqual([]);
  });

  it('rejects a low-contrast text pair', () => {
    const invalid = (tokenCss ?? '').replace('--accent-text: #8fb6ff;', '--accent-text: #26303f;');
    expect(
      validateTokenContract(invalid).some((error) =>
        error.startsWith('dark contrast --accent-text on --bg is '),
      ),
    ).toBe(true);
  });

  it('rejects a control boundary below the non-text threshold', () => {
    const invalid = (tokenCss ?? '').replace('--accent: #4d8dff;', '--accent: #1b2430;');
    expect(
      validateTokenContract(invalid).some((error) =>
        error.startsWith('dark control boundary --accent on --surface-1 is '),
      ),
    ).toBe(true);
  });

  it('rejects a border below the visibility floor and names that threshold', () => {
    const invalid = (tokenCss ?? '').replace('--line-1: #3a4757;', '--line-1: #151c26;');
    const errors = validateTokenContract(invalid);
    const border = errors.find((error) =>
      error.startsWith('dark border visibility floor --line-1 on --surface-1 is '),
    );
    expect(border).toBeDefined();
    // A 1.45 floor is a project decision, not a WCAG result; the message must not
    // read as though it were one.
    expect(border).not.toContain('contrast');
  });

  it('rejects missing and undeclared tokens', () => {
    const invalid = (tokenCss ?? '').replace('  --radius-full: 999px;\n', '');
    expect(validateTokenContract(invalid, 'border-radius: var(--radius-full);')).toEqual(
      expect.arrayContaining([
        'missing dark token --radius-full',
        'undeclared token reference --radius-full',
      ]),
    );
  });
});
