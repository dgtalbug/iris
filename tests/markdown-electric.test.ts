import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import {
  parseContainerOpen,
  parseContainerParams,
  parseFiletreeLine,
  parseFlowLine,
  parseMeterParams,
  parseTimelineItem,
  registerElectric,
} from '../src/lib/markdown-electric.js';
import {
  BLUEPRINT_SECTIONS,
  renderElectricMarkdown,
  renderSafeMarkdown,
} from '../src/lib/markdown.js';

describe('container tokenizer', () => {
  it('parses opening fences with and without a space', () => {
    expect(parseContainerOpen('::: callout info')).toEqual({ name: 'callout', params: 'info' });
    expect(parseContainerOpen(':::evidence src=a.ts:1')).toEqual({
      name: 'evidence',
      params: 'src=a.ts:1',
    });
    expect(parseContainerOpen('::: steps')).toEqual({ name: 'steps', params: '' });
  });

  it('rejects unknown names, closers, and non-fences', () => {
    expect(parseContainerOpen('::: unknown thing')).toBeNull();
    expect(parseContainerOpen(':::')).toBeNull();
    expect(parseContainerOpen('::: ')).toBeNull();
    expect(parseContainerOpen('::::')).toBeNull();
    expect(parseContainerOpen('ordinary text')).toBeNull();
  });

  it('parses key=value params with optional quoting', () => {
    expect(parseContainerParams('src=path/file.ts:42')).toEqual({ src: 'path/file.ts:42' });
    expect(parseContainerParams('label="Coverage report" value=72 tone=success')).toEqual({
      label: 'Coverage report',
      value: '72',
      tone: 'success',
    });
  });

  it('parses timeline items with optional tone markers', () => {
    expect(parseTimelineItem('- 2026-08 :: Shipped v0.4')).toEqual({
      when: '2026-08',
      what: 'Shipped v0.4',
      tone: null,
    });
    expect(parseTimelineItem('- 2026-09 !warn :: Found a regression')).toEqual({
      when: '2026-09',
      what: 'Found a regression',
      tone: 'warn',
    });
    expect(parseTimelineItem('not a list line')).toBeNull();
  });

  it('parses filetree lines into dir, file, hot, and note kinds', () => {
    expect(parseFiletreeLine('src/')).toEqual({ kind: 'dir', indent: 0, text: 'src/' });
    expect(parseFiletreeLine('  index.ts')).toEqual({ kind: 'file', indent: 2, text: 'index.ts' });
    expect(parseFiletreeLine('  markdown.ts *')).toEqual({
      kind: 'hot',
      indent: 2,
      text: 'markdown.ts',
    });
    expect(parseFiletreeLine('# core layer')).toEqual({
      kind: 'note',
      indent: 0,
      text: 'core layer',
    });
    expect(parseFiletreeLine('   ')).toBeNull();
  });

  it('parses flow chains with optional node tones', () => {
    expect(parseFlowLine('parse -> compile -> render')).toEqual([
      { label: 'parse', tone: null },
      { label: 'compile', tone: null },
      { label: 'render', tone: null },
    ]);
    expect(parseFlowLine('input !primary -> fail !danger -> queue !3')).toEqual([
      { label: 'input', tone: 'primary' },
      { label: 'fail', tone: 'danger' },
      { label: 'queue', tone: '3' },
    ]);
  });

  it('parses meter params and clamps values into range', () => {
    expect(parseMeterParams('label=Coverage value=72 tone=success')).toEqual({
      label: 'Coverage',
      value: 72,
      tone: 'success',
    });
    expect(parseMeterParams('label=Effort value=140')).toEqual({
      label: 'Effort',
      value: 100,
      tone: 'primary',
    });
    expect(parseMeterParams('value=abc')).toEqual({ label: 'Meter', value: 0, tone: 'primary' });
  });
});

