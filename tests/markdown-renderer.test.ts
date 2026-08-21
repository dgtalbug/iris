import { describe, expect, it } from 'vitest';
import { renderSafeMarkdown } from '../src/lib/markdown.js';

describe('safe Markdown renderer', () => {
  it('renders document structure and task lists semantically', () => {
    const source = `# Heading

Paragraph with **strong**, *emphasis*, \`inline code\`, and [docs](./guide.md).

> Quoted evidence

- item
- [x] complete task
- [ ] open task

| Key | Value |
| --- | --- |
| one | two |

\`\`\`ts
const value = 1;
\`\`\`
`;

    const html = renderSafeMarkdown(source);
    expect(html).toContain('<h1>Heading</h1>');
    expect(html).toContain('<strong>strong</strong>');
    expect(html).toContain('<em>emphasis</em>');
    expect(html).toContain('<code>inline code</code>');
    expect(html).toContain('href="./guide.md" rel="noopener noreferrer"');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('class="task-list-item"');
    expect(html).toContain('disabled checked aria-label="completed task"');
    expect(html).toContain('disabled aria-label="open task"');
    expect(html).toContain('<table>');
    expect(html).toContain('<pre><code class="language-ts">');
    expect(source).toContain('- [x] complete task');
  });

  it('keeps embedded HTML inert and rejects unsafe destinations', () => {
    const html = renderSafeMarkdown(`
<script>alert('script')</script>
<iframe src="https://example.com"></iframe>
<style>body { display: none }</style>
<img src=x onerror="alert('event')">

[script](javascript:alert(1))
[data](data:text/html,unsafe)
![remote](https://example.com/tracker.png)
![local](./diagram.png)
`);

    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&lt;iframe');
    expect(html).toContain('&lt;style&gt;');
    expect(html).toContain('&lt;img');
    expect(html).not.toMatch(/<(?:script|iframe|style|img)\b/);
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('href="data:');
    expect(html).not.toContain('src="https://example.com/tracker.png"');
    expect(html).not.toContain('src="./diagram.png"');
    expect(html).toContain('Image: remote (https://example.com/tracker.png)');
    expect(html).toContain('Image: local (./diagram.png)');
  });

  it('is deterministic and does not automatically link plain URLs', () => {
    const source = 'Visit https://example.com without Markdown link syntax.';
    expect(renderSafeMarkdown(source)).toBe(renderSafeMarkdown(source));
    expect(renderSafeMarkdown(source)).not.toContain('<a ');
  });
});
