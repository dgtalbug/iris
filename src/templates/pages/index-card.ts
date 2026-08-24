import type { StalenessHint } from '../../lib/indexing.js';
import { escapeHtml, healthBadgeClass } from '../common.js';

export type IndexCardView =
  | { status: 'disabled' }
  | {
      status: 'enabled';
      symbols: number | null;
      flows: number | null;
      lastIndexedSha: string | null;
      staleness: StalenessHint;
    };

function shortSha(sha: string | null): string {
  if (!sha) return 'unknown';
  return sha.slice(0, 7);
}

function stalenessBadge(staleness: StalenessHint): string {
  if (staleness === 'up to date') return 'enabled';
  if (staleness.startsWith('stale')) return 'warning';
  return 'unknown';
}

/** Renders the machine-local code index card for Overview and Commands pages. */
export function indexCardSection(view: IndexCardView): string {
  if (view.status === 'disabled') {
    return `<section class="card index-card" aria-labelledby="index-card-title">
      <div class="card-head">
        <div><span class="eyebrow">code intelligence</span><h2 id="index-card-title">Code index</h2></div>
      </div>
      <p class="work-meta">Code index disabled</p>
    </section>`;
  }

  const symbolLabel = view.symbols === null ? '—' : String(view.symbols);
  const flowLabel = view.flows === null ? '—' : String(view.flows);

  return `<section class="card index-card" aria-labelledby="index-card-title">
    <div class="card-head">
      <div><span class="eyebrow">code intelligence</span><h2 id="index-card-title">Code index</h2></div>
      <span class="badge ${healthBadgeClass(stalenessBadge(view.staleness))}">${escapeHtml(view.staleness)}</span>
    </div>
    <div class="card-body index-card-stats">
      <p class="index-card-line"><b>${escapeHtml(symbolLabel)}</b> symbols · <b>${escapeHtml(flowLabel)}</b> flows · indexed at <code class="mono">${escapeHtml(shortSha(view.lastIndexedSha))}</code></p>
    </div>
  </section>`;
}
