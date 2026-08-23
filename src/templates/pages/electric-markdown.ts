import { renderDocument } from '../../lib/markdown.js';

export type ElectricTocEntry = {
  level: number;
  id: string;
  text: string;
};

export type ElectricMetaEntry = {
  label: string;
  value: string;
};

export type ElectricMarkdownResult = {
  html: string;
  toc: ElectricTocEntry[];
  meta: ElectricMetaEntry[];
};

/**
 * Consumption seam for the Electric Markdown pipeline
 * (`src/lib/markdown-electric.ts`, owned by WS-C). The signatures are
 * identical by contract; until that module lands this adapter delegates to
 * the base document renderer so pages compile and render unchanged.
 */
export function renderElectricMarkdown(source: string): ElectricMarkdownResult {
  const { html, headings } = renderDocument(source);
  return { html, toc: headings, meta: [] };
}
