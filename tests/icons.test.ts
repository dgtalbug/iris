import { describe, expect, it } from 'vitest';
import { ICON_KEYS, icon, typeIcon, type IconName } from '../src/templates/icons.js';
import { WORK_TYPES } from '../src/templates/common.js';

describe('generated Lucide icons', () => {
  it('renders every mapped icon as inline SVG', () => {
    expect(ICON_KEYS.length).toBeGreaterThan(20);
    for (const name of ICON_KEYS) {
      const markup = icon(name);
      expect(markup, name).toMatch(/^<svg /);
      expect(markup, name).toContain('viewBox="0 0 24 24"');
      expect(markup, name).toContain('class="lucide lucide-');
      expect(markup, name).toContain('stroke="currentColor"');
      expect(markup, name).toMatch(/<\/svg>$/);
    }
  });

  it('carries no script, no external reference, and no color literal', () => {
    for (const name of ICON_KEYS) {
      const markup = icon(name);
      expect(markup, name).not.toContain('<script');
      expect(markup, name).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
      expect(markup, name).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(markup, name).not.toMatch(/\b(?:rgb|hsl|oklch)a?\(/);
    }
  });

  it('hides decorative icons and labels meaningful ones', () => {
    expect(icon('brand')).toContain('aria-hidden="true"');
    expect(icon('brand')).not.toContain('role="img"');
    const labelled = icon('type-bug', { label: 'bug page' });
    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('aria-label="bug page"');
    expect(labelled).not.toContain('aria-hidden');
  });

  it('applies semantic color classes without touching the base class', () => {
    expect(icon('type-plan', { class: 'ic-2' })).toContain('class="lucide lucide-route ic-2"');
  });

  it('escapes a label that contains markup characters', () => {
    expect(icon('doc', { label: 'a "quoted" <tag> & more' })).toContain(
      'aria-label="a &quot;quoted&quot; &lt;tag&gt; &amp; more"',
    );
  });

  it('throws on an unknown icon name instead of emitting a gap', () => {
    expect(() => icon('not-an-icon' as IconName)).toThrow(/Unknown iris icon/);
  });

  it('gives every work type its own icon and falls back for unknown types', () => {
    for (const type of WORK_TYPES) {
      expect(typeIcon(type), type).toMatch(/^<svg /);
    }
    expect(typeIcon('mystery')).toContain('lucide-file-text');
  });
});
