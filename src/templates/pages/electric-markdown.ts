import { renderElectricMarkdown as renderElectric } from '../../lib/markdown.js';

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
 * (`src/lib/markdown-electric.ts`, owned by WS-C). The pipeline returns
 * `headings` (every heading) and `toc` (blueprint sections only); page
 * templates render the page TOC from every heading, so this seam surfaces
 * `headings` as `toc` and passes the meta-row through unchanged.
 */
export function renderElectricMarkdown(source: string): ElectricMarkdownResult {
  const { html, headings, meta } = renderElectric(source);
  return { html, toc: headings, meta };
}
