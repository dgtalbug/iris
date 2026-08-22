import MarkdownIt from 'markdown-it';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const markdown = new MarkdownIt({
  breaks: false,
  html: false,
  linkify: false,
  typographer: false,
});

const defaultFence = markdown.renderer.rules.fence;
markdown.renderer.rules.fence = (tokens, index, options, environment, renderer) => {
  const token = tokens[index];
  const language = token.info.trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (language !== 'mermaid') {
    return defaultFence
      ? defaultFence(tokens, index, options, environment, renderer)
      : renderer.renderToken(tokens, index, options);
  }

  const source = escapeHtml(token.content);
  return `<figure class="diagram mermaid-figure" data-mermaid-figure>
<div class="mermaid-status" role="status" data-mermaid-status>Diagram source. Run <code>iris vendor</code> to enable the offline preview.</div>
<div class="mermaid-host" data-mermaid-host aria-label="Mermaid diagram">${source}</div>
<pre class="mermaid-fallback" data-mermaid-fallback><code class="language-mermaid">${source}</code></pre>
</figure>
`;
};

const defaultLinkOpen = markdown.renderer.rules.link_open;
markdown.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
  tokens[index].attrSet('rel', 'noopener noreferrer');
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, index, options, environment, renderer)
    : renderer.renderToken(tokens, index, options);
};

markdown.renderer.rules.image = (tokens, index, options, environment, renderer) => {
  const token = tokens[index];
  const alt = renderer.renderInlineAsText(token.children ?? [], options, environment);
  const source = token.attrGet('src') ?? '';
  const evidence = source ? `${alt || 'image'} (${source})` : alt || 'image';
  return `<span class="spec-image-reference">Image: ${escapeHtml(evidence)}</span>`;
};

markdown.core.ruler.after('inline', 'iris-task-lists', (state) => {
  for (let index = 0; index < state.tokens.length; index += 1) {
    const inline = state.tokens[index];
    if (inline.type !== 'inline' || !inline.children || inline.children.length === 0) continue;
    const first = inline.children[0];
    if (first.type !== 'text') continue;
    const marker = first.content.match(/^\[([ xX])\]\s+/);
    if (!marker) continue;

    let itemIndex = index - 1;
    while (itemIndex >= 0 && state.tokens[itemIndex].type !== 'list_item_open') {
      if (state.tokens[itemIndex].type === 'list_item_close') break;
      itemIndex -= 1;
    }
    if (itemIndex < 0 || state.tokens[itemIndex].type !== 'list_item_open') continue;

    const checked = marker[1].toLowerCase() === 'x';
    state.tokens[itemIndex].attrJoin('class', 'task-list-item');
    first.content = first.content.slice(marker[0].length);
    const checkbox = new state.Token('iris_task_checkbox', 'input', 0);
    checkbox.meta = { checked };
    inline.children.unshift(checkbox);
  }
});

markdown.renderer.rules.iris_task_checkbox = (tokens, index) => {
  const checked = Boolean((tokens[index].meta as { checked?: boolean } | null)?.checked);
  return `<input class="task-checkbox" type="checkbox" disabled${checked ? ' checked' : ''} aria-label="${checked ? 'completed' : 'open'} task" /> `;
};

export type DocumentHeading = {
  level: number;
  id: string;
  text: string;
};

function slugify(text: string, used: Set<string>): string {
  const base =
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section';
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

// Heading ids are opt-in because the Spec view renders many documents into one
// page, where generated ids from different files would collide.
markdown.core.ruler.push('iris-heading-ids', (state) => {
  const environment = state.env as {
    headingIds?: boolean;
    idPrefix?: string;
    headings?: DocumentHeading[];
  };
  if (!environment?.headingIds) return;
  const headings: DocumentHeading[] = [];
  const used = new Set<string>();
  const prefix = environment.idPrefix ? `${environment.idPrefix}-` : '';
  for (let index = 0; index < state.tokens.length; index += 1) {
    const token = state.tokens[index];
    if (token.type !== 'heading_open') continue;
    const inline = state.tokens[index + 1];
    const text = inline && inline.type === 'inline' ? inline.content : '';
    const id = `${prefix}${slugify(text, used)}`;
    token.attrSet('id', id);
    headings.push({ level: Number(token.tag.slice(1)) || 1, id, text });
  }
  environment.headings = headings;
});

export function renderSafeMarkdown(value: string): string {
  return markdown.render(value);
}

export function renderDocument(
  value: string,
  options: { idPrefix?: string } = {},
): { html: string; headings: DocumentHeading[] } {
  const environment: {
    headingIds: boolean;
    idPrefix?: string;
    headings?: DocumentHeading[];
  } = { headingIds: true, idPrefix: options.idPrefix };
  const html = markdown.render(value, environment);
  return { html, headings: environment.headings ?? [] };
}
