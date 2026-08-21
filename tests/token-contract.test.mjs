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
    const invalid = (tokenCss ?? '').replace('--accent-text: #a8bcff;', '--accent-text: #26314f;');
    expect(
      validateTokenContract(invalid).some((error) =>
        error.startsWith('dark contrast --accent-text on --bg is '),
      ),
    ).toBe(true);
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
