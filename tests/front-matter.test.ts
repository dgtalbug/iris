import { describe, expect, it } from 'vitest';
import { parseFrontMatter } from '../src/lib/front-matter.js';

describe('research front matter', () => {
  it('parses scalars, inline lists, and block lists', () => {
    const result = parseFrontMatter(
      [
        '---',
        'title: "Why the cache stampedes"',
        'status: active',
        'agent: claude-code',
        'updated: 2026-08-21T09:00:00.000Z',
        'tags: [cache, performance]',
        '---',
        '',
        '# Body heading',
      ].join('\n'),
    );

    expect(result.data).toEqual({
      title: 'Why the cache stampedes',
      status: 'active',
      agent: 'claude-code',
      updated: '2026-08-21',
      tags: ['cache', 'performance'],
    });
    expect(result.body).toBe('# Body heading');
    expect(result.warnings).toEqual([]);
  });

  it('reads a block list and ignores unsupported keys', () => {
    const result = parseFrontMatter(
      ['---', 'tags:', '  - alpha', '  - beta', 'unknown: value', '---', 'body'].join('\n'),
    );
    expect(result.data.tags).toEqual(['alpha', 'beta']);
    expect(result.warnings).toEqual([]);
    expect(result.body).toBe('body');
  });

  it('keeps the whole file as content when there is no front matter', () => {
    const result = parseFrontMatter('# Just markdown\n\ntext');
    expect(result.data.title).toBeNull();
    expect(result.data.status).toBeNull();
    expect(result.body).toBe('# Just markdown\n\ntext');
  });

  it('warns and falls back for unsupported values instead of guessing', () => {
    const result = parseFrontMatter(
      ['---', 'status: blocked', 'updated: soon', 'title: [a, b]', '- orphan', '---', 'body'].join(
        '\n',
      ),
    );
    expect(result.data.status).toBeNull();
    expect(result.data.updated).toBeNull();
    expect(result.data.title).toBeNull();
    expect(result.warnings.join(' ')).toContain('not one of');
    expect(result.warnings.join(' ')).toContain('is not an ISO date');
    expect(result.body).toBe('body');
  });

  it('reports an unterminated block without dropping content', () => {
    const result = parseFrontMatter('---\ntitle: Open\n\n# Heading');
    expect(result.warnings[0]).toContain('not closed');
    expect(result.body).toContain('# Heading');
  });

  it('bounds tag count and length', () => {
    const tags = Array.from({ length: 30 }, (_, index) => `tag-${index}`).join(', ');
    const result = parseFrontMatter(`---\ntags: [${tags}, ${'x'.repeat(200)}]\n---\nbody`);
    expect(result.data.tags).toHaveLength(20);
    for (const tag of result.data.tags) expect(tag.length).toBeLessThanOrEqual(80);
    expect(result.warnings.join(' ')).toContain('more than 20 tags');
  });
});