describe('electric containers', () => {
  it('compiles callouts to token classes with the mapped Lucide icon', () => {
    const html = renderSafeMarkdown('::: callout warn\nWatch the blast radius.\n:::');
    expect(html).toContain('<div class="callout c-warn">');
    expect(html).toContain('lucide-alert-triangle');
    expect(html).toContain('<strong class="label">Warning</strong>');
    expect(html).toContain('<p>Watch the blast radius.</p>');
  });

  it('supports custom callout labels and every tone', () => {
    const html = renderSafeMarkdown('::: callout danger Blast radius\nEverything burns.\n:::');
    expect(html).toContain('<div class="callout c-danger">');
    expect(html).toContain('lucide-alert-octagon');
    expect(html).toContain('<strong class="label">Blast radius</strong>');
    for (const tone of ['info', 'warn', 'success', 'danger'] as const) {
      expect(renderSafeMarkdown(`::: callout ${tone}\nx\n:::`)).toContain(`callout c-${tone}`);
    }
  });

  it('compiles evidence with a monospace source line', () => {
    const html = renderSafeMarkdown(
      '::: evidence src=src/lib/markdown.ts:42\nThe pipeline escapes HTML.\n:::',
    );
    expect(html).toContain('<div class="evidence">');
    expect(html).toContain('<div class="src"');
    expect(html).toContain('src/lib/markdown.ts:42');
    expect(html).toContain('<p>The pipeline escapes HTML.</p>');
  });

  it('compiles steps containers to a single .steps list', () => {
    const html = renderSafeMarkdown('::: steps\n1. Parse the source.\n2. Emit the page.\n:::');
    expect(html).toContain('<ol class="steps">');
    expect(html).toContain('<li>Parse the source.</li>');
    expect(html).toContain('<li>Emit the page.</li>');
  });

  it('compiles timelines with when/what spans and tone classes', () => {
    const html = renderSafeMarkdown(
      '::: timeline\n- 2026-08 :: Shipped the renderer\n- 2026-09 !danger :: Broke the build\n:::',
    );
    expect(html).toContain('<ul class="timeline">');
    expect(html).toContain('<span class="when">2026-08</span>');
    expect(html).toContain('<span class="what">Shipped the renderer</span>');
    expect(html).toContain('<li class="danger">');
  });

  it('compiles filetrees with dir, file, hot, and note lines', () => {
    const html = renderSafeMarkdown(
      '::: filetree\nsrc/\n  lib/\n    markdown.ts *\n  index.ts\n# the layer under test\n:::',
    );
    expect(html).toContain('<div class="filetree">');
    expect(html).toContain('<div class="dir">src/</div>');
    expect(html).toContain('<div class="hot">&nbsp;&nbsp;&nbsp;&nbsp;markdown.ts</div>');
    expect(html).toContain('<div class="file">&nbsp;&nbsp;index.ts</div>');
    expect(html).toContain('<div class="note">the layer under test</div>');
  });

  it('compiles flows to node and edge strips', () => {
    const html = renderSafeMarkdown('::: flow\nparse -> compile !primary -> fail !danger\n:::');
    expect(html).toContain('<div class="flow">');
    expect(html).toContain('<span class="node">parse</span>');
    expect(html).toContain('<span class="node n-primary">compile</span>');
    expect(html).toContain('<span class="node n-danger">fail</span>');
    expect(html.match(/<span class="edge"><\/span>/g)).toHaveLength(2);
  });

  it('compiles details containers to collapsible ds markup', () => {
    const html = renderSafeMarkdown('::: details Raw dump\nFull command output.\n:::');
    expect(html).toContain('<details class="ds"><summary>Raw dump</summary><div class="body">');
    expect(html).toContain('<p>Full command output.</p>');
    expect(html).toContain('</div></details>');
  });

  it('compiles meters with tone classes and an accessible label', () => {
    const html = renderSafeMarkdown('::: meter label=Coverage value=72 tone=success\n:::');
    expect(html).toContain('<div class="meter m-success" role="img" aria-label="Coverage: 72%">');
    expect(html).toContain('<span class="val">72%</span>');
    expect(html).toContain('<div class="fill" style="width: 72%"></div>');
  });

  it('leaves unknown or unclosed containers as plain paragraphs', () => {
    expect(renderSafeMarkdown('::: note\nhello\n:::')).toContain(':::');
    expect(renderSafeMarkdown('::: callout info\nnever closed')).toContain('::: callout info');
  });

  it('escapes authored HTML inside container bodies and params', () => {
    const html = renderSafeMarkdown(
      '::: callout info <script>alert(1)</script>\n<img src=x onerror=alert(1)>\n:::',
    );
    expect(html).not.toMatch(/<(?:script|img)\b/);
    expect(html).toContain('&lt;script&gt;');
  });

  it('is deterministic', () => {
    const source =
      '::: callout success\nDone.\n:::\n\n::: flow\na -> b\n:::\n\n::: meter label=Risk value=20 tone=danger\n:::';
    expect(renderSafeMarkdown(source)).toBe(renderSafeMarkdown(source));
  });
});

