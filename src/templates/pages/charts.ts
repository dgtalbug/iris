import { escapeHtml } from '../common.js';

export type ChartSeries = {
  name: string;
  values: number[];
};

export type ChartSpec = {
  kind: 'bar' | 'line' | 'doughnut';
  title: string;
  labels: string[];
  series: ChartSeries[];
};

/** Fixed token order for series colors; wraps when a chart has more series than tokens. */
export const CHART_SERIES_TOKENS = [
  '--primary',
  '--accent-1',
  '--accent-2',
  '--accent-3',
  '--accent-4',
] as const;

const WIDTH = 640;
const HEIGHT = 300;
const PLOT = { left: 36, right: 12, top: 12, bottom: 26 };
const PLOT_W = WIDTH - PLOT.left - PLOT.right;
const PLOT_H = HEIGHT - PLOT.top - PLOT.bottom;

function seriesColor(index: number): string {
  return `var(${CHART_SERIES_TOKENS[index % CHART_SERIES_TOKENS.length]})`;
}

function num(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function asChartSpec(value: unknown): ChartSpec | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const kind = record.kind;
  if (kind !== 'bar' && kind !== 'line' && kind !== 'doughnut') return null;
  const title = typeof record.title === 'string' ? record.title : '';
  const labels = Array.isArray(record.labels)
    ? record.labels.filter((label): label is string => typeof label === 'string')
    : [];
  const series = Array.isArray(record.series)
    ? record.series.flatMap((entry): ChartSeries[] => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
        const item = entry as Record<string, unknown>;
        const name = typeof item.name === 'string' ? item.name : '';
        const values = Array.isArray(item.values)
          ? item.values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
          : [];
        return values.length > 0 ? [{ name, values }] : [];
      })
    : [];
  if (series.length === 0) return null;
  return { kind, title, labels, series };
}

function maxValue(series: ChartSeries[]): number {
  const max = Math.max(...series.flatMap((entry) => entry.values));
  return max > 0 ? max : 1;
}

function scaleY(value: number, max: number): number {
  return PLOT.top + PLOT_H - (value / max) * PLOT_H;
}

function categoryLabels(labels: string[], count: number): string {
  return labels
    .slice(0, count)
    .map((label, index) => {
      const x = PLOT.left + (index + 0.5) * (PLOT_W / count);
      return `<text x="${num(x)}" y="${num(HEIGHT - 8)}" text-anchor="middle" font-size="10" style="fill: var(--muted)">${escapeHtml(label)}</text>`;
    })
    .join('');
}

function renderBar(chart: ChartSpec): string {
  const count = chart.labels.length > 0 ? chart.labels.length : chart.series[0].values.length;
  const max = maxValue(chart.series);
  const groupW = PLOT_W / count;
  const barW = (groupW * 0.72) / chart.series.length;
  const bars = chart.series
    .map((entry, seriesIndex) =>
      entry.values
        .slice(0, count)
        .map((value, labelIndex) => {
          const x =
            PLOT.left +
            labelIndex * groupW +
            (groupW - barW * chart.series.length) / 2 +
            seriesIndex * barW;
          const height = (value / max) * PLOT_H;
          return `<rect x="${num(x)}" y="${num(PLOT.top + PLOT_H - height)}" width="${num(barW)}" height="${num(height)}" rx="2" style="fill: ${seriesColor(seriesIndex)}"><title>${escapeHtml(entry.name)}: ${escapeHtml(String(value))}</title></rect>`;
        })
        .join(''),
    )
    .join('');
  return bars + categoryLabels(chart.labels, count);
}

function renderLine(chart: ChartSpec): string {
  const count = Math.max(...chart.series.map((entry) => entry.values.length));
  const max = maxValue(chart.series);
  const xAt = (index: number): number =>
    count <= 1 ? PLOT.left + PLOT_W / 2 : PLOT.left + (index * PLOT_W) / (count - 1);
  const lines = chart.series
    .map((entry, seriesIndex) => {
      const points = entry.values
        .map((value, index) => `${num(xAt(index))},${num(scaleY(value, max))}`)
        .join(' ');
      const dots = entry.values
        .map(
          (value, index) =>
            `<circle cx="${num(xAt(index))}" cy="${num(scaleY(value, max))}" r="3" style="fill: ${seriesColor(seriesIndex)}"><title>${escapeHtml(entry.name)}: ${escapeHtml(String(value))}</title></circle>`,
        )
        .join('');
      return `<polyline points="${points}" fill="none" stroke-width="2" style="stroke: ${seriesColor(seriesIndex)}"/>${dots}`;
    })
    .join('');
  return lines + categoryLabels(chart.labels, count);
}

function renderDoughnut(chart: ChartSpec): string {
  const entry = chart.series[0];
  const total = entry.values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return '';
  const cx = 110;
  const cy = 150;
  const r = 84;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = entry.values
    .map((value, index) => {
      if (value <= 0) return '';
      const dash = (value / total) * circumference;
      const segment = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="30" stroke-dasharray="${num(dash)} ${num(circumference - dash)}" stroke-dashoffset="${num(-offset)}" transform="rotate(-90 ${cx} ${cy})" style="stroke: ${seriesColor(index)}"><title>${escapeHtml(chart.labels[index] ?? entry.name)}: ${escapeHtml(String(value))}</title></circle>`;
      offset += dash;
      return segment;
    })
    .join('');
  const legend = entry.values
    .map((value, index) => {
      const y = 150 - ((entry.values.length - 1) * 18) / 2 + index * 18;
      const label = chart.labels[index] ?? `slice ${index + 1}`;
      return `<rect x="240" y="${num(y - 9)}" width="10" height="10" rx="2" style="fill: ${seriesColor(index)}"/><text x="256" y="${num(y)}" font-size="11" style="fill: var(--muted)">${escapeHtml(label)} · ${escapeHtml(String(value))}</text>`;
    })
    .join('');
  return `${segments}<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="16" style="fill: var(--foreground)">${escapeHtml(String(total))}</text>${legend}`;
}

function renderLegend(series: ChartSeries[]): string {
  const items = series
    .map(
      (entry, index) =>
        `<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px"><span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${seriesColor(index)}"></span>${escapeHtml(entry.name)}</span>`,
    )
    .join('');
  return `<div class="caption" style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center">${items}</div>`;
}

function renderChart(chart: ChartSpec): string {
  const body =
    chart.kind === 'bar'
      ? renderBar(chart)
      : chart.kind === 'line'
        ? renderLine(chart)
        : renderDoughnut(chart);
  if (body === '') return '';
  const svg = `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" height="100%" role="img" aria-label="${escapeHtml(chart.title)}">${body}</svg>`;
  const legend = chart.kind === 'doughnut' ? '' : renderLegend(chart.series);
  return `<figure class="diagram blueprint-chart" data-chart="${chart.kind}">
      <div class="chart-box">${svg}</div>
      <figcaption class="caption">${escapeHtml(chart.title)}</figcaption>
      ${legend}
    </figure>`;
}

/** Renders the optional `sections.charts` contract array as deterministic inline SVG. */
export function renderCharts(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map(asChartSpec)
    .filter((chart): chart is ChartSpec => chart !== null)
    .map(renderChart)
    .join('');
}
