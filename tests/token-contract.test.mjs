import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  parseColor,
  parseTokenThemes,
  validateTokenContract,
} from '../scripts/token-contract.mjs';

const designSource = await readFile(new URL('../src/templates/tokens.ts', import.meta.url), 'utf8');
const tokenCss = designSource.match(/export const TOKENS_CSS = `([\s\S]*?)`;/)?.[1];

describe('Electric token contract', () => {
  it('accepts the shipped dark and light themes', () => {
    expect(tokenCss).toBeDefined();
    expect(validateTokenContract(tokenCss ?? '')).toEqual([]);
  });

  it('rejects a low-contrast text pair', () => {
    const invalid = (tokenCss ?? '').replace(
      '  --muted: oklch(0.65 0.02 285);',
      '  --muted: oklch(0.25 0.02 285);',
    );
    expect(
      validateTokenContract(invalid).some((error) =>
        error.startsWith('dark contrast --muted on --background is '),
      ),
    ).toBe(true);
  });

  it('rejects a control boundary below the non-text threshold', () => {
    const invalid = (tokenCss ?? '').replace(
      '  --primary: oklch(0.65 0.25 293);',
      '  --primary: oklch(0.22 0.03 285);',
    );
    expect(
      validateTokenContract(invalid).some((error) =>
        error.startsWith('dark control boundary --primary on --card is '),
      ),
    ).toBe(true);
  });

  it('rejects a border below the visibility floor and names that threshold', () => {
    const invalid = (tokenCss ?? '').replace(
      '  --border: oklch(0.355 0.03 285);',
      '  --border: oklch(0.2 0.03 285);',
    );
    const errors = validateTokenContract(invalid);
    const border = errors.find((error) =>
      error.startsWith('dark border visibility floor --border on --card is '),
    );
    expect(border).toBeDefined();
    // A 1.45 floor is a project decision, not a WCAG result; the message must not
    // read as though it were one.
    expect(border).not.toContain('contrast');
  });

  it('rejects missing and undeclared tokens', () => {
    const invalid = (tokenCss ?? '').replace('  --radius-pill: 999px;\n', '');
    expect(validateTokenContract(invalid, 'border-radius: var(--radius-pill);')).toEqual(
      expect.arrayContaining([
        'missing dark token --radius-pill',
        'undeclared token reference --radius-pill',
      ]),
    );
  });

  it('rejects a light theme that drops a required override', () => {
    const invalid = (tokenCss ?? '').replace('  --card: oklch(1 0 0);\n', '');
    expect(validateTokenContract(invalid)).toEqual(
      expect.arrayContaining(['missing light override --card']),
    );
  });
});

describe('color parsing', () => {
  it('parses oklch and hex to the same luminance scale', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 2);
    expect(contrastRatio('oklch(1 0 0)', '#000000')).toBeCloseTo(21, 2);
  });

  it('maps an out-of-gamut oklch color into sRGB by reducing chroma', () => {
    // The shipped dark --primary is outside sRGB; browsers render the
    // chroma-reduced color, so the validator must measure that one.
    const mapped = parseColor('oklch(0.65 0.25 293)');
    expect(mapped).toBeDefined();
    expect(mapped.channels.every((channel) => channel >= 0 && channel <= 1)).toBe(true);
    expect(contrastRatio('oklch(0.65 0.25 293)', '#000000')).toBeCloseTo(5.99, 1);
  });

  it('resolves var() aliases within a theme', () => {
    const { dark } = parseTokenThemes(tokenCss ?? '');
    expect(dark['type-report']).toBe('var(--accent-1)');
    expect(contrastRatio('var(--type-report)', 'var(--card)', dark)).toBe(
      contrastRatio(dark['accent-1'], dark.card, dark),
    );
  });

  it('refuses to measure against a non-opaque background', () => {
    expect(parseColor('oklch(0.15 0.02 285 / 0.5)').opaque).toBe(false);
    expect(contrastRatio('#ffffff', 'oklch(0.15 0.02 285 / 0.5)')).toBeUndefined();
    expect(contrastRatio('#ffffff', '#0b101780')).toBeUndefined();
  });

  it('reports a pair it cannot measure rather than skipping it', () => {
    const invalid = (tokenCss ?? '').replace(
      '  --card: oklch(0.19 0.025 285);',
      '  --card: oklch(0.19 0.025 285 / 0.6);',
    );
    expect(validateTokenContract(invalid)).toEqual(
      expect.arrayContaining([
        'dark contrast pair --foreground/--card is not an opaque color',
      ]),
    );
  });
});