describe('footnotes', () => {
  it('resolves references into sup.fn markers and a .footnotes list', () => {
    const html = renderSafeMarkdown(
      'The claim.[^1] Another cite.[^2]\n\n[^1]: src/lib/markdown.ts:1 — renderer entry.\n[^2]: src/cli.ts:9 — CLI entry.',
    );
    expect(html).toContain('<sup class="fn"><a href="#fn-1" id="fnref-1">1</a></sup>');
    expect(html).toContain('<sup class="fn"><a href="#fn-2" id="fnref-2">2</a></sup>');
    expect(html).toContain('<ol class="footnotes">');
    expect(html).toContain('<li id="fn-1">src/lib/markdown.ts:1 — renderer entry.');
    expect(html).toContain('<li id="fn-2">src/cli.ts:9 — CLI entry.');
    expect(html).toContain('href="#fnref-1"');
    expect(html).not.toContain('[^1]:');
  });

  it('numbers repeated references once, in first-use order', () => {
    const html = renderSafeMarkdown('First.[^b] Second.[^a] Again.[^b]\n\n[^a]: A.\n[^b]: B.');
    expect(html).toContain('id="fnref-b">1</a>');
    expect(html).toContain('id="fnref-a">2</a>');
    expect(html.match(/<li id="fn-/g)).toHaveLength(2);
  });

  it('renders unresolved references as literal text', () => {
    const html = renderSafeMarkdown('Missing cite.[^ghost]');
    expect(html).toContain('[^ghost]');
    expect(html).not.toContain('<sup class="fn">');
    expect(html).not.toContain('class="footnotes"');
  });
});

describe('confidence badges', () => {
  it('compiles list-item markers to badge chips with tone classes', () => {
    const html = renderSafeMarkdown(
      '- **[HIGH]** Verified finding.\n- **[MED]** Likely finding.\n- **[LOW]** Speculative finding.',
    );
    expect(html).toContain('<span class="badge confidence b-success">HIGH</span>');
    expect(html).toContain('<span class="badge confidence b-warning">MED</span>');
    expect(html).toContain('<span class="badge confidence b-danger">LOW</span>');
    expect(html).not.toContain('<strong>[HIGH]</strong>');
    expect(html).toContain(
      '<li><span class="badge confidence b-success">HIGH</span> Verified finding.</li>',
    );
  });

  it('leaves non-list and mid-line markers untouched', () => {
    const html = renderSafeMarkdown('A paragraph with **[HIGH]** inline stays strong.');
    expect(html).toContain('<strong>[HIGH]</strong>');
  });
});

describe('blueprint sections', () => {
  it('declares the ten fixed sections in canonical order', () => {
    expect(BLUEPRINT_SECTIONS.map((section) => section.id)).toEqual([
      'tldr',
      'question',
      'map',
      'territory',
      'findings',
      'numbers',
      'paths',
      'risks',
      'proposal',
      'appendix',
    ]);
  });

  it('maps the ten fixed headings to stable section ids', () => {
    const source = BLUEPRINT_SECTIONS.map((section) => `## ${section.title}\n\nContent.`).join(
      '\n\n',
    );
    const { html, toc, meta } = renderElectricMarkdown(source);
    for (const section of BLUEPRINT_SECTIONS) {
      expect(html).toContain(`<h2 class="section" id="${section.id}">`);
    }
    expect(toc).toHaveLength(10);
    expect(toc[0]).toEqual({ level: 2, id: 'tldr', text: 'TL;DR' });
    expect(toc.map((entry) => entry.id)).toEqual(BLUEPRINT_SECTIONS.map((section) => section.id));
    expect(meta).toContainEqual({ label: 'sections', value: '10' });
  });

  it('accepts the longer upstream titles as aliases', () => {
    const { html, toc } = renderElectricMarkdown(
      '## Research question & scope\n\nThe question.\n\n## Metrics & measurements\n\nThe numbers.',
    );
    expect(html).toContain('id="question"');
    expect(html).toContain('id="numbers"');
    expect(toc).toEqual([
      { level: 2, id: 'question', text: 'Question & scope' },
      { level: 2, id: 'numbers', text: 'Metrics' },
    ]);
  });

  it('omits empty sections from the page and the table of contents', () => {
    const source =
      '## TL;DR\n\n- **[HIGH]** Found it.\n\n## Risks\n\n## Appendix\n\n[^1]: a.ts:1\n\nCited.[^1]';
    const { html, toc, sections } = renderElectricMarkdown(source);
    expect(html).toContain('id="tldr"');
    expect(html).not.toContain('id="risks"');
    expect(html).toContain('id="appendix"');
    expect(toc.map((entry) => entry.id)).toEqual(['tldr', 'appendix']);
    expect(sections).toEqual(['tldr', 'appendix']);
  });

  it('keeps non-blueprint headings with slug ids out of the blueprint TOC', () => {
    const { html, toc, headings } = renderElectricMarkdown(
      '## TL;DR\n\nShort.\n\n## Methodology notes\n\nLonger.',
    );
    expect(html).toContain('id="tldr"');
    expect(html).toContain('id="methodology-notes"');
    expect(toc.map((entry) => entry.id)).toEqual(['tldr']);
    expect(headings.map((heading) => heading.id)).toEqual(['tldr', 'methodology-notes']);
  });

  it('prefixes section and footnote ids when idPrefix is set', () => {
    const { html, toc } = renderElectricMarkdown('## TL;DR\n\nCited.[^1]\n\n[^1]: a.ts:1', {
      idPrefix: 'doc',
    });
    expect(html).toContain('id="doc-tldr"');
    expect(html).toContain('href="#doc-fn-1" id="doc-fnref-1"');
    expect(html).toContain('<li id="doc-fn-1">');
    expect(toc).toEqual([{ level: 2, id: 'doc-tldr', text: 'TL;DR' }]);
  });

  it('derives meta-row data from the rendered document', () => {
    const source = [
      '## TL;DR',
      '',
      '- **[HIGH]** A verified headline finding with several words.',
      '',
      '## Findings',
      '',
      '::: evidence src=a.ts:1',
      'Proof lives here.',
      ':::',
      '',
      'Cited.[^1]',
      '',
      '[^1]: a.ts:1',
    ].join('\n');
    const { meta } = renderElectricMarkdown(source);
    expect(meta).toContainEqual({ label: 'sections', value: '2' });
    expect(meta).toContainEqual({ label: 'reading', value: '1 min' });
    expect(meta).toContainEqual({ label: 'components', value: '1' });
    expect(meta).toContainEqual({ label: 'footnotes', value: '1' });
    const words = meta.find((entry) => entry.label === 'words');
    expect(Number(words?.value)).toBeGreaterThan(0);
  });

  it('renders an empty document without blueprint artifacts', () => {
    const { html, toc, meta, sections } = renderElectricMarkdown('');
    expect(html).toBe('');
    expect(toc).toEqual([]);
    expect(meta).toEqual([]);
    expect(sections).toEqual([]);
  });
});

describe('token discipline', () => {
  it('emits no color literals or color functions anywhere in the output', () => {
    const source = [
      '## TL;DR',
      '',
      '- **[LOW]** A guess.',
      '',
      '## Findings',
      '',
      '::: callout danger',
      'Broken.',
      ':::',
      '',
      '::: evidence src=a.ts:9',
      'See the code.',
      ':::',
      '',
      '::: meter label=Risk value=30 tone=danger',
      ':::',
      '',
      '::: flow',
      'a !1 -> b !danger',
      ':::',
      '',
      '::: timeline',
      '- now !warn :: mid flight',
      ':::',
      '',
      'Cited.[^1]',
      '',
      '[^1]: a.ts:9',
    ].join('\n');
    const { html } = renderElectricMarkdown(source);
    expect(html).not.toMatch(/style="[^"]*#[0-9a-fA-F]{3,8}/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(html).not.toMatch(/\b(?:rgb|hsl|oklch|oklab|lab|lch|hwb|color)\(/i);
  });
});

describe('research blueprint scaffold', () => {
  it('maps every scaffolded section onto its stable id', async () => {
    const raw = await readFile('templates/research/blueprint.md', 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
    const { html, toc, sections, meta } = renderElectricMarkdown(body);
    expect(sections).toEqual(BLUEPRINT_SECTIONS.map((section) => section.id));
    expect(toc.map((entry) => entry.id)).toEqual(BLUEPRINT_SECTIONS.map((section) => section.id));
    expect(html).toContain('class="callout c-info"');
    expect(html).toContain('class="evidence"');
    expect(html).toContain('<ol class="steps">');
    expect(html).toContain('<ul class="timeline">');
    expect(html).toContain('class="filetree"');
    expect(html).toContain('class="flow"');
    expect(html).toContain('<details class="ds">');
    expect(html).toContain('class="meter m-success"');
    expect(html).toContain('<ol class="footnotes">');
    expect(html).toContain('badge confidence b-success');
    expect(meta.length).toBeGreaterThan(0);
  });
});

describe('registerElectric as a plugin', () => {
  it('equips a standalone markdown-it instance', () => {
    const md = new MarkdownIt({ html: false });
    registerElectric(md);
    const html = md.render('::: callout info\nStandalone.\n:::');
    expect(html).toContain('<div class="callout c-info">');
    expect(html).toContain('<p>Standalone.</p>');
  });
});
