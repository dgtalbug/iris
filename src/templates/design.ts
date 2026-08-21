import type {
  OpenSpecCapability,
  OpenSpecChange,
  OpenSpecSnapshot,
  OpenSpecSourceDocument,
} from '../lib/openspec-workspace.js';
import { renderSafeMarkdown } from '../lib/markdown.js';

export const TOKENS_CSS = `:root {
  --bg: #0b0e14;
  --surface-1: #12161f;
  --surface-2: #1a1f2b;
  --surface-3: #232936;
  --line-1: #252b39;
  --text-1: #e9ebf1;
  --text-2: #a6adbf;
  --text-3: #6e7689;
  --accent: #f2b24e;
  --accent-text: #f2b24e;
  --accent-ink: #141008;
  --type-report: #5cb8f0;
  --type-feature: #4fc98c;
  --type-bug: #ef6a6a;
  --type-idea: #a78bfa;
  --type-plan: #f2b24e;
  --type-report-soft: #5cb8f026;
  --type-feature-soft: #4fc98c26;
  --type-bug-soft: #ef6a6a26;
  --type-idea-soft: #a78bfa26;
  --type-plan-soft: #f2b24e26;
  --ok: #4fc98c;
  --warn: #f0913e;
  --danger: #ef6a6a;
  --info: #5cb8f0;
  --ok-soft: #4fc98c26;
  --warn-soft: #f0913e26;
  --danger-soft: #ef6a6a26;
  --info-soft: #5cb8f026;
  --font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-display: var(--font-sans);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --size-1: 0.6875rem;
  --size-2: 0.8125rem;
  --size-3: 0.9375rem;
  --size-4: 1.25rem;
  --size-5: 1.75rem;
  --size-6: 2.5rem;
  --leading-tight: 1.2;
  --leading-body: 1.55;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2.5rem;
  --radius-1: 0.375rem;
  --radius-2: 0.625rem;
  --radius-3: 1rem;
  --radius-full: 999px;
  --border-1: 1px solid var(--line-1);
  --elevation-1: none;
  --duration-1: 120ms;
  --duration-2: 220ms;
  --duration-3: 320ms;
  --easing: cubic-bezier(0.22, 0.61, 0.36, 1);
}

[data-theme='light'] {
  --bg: #f6f5f1;
  --surface-1: #ffffff;
  --surface-2: #ecebe7;
  --surface-3: #e2e0da;
  --line-1: #d4d1c8;
  --text-1: #191d26;
  --text-2: #4b5163;
  --text-3: #7a8093;
  --accent: #b87a16;
  --accent-text: #84530b;
  --accent-ink: #ffffff;
  --type-report: #126b9b;
  --type-feature: #16754a;
  --type-bug: #b62b32;
  --type-idea: #6941c6;
  --type-plan: #84530b;
  --type-report-soft: #126b9b18;
  --type-feature-soft: #16754a18;
  --type-bug-soft: #b62b3218;
  --type-idea-soft: #6941c618;
  --type-plan-soft: #84530b18;
  --ok: #16754a;
  --warn: #954708;
  --danger: #b62b32;
  --info: #126b9b;
  --ok-soft: #16754a18;
  --warn-soft: #95470818;
  --danger-soft: #b62b3218;
  --info-soft: #126b9b18;
  --elevation-1: 0 0.25rem 0.75rem #6b625629;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: var(--size-3);
  line-height: var(--leading-body);
  background: var(--bg);
  color: var(--text-1);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
`;

export const BASE_COMPONENTS_CSS = `
.page-shell { width: min(100% - calc(var(--space-4) * 2), 72rem); margin: 0 auto; padding: var(--space-5) 0; }
.surface { background: var(--surface-1); border: var(--border-1); border-radius: var(--radius-2); box-shadow: var(--elevation-1); }
a { color: var(--accent-text); }
h1 { font-family: var(--font-display); font-size: var(--size-5); line-height: var(--leading-tight); font-weight: var(--weight-bold); letter-spacing: -0.02em; margin: 0; }
h2 { font-size: var(--size-4); margin: 0 0 var(--space-3); letter-spacing: -0.01em; }
.eyebrow { font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-2); }
.mono { font-family: var(--font-mono); font-size: var(--size-2); }

.header { display: grid; gap: var(--space-4); margin-bottom: var(--space-5); }
.topbar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
.crumbs { display: flex; align-items: center; gap: var(--space-2); }
.crumbs a { color: var(--text-2); text-decoration: none; font-family: var(--font-mono); font-size: var(--size-2); }
.crumbs a:hover { color: var(--accent-text); }
.theme-toggle { background: var(--surface-2); border: var(--border-1); color: var(--text-2); border-radius: var(--radius-full); padding: var(--space-1) var(--space-3); cursor: pointer; font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; transition: border-color var(--duration-1) var(--easing), color var(--duration-1) var(--easing); }
.theme-toggle:hover { color: var(--text-1); border-color: var(--accent); }

.briefing-hero { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--space-5); padding: var(--space-5); }
.hero-copy { display: grid; gap: var(--space-2); }
.hero-copy h1 { font-size: var(--size-6); }
.hero-line { max-width: 52rem; margin: 0; color: var(--text-2); }
.hero-meta { display: flex; gap: var(--space-3); flex-wrap: wrap; margin: var(--space-1) 0 0; color: var(--text-2); font-family: var(--font-mono); font-size: var(--size-2); }
.header-bar { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); flex-wrap: wrap; }
.page-title-row { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); }

.aperture { flex: none; }
.aperture .seg { stroke: currentColor; fill: none; stroke-width: 7; stroke-linecap: butt; stroke-dashoffset: 0; animation: aperture-open var(--duration-3) var(--easing) both; transition: stroke-width var(--duration-1) var(--easing); }
.aperture .seg:hover { stroke-width: 10; }
.aperture .ring-empty { stroke: var(--surface-3); fill: none; stroke-width: 2; stroke-dasharray: 4 6; }
.aperture-count { font-family: var(--font-display); font-size: var(--size-4); font-weight: var(--weight-bold); fill: var(--text-1); }
.aperture-label { font-family: var(--font-mono); font-size: var(--size-1); letter-spacing: 0.16em; text-transform: uppercase; fill: var(--text-2); }
.aperture-glyph { width: 1.5rem; height: 1.5rem; flex: none; }
.aperture-glyph circle { fill: none; stroke: currentColor; stroke-width: 5; stroke-dasharray: 30 10; transform: rotate(-45deg); transform-origin: center; }
.tp-report { color: var(--type-report); }
.tp-feature { color: var(--type-feature); }
.tp-bug { color: var(--type-bug); }
.tp-idea { color: var(--type-idea); }
.tp-plan { color: var(--type-plan); }
.tp-page { color: var(--text-2); }

.pill, .type-chip, .status-chip { display: inline-flex; align-items: center; width: fit-content; padding: var(--space-1) var(--space-2); border-radius: var(--radius-full); background: var(--surface-2); font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-2); }
.type-chip.tp-report { background: var(--type-report-soft); color: var(--type-report); }
.type-chip.tp-feature { background: var(--type-feature-soft); color: var(--type-feature); }
.type-chip.tp-bug { background: var(--type-bug-soft); color: var(--type-bug); }
.type-chip.tp-idea { background: var(--type-idea-soft); color: var(--type-idea); }
.type-chip.tp-plan { background: var(--type-plan-soft); color: var(--type-plan); }
.st-draft { color: var(--text-2); }
.st-active { color: var(--info); }
.st-done { color: var(--ok); }
.st-archived { color: var(--text-2); }
.status-chip.st-active { background: var(--info-soft); }
.status-chip.st-done { background: var(--ok-soft); }

.health-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-3); }
.stat-tile { display: grid; gap: var(--space-1); padding: var(--space-4); color: inherit; text-decoration: none; transition: border-color var(--duration-1) var(--easing), background var(--duration-1) var(--easing); }
.stat-tile:hover { border-color: var(--accent); background: var(--surface-2); }
.stat-value { font-family: var(--font-display); font-size: var(--size-5); line-height: var(--leading-tight); font-weight: var(--weight-bold); }
.stat-label { color: var(--text-2); font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; }

.dashboard-stack { display: grid; gap: var(--space-5); }
.section-heading { display: flex; align-items: end; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
.section-heading h2 { margin: 0; }
.architecture-pane { min-height: 13rem; display: grid; place-items: center; padding: var(--space-5); }
.architecture-pane .empty-state { max-width: 38rem; text-align: center; }
.work-surface { display: grid; gap: var(--space-3); }

.primary-tabs { margin-bottom: var(--space-4); padding: var(--space-2); width: fit-content; }
.dashboard-panel { min-width: 0; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
.tabs { display: flex; gap: var(--space-2); }
.tab-button { background: var(--surface-2); border: var(--border-1); color: var(--text-2); border-radius: var(--radius-1); padding: var(--space-2) var(--space-3); cursor: pointer; font-family: var(--font-mono); font-size: var(--size-1); text-transform: uppercase; letter-spacing: 0.12em; }
.tab-button[aria-selected='true'] { color: var(--accent-text); background: var(--surface-3); border-color: var(--accent); }
.filter-input { background: var(--surface-2); border: var(--border-1); color: var(--text-1); border-radius: var(--radius-1); padding: var(--space-2) var(--space-3); font-family: var(--font-mono); font-size: var(--size-2); min-width: 14rem; }
.filter-wrap { display: flex; align-items: center; gap: var(--space-2); }
.filter-input::placeholder { color: var(--text-2); }
.kbd, kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 1.5rem; padding: var(--space-1) var(--space-2); border: var(--border-1); border-bottom-color: var(--text-2); border-radius: var(--radius-1); background: var(--surface-2); color: var(--text-2); font-family: var(--font-mono); font-size: var(--size-1); }

.list { display: grid; gap: var(--space-3); }
/* Class display values would otherwise defeat the hidden attribute. */
[hidden] { display: none !important; }
.page-card { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto; align-items: center; gap: var(--space-3); padding: var(--space-4); text-decoration: none; color: inherit; transition: border-color var(--duration-1) var(--easing), background var(--duration-1) var(--easing), transform var(--duration-1) var(--easing); }
.page-card:hover { border-color: var(--accent); background: var(--surface-2); transform: translateY(-1px); }
.card-main { display: grid; gap: var(--space-1); min-width: 0; }
.card-title { font-weight: var(--weight-medium); color: var(--text-1); }
.card-id { font-family: var(--font-mono); font-size: var(--size-1); color: var(--text-2); overflow-wrap: anywhere; }
.empty-state { padding: var(--space-5); color: var(--text-2); }
.empty-state code { font-family: var(--font-mono); color: var(--accent-text); }

.spec-stack { display: grid; gap: var(--space-5); min-width: 0; }
.spec-overview { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--space-3); }
.spec-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: var(--space-3); }
.spec-card { display: grid; gap: var(--space-3); padding: var(--space-4); min-width: 0; }
.spec-card h3 { margin: 0; font-size: var(--size-3); }
.spec-card-header, .spec-meta { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); flex-wrap: wrap; }
.spec-path { color: var(--text-2); overflow-wrap: anywhere; }
.spec-artifacts { display: grid; gap: var(--space-2); }
.spec-artifact { border-top: var(--border-1); padding-top: var(--space-2); min-width: 0; }
.spec-artifact summary { cursor: pointer; color: var(--text-1); font-weight: var(--weight-medium); }
.spec-document { min-width: 0; color: var(--text-1); overflow-wrap: anywhere; }
.spec-document > :first-child { margin-top: 0; }
.spec-document > :last-child { margin-bottom: 0; }
.spec-document h1, .spec-document h2, .spec-document h3, .spec-document h4, .spec-document h5, .spec-document h6 { margin: var(--space-4) 0 var(--space-2); line-height: var(--leading-tight); overflow-wrap: anywhere; }
.spec-document h1 { font-size: var(--size-4); }
.spec-document h2 { font-size: var(--size-3); }
.spec-document h3, .spec-document h4, .spec-document h5, .spec-document h6 { font-size: var(--size-2); }
.spec-document p, .spec-document ul, .spec-document ol, .spec-document blockquote, .spec-document pre, .spec-document table { margin: 0 0 var(--space-3); }
.spec-document ul, .spec-document ol { padding-left: var(--space-5); }
.spec-document li + li { margin-top: var(--space-1); }
.spec-document .task-list-item { list-style: none; }
.spec-document .task-checkbox { margin-left: calc(var(--space-5) * -1); accent-color: var(--accent); }
.spec-document blockquote { margin-left: 0; padding-left: var(--space-3); border-left: calc(var(--space-1) / 2) solid var(--accent); color: var(--text-2); }
.spec-document code, .spec-document pre { font-family: var(--font-mono); font-size: var(--size-1); }
.spec-document :not(pre) > code { padding: var(--space-1); border-radius: var(--radius-1); background: var(--surface-2); color: var(--accent-text); }
.spec-document pre { max-width: 100%; overflow: auto; padding: var(--space-3); border-radius: var(--radius-1); background: var(--surface-2); color: var(--text-2); }
.spec-document table { display: block; max-width: 100%; overflow: auto; border-collapse: collapse; }
.spec-document th, .spec-document td { padding: var(--space-2) var(--space-3); border: var(--border-1); text-align: left; }
.spec-document th { background: var(--surface-2); }
.spec-document a { overflow-wrap: anywhere; }
.spec-image-reference { font-family: var(--font-mono); font-size: var(--size-1); color: var(--text-2); }
.spec-source-details { margin-top: var(--space-3); }
.spec-source-details > summary { font-family: var(--font-mono); font-size: var(--size-1); color: var(--text-2); }
.spec-source { max-height: calc(var(--space-6) * 8); overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; padding: var(--space-3); border-radius: var(--radius-1); background: var(--surface-2); color: var(--text-2); font-family: var(--font-mono); font-size: var(--size-1); }
.spec-list { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.spec-warning { border-left: calc(var(--space-1) / 2) solid var(--warn); padding-left: var(--space-3); }
.spec-warning code { overflow-wrap: anywhere; }
.health-valid { color: var(--ok); }
.health-warning { color: var(--warn); }
.health-invalid { color: var(--danger); }

.board { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: var(--space-3); }
.board-col { display: grid; gap: var(--space-3); align-content: start; }
.board-col .eyebrow { padding: var(--space-2) var(--space-1) 0; }
.board-empty { color: var(--text-2); font-size: var(--size-2); padding: var(--space-2) var(--space-1); }

.project-strip { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); margin-top: var(--space-4); flex-wrap: wrap; }
.project-links { display: flex; gap: var(--space-3); flex-wrap: wrap; }
.project-links a { font-family: var(--font-mono); font-size: var(--size-2); text-decoration: none; color: var(--text-2); }
.project-links a:hover { color: var(--accent-text); }

.footer { display: flex; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; margin-top: var(--space-6); color: var(--text-2); font-size: var(--size-2); font-family: var(--font-mono); }

.timeline { position: relative; margin-left: var(--space-4); border-left: var(--border-1); padding-left: var(--space-4); }
.timeline-item { margin-bottom: var(--space-4); }
.timeline-item.info::before,.timeline-item.warn::before,.timeline-item.error::before { content: ''; position: absolute; left: -0.41rem; width: 0.5rem; height: 0.5rem; border-radius: 50%; }
.timeline-item.info::before { background: var(--info); }
.timeline-item.warn::before { background: var(--warn); }
.timeline-item.error::before { background: var(--danger); }
.code-card { padding: var(--space-4); display: grid; gap: var(--space-2); }
.code-toolbar { display: flex; justify-content: space-between; align-items: center; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr)); gap: var(--space-3); }
.metric-card { padding: var(--space-3); }
.metric-label { font-family: var(--font-mono); font-size: var(--size-1); color: var(--text-2); text-transform: uppercase; letter-spacing: 0.12em; }
.metric-value { margin-top: var(--space-2); font-size: var(--size-4); font-weight: var(--weight-bold); }
.table-wrap { overflow: auto; }
.chart-wrap, .mermaid-wrap, .flow-wrap { min-height: 16rem; padding: var(--space-4); }
.mermaid-figure { display: grid; gap: var(--space-3); min-width: 0; margin: var(--space-4) 0; padding: var(--space-4); border: var(--border-1); border-radius: var(--radius-2); background: var(--surface-2); overflow: hidden; }
.mermaid-status { color: var(--text-2); font-size: var(--size-2); }
.mermaid-host { display: none; min-width: 0; overflow: auto; color: var(--text-1); }
.mermaid-host[data-render-state='measuring'], .mermaid-host[data-render-state='pending'], .mermaid-host[data-render-state='rendered'] { display: block; }
.mermaid-host svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
.mermaid-fallback { max-width: 100%; max-height: 24rem; margin: 0; overflow: auto; white-space: pre; background: var(--surface-1); }
.mermaid-figure[data-render-state='rendered'] .mermaid-fallback { display: none; }
.mermaid-figure[data-render-state='error'] { border-color: var(--danger); }
.mermaid-figure[data-render-state='error'] .mermaid-status { color: var(--danger); }
.callout { padding: var(--space-4); border-left: 0.25rem solid var(--info); }
.callout.info { background: var(--info-soft); border-left-color: var(--info); }
.callout.warn { background: var(--warn-soft); border-left-color: var(--warn); }
.callout.danger { background: var(--danger-soft); border-left-color: var(--danger); }

@keyframes aperture-open { from { stroke-dashoffset: 18; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .aperture .seg { animation: none; stroke-dashoffset: 0; }
  .page-card, .stat-tile, .theme-toggle, .tab-button, .dashboard-panel { transition: none; }
  .page-card:hover { transform: none; }
}
@media (max-width: 40rem) {
  .page-shell { width: min(100% - calc(var(--space-3) * 2), 72rem); padding: var(--space-4) 0; }
  .briefing-hero { grid-template-columns: 1fr; }
  .aperture { justify-self: start; }
  .health-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .spec-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .spec-grid { grid-template-columns: minmax(0, 1fr); }
  .primary-tabs { width: auto; }
  .toolbar, .filter-wrap { align-items: stretch; }
  .filter-wrap { width: 100%; }
  .filter-input { min-width: 0; width: 100%; }
  .board { grid-template-columns: 1fr; }
  .mermaid-figure { padding: var(--space-3); }
  .page-card { grid-template-columns: auto minmax(0, 1fr); }
  .page-card .type-chip, .page-card .status-chip { grid-column: 2; }
}
@media print {
  .theme-toggle, .crumbs, .toolbar, .kbd { display: none !important; }
  .page-shell { width: 100%; padding: 0; }
  .surface { box-shadow: none; break-inside: avoid; }
  a { color: inherit; text-decoration: underline; }
  .spec-document pre, .spec-document table, .spec-source { max-height: none; overflow: visible; }
  .mermaid-host { display: none !important; }
  .mermaid-fallback { display: block !important; max-height: none; overflow: visible; white-space: pre-wrap; }
}
`;

export const BASE_COMPONENTS_JS = `
function setupTabs() {
  for (const group of document.querySelectorAll('[data-tabs]')) {
    const buttons = Array.from(group.querySelectorAll('[role="tab"]'));
    const groupId = group.getAttribute('data-tabs');
    const panels = document.querySelectorAll('[data-tab-group="' + groupId + '"]');
    const activate = (button, moveFocus) => {
      buttons.forEach((it) => {
        const selected = it === button;
        it.setAttribute('aria-selected', String(selected));
        it.setAttribute('tabindex', selected ? '0' : '-1');
      });
      panels.forEach((panel) => {
        panel.hidden = panel.getAttribute('data-tab-id') !== button.getAttribute('data-tab-id');
      });
      document.dispatchEvent(new CustomEvent('iris:visibilitychange'));
      if (moveFocus) button.focus();
    };
    buttons.forEach((button) => {
      button.addEventListener('click', () => activate(button, false));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const current = buttons.indexOf(button);
        const next = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? buttons.length - 1
            : (current + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        activate(buttons[next], true);
      });
    });
  }
}

function setupFilter() {
  const input = document.querySelector('[data-filter-input]');
  if (!input) return;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    for (const card of document.querySelectorAll('[data-page-card]')) {
      card.hidden = query !== '' && !card.textContent.toLowerCase().includes(query);
    }
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (
      target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
    );
    if (editing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === '/') {
      const input = Array.from(document.querySelectorAll('[data-filter-input]'))
        .find((candidate) => !candidate.closest('[hidden]'));
      if (input instanceof HTMLElement) {
        event.preventDefault();
        input.focus();
      }
    }
    if (event.key.toLowerCase() === 't') {
      const toggle = document.querySelector('[data-theme-toggle]');
      if (toggle instanceof HTMLElement) {
        event.preventDefault();
        toggle.click();
      }
    }
  });
}

function setupCardNavigation() {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const cards = Array.from(document.querySelectorAll('[data-page-card]:not([hidden])'));
    const index = cards.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const offset = event.key === 'ArrowDown' ? 1 : -1;
    const next = cards[(index + offset + cards.length) % cards.length];
    if (next instanceof HTMLElement) next.focus();
  });
}

function setupTheme() {
  const toggle = document.querySelector('[data-theme-toggle]');
  const stored = localStorage.getItem('iris-theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('iris-theme', next);
  });
}

async function setupMermaid() {
  const figures = Array.from(document.querySelectorAll('[data-mermaid-figure]'));
  if (figures.length === 0) return;
  if (!globalThis.mermaid || typeof globalThis.mermaid.initialize !== 'function') return;

  globalThis.mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges', 'htmlLabels', 'flowchart'],
    htmlLabels: false,
    maxTextSize: 50000,
    maxEdges: 500,
    suppressErrorRendering: true,
    theme: 'neutral',
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    flowchart: { htmlLabels: false, useMaxWidth: true },
  });

  async function renderFigure(figure) {
    if (figure.hasAttribute('data-render-state')) return;
    const host = figure.querySelector('[data-mermaid-host]');
    const status = figure.querySelector('[data-mermaid-status]');
    if (!(host instanceof HTMLElement) || !(status instanceof HTMLElement)) return;
    host.setAttribute('data-render-state', 'measuring');
    if (host.getClientRects().length === 0) {
      host.removeAttribute('data-render-state');
      return;
    }
    const source = host.textContent || '';
    host.classList.add('mermaid');
    host.setAttribute('data-render-state', 'pending');
    figure.setAttribute('data-render-state', 'pending');
    status.textContent = 'Rendering diagram…';
    try {
      if (source.length > 50000) throw new Error('diagram source exceeds 50000 characters');
      await globalThis.mermaid.run({ nodes: [host], suppressErrors: true });
      const svg = host.querySelector('svg');
      if (!(svg instanceof SVGElement)) throw new Error('Mermaid did not produce an SVG');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', host.getAttribute('aria-label') || 'Mermaid diagram');
      host.setAttribute('data-render-state', 'rendered');
      figure.setAttribute('data-render-state', 'rendered');
      status.textContent = 'Diagram rendered.';
    } catch (error) {
      host.textContent = source;
      host.setAttribute('data-render-state', 'error');
      figure.setAttribute('data-render-state', 'error');
      status.textContent = 'Diagram could not be rendered. Escaped source is shown below.';
    }
  }

  async function renderVisibleFigures() {
    for (const figure of figures) await renderFigure(figure);
  }

  for (const details of document.querySelectorAll('details')) {
    details.addEventListener('toggle', () => {
      if (details.open) void renderVisibleFigures();
    });
  }
  document.addEventListener('iris:visibilitychange', () => void renderVisibleFigures());
  await renderVisibleFigures();
}

setupTabs();
setupFilter();
setupTheme();
setupKeyboardShortcuts();
setupCardNavigation();
void setupMermaid();
document.documentElement.setAttribute('data-iris-js', 'ready');
`;

export type DashboardPage = {
  id: string;
  type: string;
  title: string;
  status: string;
  href: string;
};

export const PROJECT_DOC_NAMES = [
  'overview',
  'hld',
  'lld',
  'erd',
  'commands',
  'decisions',
] as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'md' in value && typeof value.md === 'string')
    return value.md;
  return '';
}

function getStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function markdownToHtml(value: string): string {
  return value.trim() === '' ? '<p>Empty.</p>' : renderSafeMarkdown(value);
}

function statusClass(status: string): string {
  return ['draft', 'active', 'done', 'archived'].includes(status) ? `st-${status}` : 'st-active';
}

function typeClass(type: string): string {
  return ['report', 'feature', 'bug', 'idea', 'plan'].includes(type) ? `tp-${type}` : 'tp-page';
}

function apertureGlyph(type: string): string {
  return `<svg class="aperture-glyph ${typeClass(type)}" viewBox="0 0 24 24" role="img" aria-label="${escapeHtml(type)} page"><circle cx="12" cy="12" r="8"><title>${escapeHtml(type)} page</title></circle></svg>`;
}

function renderMetricGrid(entries: Array<{ label: string; value: string }>): string {
  if (entries.length === 0) return '';

  const cards = entries
    .map(
      (entry) => `
        <article class="surface metric-card">
          <div class="metric-label">${escapeHtml(entry.label)}</div>
          <div class="metric-value">${escapeHtml(entry.value)}</div>
        </article>
      `,
    )
    .join('');

  return `<section class="metric-grid" style="margin-bottom: var(--space-4);">${cards}</section>`;
}

function renderSummaryBlock(title: string, text: string): string {
  if (!text.trim()) return '';
  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>${escapeHtml(title)}</h2>
      ${markdownToHtml(text)}
    </article>
  `;
}

function renderTimeline(events: unknown[]): string {
  if (!Array.isArray(events) || events.length === 0) return '';

  const items = events
    .map((event) => {
      const record = asObject(event);
      const time = typeof record.t === 'string' ? record.t : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Event';
      const level = typeof record.level === 'string' ? record.level : 'info';
      return `
        <div class="timeline-item ${escapeHtml(level)}" style="position: relative;">
          <strong class="mono">${escapeHtml(time)}</strong> <span class="pill">${escapeHtml(level)}</span>
          <div>${escapeHtml(title)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>Timeline</h2>
      <div class="timeline">${items}</div>
    </article>
  `;
}

function renderTaskTable(tasks: unknown[]): string {
  if (!Array.isArray(tasks) || tasks.length === 0) return '';

  const rows = tasks
    .map((task) => {
      const record = asObject(task);
      const id = typeof record.id === 'string' ? record.id : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Untitled task';
      const done = record.done === true;
      return `<tr><td class="mono">${escapeHtml(id)}</td><td>${escapeHtml(title)}</td><td class="mono">${done ? 'done' : 'open'}</td></tr>`;
    })
    .join('');

  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>Tasks</h2>
      <div class="table-wrap">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th class="metric-label" style="text-align: left; padding-bottom: var(--space-2);">id</th>
              <th class="metric-label" style="text-align: left; padding-bottom: var(--space-2);">title</th>
              <th class="metric-label" style="text-align: left; padding-bottom: var(--space-2);">status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderStepsList(steps: unknown[]): string {
  if (!Array.isArray(steps) || steps.length === 0) return '';

  const list = steps
    .map((step) => {
      const record = asObject(step);
      const id = typeof record.id === 'string' ? record.id : 'n/a';
      const title = typeof record.title === 'string' ? record.title : 'Untitled step';
      const detail = typeof record.detail === 'string' ? record.detail : '';
      return `
        <li style="margin-bottom: var(--space-3);">
          <div><strong class="mono">${escapeHtml(id)}</strong> · ${escapeHtml(title)}</div>
          ${detail ? `<div style="color: var(--text-2); margin-top: var(--space-1);">${escapeHtml(detail)}</div>` : ''}
        </li>
      `;
    })
    .join('');

  return `
    <article class="surface" style="padding: var(--space-4); margin-bottom: var(--space-4);">
      <h2>Plan steps</h2>
      <ol>${list}</ol>
    </article>
  `;
}

function renderGenericPage(contract: Record<string, unknown>): string {
  const sections = asObject(contract.sections);
  const sectionEntries = Object.entries(sections)
    .map(([name, value]) => renderSummaryBlock(name.replace(/_/g, ' '), getText(value)))
    .join('');

  const id = typeof contract.id === 'string' ? contract.id : 'unknown';
  const title = typeof contract.title === 'string' ? contract.title : id;
  const status = typeof contract.status === 'string' ? contract.status : 'draft';
  const type = typeof contract.type === 'string' ? contract.type : 'page';

  return renderPageShell({
    id,
    title,
    type,
    status,
    meta: [
      { label: 'kind', value: type },
      { label: 'status', value: status },
      { label: 'updated', value: typeof contract.updated === 'string' ? contract.updated : 'n/a' },
    ],
    content: sectionEntries,
  });
}

function themeToggleButton(): string {
  return `<button class="theme-toggle" type="button" data-theme-toggle data-iris-nav aria-label="Toggle color theme">theme</button>`;
}

function renderPageShell({
  id,
  title,
  type,
  status,
  meta,
  content,
}: {
  id: string;
  title: string;
  type: string;
  status: string;
  meta: Array<{ label: string; value: string }>;
  content: string;
}): string {
  const metaGrid = renderMetricGrid(meta);
  return `<!doctype html>
<html lang="en">
 <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <title>${escapeHtml(title)} · iris</title>
   <link rel="stylesheet" href="../../design/tokens.css" />
   <link rel="stylesheet" href="../../design/components/base.css" />
   <script defer src="../../design/vendor/mermaid.min.js"></script>
 </head>
 <body>
   <main class="page-shell">
     <header class="header">
       <div class="topbar">
         <nav class="crumbs"><a data-iris-nav href="../../index.html">&larr; dashboard</a></nav>
         ${themeToggleButton()}
       </div>
       <div class="header-bar">
         <div>
           <div class="page-title-row">
             ${apertureGlyph(type)}
             <div class="type-chip ${typeClass(type)}">${escapeHtml(type)}</div>
           </div>
           <h1>${escapeHtml(title)}</h1>
         </div>
         <span class="status-chip ${statusClass(status)}">status: ${escapeHtml(status)}</span>
       </div>
       ${metaGrid}
     </header>
     ${content}
     <footer class="footer">rendered from ${escapeHtml(id)} · offline deterministic template</footer>
   </main>
   <script defer src="../../design/components/base.js"></script>
 </body>
</html>`.replace(/[ \t]+$/gm, '');
}

export function renderContractPage(contract: Record<string, unknown>): string {
  const id = typeof contract.id === 'string' ? contract.id : 'unknown';
  const title = typeof contract.title === 'string' ? contract.title : id;
  const type = typeof contract.type === 'string' ? contract.type : 'page';
  const status = typeof contract.status === 'string' ? contract.status : 'draft';
  const sections = asObject(contract.sections);

  switch (type) {
    case 'report': {
      const summary = getStringList(sections.summary);
      const openItems = getText(sections.open_items);
      const promotable = getStringList(sections.promotable_as);
      const content = [
        summary.length > 0
          ? renderSummaryBlock('Summary', summary.map((item) => `- ${item}`).join('\n'))
          : '',
        openItems ? renderSummaryBlock('Open items', openItems) : '',
        promotable.length > 0
          ? renderSummaryBlock('Promotable as', promotable.map((item) => `- ${item}`).join('\n'))
          : '',
      ].join('');

      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'promotions', value: promotable.join(', ') || 'none' },
        ],
        content,
      });
    }
    case 'feature': {
      const problem = getText(sections.problem);
      const goal = getText(sections.goal);
      const tasks = Array.isArray(sections.tasks) ? sections.tasks : [];
      const content = [
        renderSummaryBlock('Problem', problem),
        renderSummaryBlock('Goal', goal),
        renderTaskTable(tasks),
      ].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          {
            label: 'tasks',
            value: String(Array.isArray(sections.tasks) ? sections.tasks.length : 0),
          },
        ],
        content,
      });
    }
    case 'bug': {
      const symptom = getText(sections.symptom);
      const severity = typeof sections.severity === 'string' ? sections.severity : 'p2';
      const timelineEvents = asObject(sections.timeline).events;
      const timeline = Array.isArray(timelineEvents) ? timelineEvents : [];
      const content = [renderSummaryBlock('Symptom', symptom), renderTimeline(timeline)].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'severity', value: severity },
        ],
        content,
      });
    }
    case 'idea': {
      const current = getText(sections.current_state);
      const proposed = getText(sections.proposed);
      const effortImpact = asObject(sections.effort_impact);
      const effort = typeof effortImpact.effort === 'number' ? String(effortImpact.effort) : 'n/a';
      const impact = typeof effortImpact.impact === 'number' ? String(effortImpact.impact) : 'n/a';
      const content = [
        renderSummaryBlock('Current state', current),
        renderSummaryBlock('Proposed', proposed),
        renderMetricGrid([
          { label: 'effort', value: effort },
          { label: 'impact', value: impact },
        ]),
      ].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'effort', value: effort },
          { label: 'impact', value: impact },
        ],
        content,
      });
    }
    case 'plan': {
      const goal = getText(sections.goal);
      const steps = Array.isArray(sections.steps) ? sections.steps : [];
      const content = [renderSummaryBlock('Goal', goal), renderStepsList(steps)].join('');
      return renderPageShell({
        id,
        title,
        type,
        status,
        meta: [
          { label: 'kind', value: type },
          { label: 'status', value: status },
          { label: 'steps', value: String(steps.length) },
        ],
        content,
      });
    }
    default:
      return renderGenericPage(contract);
  }
}

// The aperture ring is the dashboard's signature: one arc per page, colored by
// page type and paired with an accessible title so color is never the only signal.
function apertureRing(pages: DashboardPage[]): string {
  const size = 84;
  const center = size / 2;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const shown = pages.slice(0, 24);

  const segments =
    shown.length === 0
      ? `<circle class="ring-empty" cx="${center}" cy="${center}" r="${radius}" />`
      : shown
          .map((page, index) => {
            const share = circumference / shown.length;
            const gap = shown.length === 1 ? 0 : Math.min(4, share * 0.18);
            const dash = Math.max(share - gap, 1).toFixed(2);
            const rest = (circumference - Number(dash)).toFixed(2);
            const angle = ((360 / shown.length) * index - 90).toFixed(2);
            return `<circle class="seg ${typeClass(page.type)}" cx="${center}" cy="${center}" r="${radius}" stroke-dasharray="${dash} ${rest}" transform="rotate(${angle} ${center} ${center})"><title>${escapeHtml(page.title)} · ${escapeHtml(page.type)} · ${escapeHtml(page.status)}</title></circle>`;
          })
          .join('');

  return `<svg class="aperture" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${shown.length} pages by status">
      ${segments}
      <text class="aperture-count" x="${center}" y="${center + 2}" text-anchor="middle" dominant-baseline="middle">${pages.length}</text>
      <text class="aperture-label" x="${center}" y="${center + 16}" text-anchor="middle">pages</text>
    </svg>`;
}

function dashboardCard(page: DashboardPage): string {
  return `
    <a class="surface page-card" data-page-card href="${escapeHtml(page.href)}">
      ${apertureGlyph(page.type)}
      <span class="type-chip ${typeClass(page.type)}">${escapeHtml(page.type)}</span>
      <span class="card-main">
        <span class="card-title">${escapeHtml(page.title)}</span>
        <span class="card-id">${escapeHtml(page.id)}</span>
      </span>
      <span class="status-chip ${statusClass(page.status)}">${escapeHtml(page.status)}</span>
    </a>
  `;
}

function boardColumn(label: string, pages: DashboardPage[]): string {
  const cards =
    pages.length === 0
      ? '<p class="board-empty">Nothing here yet. Create work with <code>iris bug my-first-bug</code>.</p>'
      : pages.map((page) => dashboardCard(page)).join('');
  return `<div class="board-col"><span class="eyebrow">${escapeHtml(label)}</span>${cards}</div>`;
}

function summaryLine(pages: DashboardPage[]): string {
  if (pages.length === 0) return 'no pages yet';
  return pages.length === 1 ? '1 page' : `${pages.length} pages`;
}

function sourceDetails(label: string, document?: OpenSpecSourceDocument): string {
  if (!document)
    return `<div class="spec-artifact"><span class="status-chip health-warning">missing ${escapeHtml(label)}</span></div>`;
  const operations = document.operations
    .map((operation) => `<span class="pill">${escapeHtml(operation)}</span>`)
    .join('');
  const summary = [
    document.requirements.length > 0 ? `${document.requirements.length} requirements` : '',
    document.scenarios.length > 0 ? `${document.scenarios.length} scenarios` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const isMarkdown = document.format
    ? document.format === 'markdown'
    : document.path.endsWith('.md');
  const body = isMarkdown
    ? `<div class="spec-document">${renderSafeMarkdown(document.raw)}</div>
      <details class="spec-source-details"><summary>Exact source</summary><pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre></details>`
    : `<pre class="spec-source"><code>${escapeHtml(document.raw)}</code></pre>`;
  return `<details class="spec-artifact" data-document-format="${isMarkdown ? 'markdown' : 'yaml'}">
    <summary>${escapeHtml(label)} · <span class="mono spec-path">${escapeHtml(document.path)}</span></summary>
    <div class="spec-meta"><span class="mono">${escapeHtml(summary || 'readable source')}</span><span>${operations}</span></div>
    ${body}
  </details>`;
}

function capabilityCard(capability: OpenSpecCapability, label: string): string {
  const health = capability.document.warnings.some((item) => item.code === 'malformed-spec')
    ? 'invalid'
    : capability.document.warnings.length > 0
      ? 'warning'
      : 'valid';
  return `<article class="surface spec-card">
    <div class="spec-card-header">
      <div><span class="eyebrow">${escapeHtml(label)}</span><h3>${escapeHtml(capability.capability)}</h3></div>
      <span class="status-chip health-${health}">${health}</span>
    </div>
    <span class="mono spec-path">${escapeHtml(capability.path)}</span>
    <div class="spec-meta"><span>${capability.document.requirements.length} requirements</span><span>${capability.document.scenarios.length} scenarios</span></div>
    ${sourceDetails('spec', capability.document)}
  </article>`;
}

function changeCard(change: OpenSpecChange): string {
  const tasks = change.artifacts.tasks?.progress;
  const progress = tasks
    ? `${tasks.complete}/${tasks.total} tasks · ${tasks.open} open`
    : 'tasks unavailable';
  return `<article class="surface spec-card">
    <div class="spec-card-header">
      <div><span class="eyebrow">${escapeHtml(change.lifecycle)} · structured</span><h3>${escapeHtml(change.name)}</h3></div>
      <span class="status-chip health-${escapeHtml(change.health)}">${escapeHtml(change.health)}</span>
    </div>
    <span class="mono spec-path">${escapeHtml(change.path)}</span>
    <div class="spec-meta"><span class="pill">${escapeHtml(change.completeness)}</span><span class="mono">${escapeHtml(progress)}</span></div>
    <div class="spec-artifacts">
      ${sourceDetails('manifest', change.artifacts.manifest)}
      ${sourceDetails('proposal', change.artifacts.proposal)}
      ${sourceDetails('design', change.artifacts.design)}
      ${sourceDetails('tasks', change.artifacts.tasks)}
      ${change.delta_specs.map((capability) => capabilityCard(capability, 'delta spec')).join('')}
    </div>
  </article>`;
}

function warningList(snapshot: OpenSpecSnapshot): string {
  if (snapshot.warnings.length === 0) return '';
  return `<section aria-labelledby="spec-warnings-title">
    <div class="section-heading"><div><span class="eyebrow">parser health</span><h2 id="spec-warnings-title">Warnings</h2></div><span class="status-chip health-warning">${snapshot.warnings.length} warnings</span></div>
    <ul class="surface spec-card spec-list">
      ${snapshot.warnings.map((item) => `<li class="spec-warning"><strong>${escapeHtml(item.code)}</strong> · <code>${escapeHtml(item.path)}</code><br />${escapeHtml(item.message)}</li>`).join('')}
    </ul>
  </section>`;
}

function specView(snapshot: OpenSpecSnapshot): string {
  const changes = [...snapshot.active_changes, ...snapshot.archived_changes];
  const taskProgress = changes.reduce(
    (total, change) => ({
      complete: total.complete + (change.artifacts.tasks?.progress.complete ?? 0),
      open: total.open + (change.artifacts.tasks?.progress.open ?? 0),
    }),
    { complete: 0, open: 0 },
  );
  const supportedCount =
    snapshot.canonical_specs.length + changes.length + snapshot.legacy_archives.length;
  const emptyState = !snapshot.detected
    ? '<article class="surface empty-state"><h2>No OpenSpec workspace detected</h2><p>Add an <code>openspec/</code> workspace, then run <code>iris init</code> or <code>iris render --all</code>. General project documentation is not ingested.</p></article>'
    : supportedCount === 0
      ? '<article class="surface empty-state"><h2>OpenSpec workspace is empty</h2><p>No supported canonical specs, active changes, or archive records were found. Refresh after adding OpenSpec artifacts with <code>iris render --all</code>.</p></article>'
      : '';
  const contextDocuments = [snapshot.context.project, snapshot.context.config].filter(
    (document): document is OpenSpecSourceDocument => Boolean(document),
  );

  return `<div class="spec-stack">
    <section aria-labelledby="spec-overview-title">
      <div class="section-heading"><div><span class="eyebrow">filesystem snapshot</span><h2 id="spec-overview-title">Overview</h2></div><span class="pill">explicit refresh</span></div>
      <div class="spec-overview" aria-label="OpenSpec overview">
        <div class="surface stat-tile"><span class="stat-value">${snapshot.canonical_specs.length}</span><span class="stat-label">canonical</span></div>
        <div class="surface stat-tile"><span class="stat-value">${snapshot.active_changes.length}</span><span class="stat-label">active changes</span></div>
        <div class="surface stat-tile"><span class="stat-value">${snapshot.archived_changes.length + snapshot.legacy_archives.length}</span><span class="stat-label">archived</span></div>
        <div class="surface stat-tile"><span class="stat-value">${taskProgress.complete}</span><span class="stat-label">tasks complete</span></div>
        <div class="surface stat-tile"><span class="stat-value">${taskProgress.open}</span><span class="stat-label">tasks open</span></div>
      </div>
      <p class="mono">Snapshot refreshes during <code>iris init</code> or <code>iris render --all</code>. OpenSpec CLI is not required.</p>
    </section>
    ${emptyState}
    ${contextDocuments.length === 0 ? '' : `<section aria-labelledby="spec-context-title"><div class="section-heading"><div><span class="eyebrow">workspace identity</span><h2 id="spec-context-title">Project context</h2></div></div><div class="spec-grid">${contextDocuments.map((document) => `<article class="surface spec-card"><h3>${escapeHtml(document.title)}</h3>${sourceDetails('source', document)}</article>`).join('')}</div></section>`}
    <section aria-labelledby="canonical-specs-title">
      <div class="section-heading"><div><span class="eyebrow">source of truth</span><h2 id="canonical-specs-title">Canonical specs</h2></div><span class="pill">${snapshot.canonical_specs.length}</span></div>
      ${snapshot.canonical_specs.length === 0 ? '<div class="surface empty-state">No canonical specs found.</div>' : `<div class="spec-grid">${snapshot.canonical_specs.map((capability) => capabilityCard(capability, 'canonical')).join('')}</div>`}
    </section>
    <section aria-labelledby="active-changes-title">
      <div class="section-heading"><div><span class="eyebrow">current movement</span><h2 id="active-changes-title">Active changes</h2></div><span class="pill">${snapshot.active_changes.length}</span></div>
      ${snapshot.active_changes.length === 0 ? '<div class="surface empty-state">No active changes found.</div>' : `<div class="spec-grid">${snapshot.active_changes.map(changeCard).join('')}</div>`}
    </section>
    <section aria-labelledby="archive-title">
      <div class="section-heading"><div><span class="eyebrow">history</span><h2 id="archive-title">Archive</h2></div><span class="pill">${snapshot.archived_changes.length + snapshot.legacy_archives.length}</span></div>
      ${snapshot.archived_changes.length === 0 && snapshot.legacy_archives.length === 0 ? '<div class="surface empty-state">No archived changes found.</div>' : `<div class="spec-grid">${snapshot.archived_changes.map(changeCard).join('')}${snapshot.legacy_archives.map((document) => `<article class="surface spec-card"><div class="spec-card-header"><div><span class="eyebrow">archived · legacy</span><h3>${escapeHtml(document.title)}</h3></div><span class="status-chip">legacy</span></div>${sourceDetails('archived source', document)}</article>`).join('')}</div>`}
    </section>
    ${warningList(snapshot)}
  </div>`;
}

export function dashboardHtml(
  projectName = 'iris project',
  pages: DashboardPage[] = [],
  projectDocs: string[] = [],
  openSpec: OpenSpecSnapshot = {
    version: 1,
    detected: false,
    generated_at: null,
    context: {},
    canonical_specs: [],
    active_changes: [],
    archived_changes: [],
    legacy_archives: [],
    warnings: [],
  },
): string {
  const activeCount = pages.filter((page) => !['done', 'archived'].includes(page.status)).length;
  const archivedCount = pages.filter((page) => page.status === 'archived').length;
  const briefing =
    'Agent-first workspace ready. Create intentional visual content with the installed Iris skill and explicit content commands.';
  const listCards =
    pages.length === 0
      ? `<article class="surface empty-state"><h2>No pages yet</h2><p>Create one with <code>iris bug my-first-bug</code>, then run <code>iris render --all</code>.</p></article>`
      : pages.map((page) => dashboardCard(page)).join('');

  const columns = [
    boardColumn(
      'Draft',
      pages.filter((page) => page.status === 'draft'),
    ),
    boardColumn(
      'Active',
      pages.filter((page) => !['draft', 'done', 'archived'].includes(page.status)),
    ),
    boardColumn(
      'Done',
      pages.filter((page) => page.status === 'done'),
    ),
    boardColumn(
      'Archived',
      pages.filter((page) => page.status === 'archived'),
    ),
  ].join('');

  const projectStrip =
    projectDocs.length === 0
      ? `<section class="surface empty-state"><h2>Project docs are not initialized</h2><p>Create the managed overview, HLD, LLD, ERD, commands, and decisions pages with <code>iris init</code>.</p></section>`
      : `<section class="surface project-strip">
        <span class="eyebrow">project docs</span>
        <nav class="project-links">
          ${projectDocs
            .map((name) => `<a href="./project/${escapeHtml(name)}.html">${escapeHtml(name)}</a>`)
            .join('\n          ')}
        </nav>
      </section>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(projectName)} · iris dashboard</title>
    <link rel="stylesheet" href="./design/tokens.css" />
    <link rel="stylesheet" href="./design/components/base.css" />
  </head>
  <body>
    <main class="page-shell">
      <header class="header">
        <div class="topbar">
          <span class="eyebrow">◔ iris · ${escapeHtml(projectName)}</span>
          ${themeToggleButton()}
        </div>
        <section class="briefing-hero surface" aria-labelledby="briefing-title">
          ${apertureRing(pages)}
          <div class="hero-copy">
            <span class="eyebrow">what this repo is</span>
            <h1 id="briefing-title">${escapeHtml(projectName)}</h1>
            <p class="hero-line">${escapeHtml(briefing)}</p>
            <p class="hero-meta"><span>run: <code>pnpm dev</code></span><span>test: <code>pnpm test</code></span><span>entry: <code>src/</code> · <code>docs/</code></span></p>
          </div>
        </section>
      </header>

      <nav class="surface tabs primary-tabs" role="tablist" aria-label="dashboard sections" data-tabs="dashboard-primary">
        <button id="dashboard-tab-work" role="tab" class="tab-button" aria-controls="dashboard-panel-work" aria-selected="true" tabindex="0" data-tab-id="work">Work</button>
        <button id="dashboard-tab-spec" role="tab" class="tab-button" aria-controls="dashboard-panel-spec" aria-selected="false" tabindex="-1" data-tab-id="spec">Spec</button>
      </nav>

      <section id="dashboard-panel-work" class="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab-work" data-tab-group="dashboard-primary" data-tab-id="work">
      <div class="dashboard-stack">
        <section class="health-strip" aria-label="repository health">
          <a class="surface stat-tile" href="#work"><span class="stat-value">${pages.length}</span><span class="stat-label">pages</span></a>
          <a class="surface stat-tile" href="#work"><span class="stat-value">${archivedCount}</span><span class="stat-label">archived</span></a>
          <a class="surface stat-tile" href="#work"><span class="stat-value">${activeCount}</span><span class="stat-label">active</span></a>
          <a class="surface stat-tile" href="#project-docs"><span class="stat-value">${projectDocs.length}</span><span class="stat-label">project docs</span></a>
        </section>

        <section aria-labelledby="architecture-title">
          <div class="section-heading"><div><span class="eyebrow">system shape</span><h2 id="architecture-title">Architecture</h2></div><span class="pill">HLD</span></div>
          <div class="surface architecture-pane">
            <div class="empty-state"><h2>No architecture diagram is projected here yet</h2><p>Mermaid fences render inside Markdown after <code>iris vendor</code>. Automatic HLD projection into this pane remains separate work; <a href="./project/hld.html">open the HLD page</a>.</p></div>
          </div>
        </section>

        <section class="work-surface" id="work" aria-labelledby="work-title">
          <div class="section-heading"><div><span class="eyebrow">current movement</span><h2 id="work-title">Work</h2></div><span class="mono">${escapeHtml(summaryLine(pages))}</span></div>
          <div class="surface toolbar">
            <div class="tabs" role="tablist" aria-label="work layout" data-tabs="work-layout">
              <button id="work-layout-tab-list" role="tab" class="tab-button" aria-controls="work-layout-panel-list" aria-selected="true" tabindex="0" data-tab-id="list">List</button>
              <button id="work-layout-tab-board" role="tab" class="tab-button" aria-controls="work-layout-panel-board" aria-selected="false" tabindex="-1" data-tab-id="board">Board</button>
            </div>
            <label class="filter-wrap"><span class="eyebrow">filter</span><input class="filter-input" type="search" data-filter-input placeholder="Filter pages…" aria-label="Filter pages" /><kbd>/</kbd></label>
          </div>

          <section id="work-layout-panel-list" class="list" role="tabpanel" aria-labelledby="work-layout-tab-list" data-tab-group="work-layout" data-tab-id="list" data-dashboard-list>
            ${listCards}
          </section>

          <section id="work-layout-panel-board" class="board" role="tabpanel" aria-labelledby="work-layout-tab-board" data-tab-group="work-layout" data-tab-id="board" data-dashboard-board hidden>
            ${columns}
          </section>
        </section>

        <section id="project-docs" aria-labelledby="project-docs-title">
          <div class="section-heading"><div><span class="eyebrow">reference shelf</span><h2 id="project-docs-title">Project docs</h2></div></div>
          ${projectStrip}
        </section>
      </div>
      </section>

      <section id="dashboard-panel-spec" class="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab-spec" data-tab-group="dashboard-primary" data-tab-id="spec" hidden>
        ${specView(openSpec)}
      </section>
      <footer class="footer"><span>generated by iris · works offline from file://</span><span><kbd>/</kbd> filter · <kbd>t</kbd> theme · <kbd>↑</kbd><kbd>↓</kbd> move</span></footer>
    </main>
    <script defer src="./design/vendor/mermaid.min.js"></script>
    <script defer src="./design/components/base.js"></script>
  </body>
</html>`.replace(/[ \t]+$/gm, '');
}

export function projectPlaceholderHtml(name: string): string {
  const title = name.charAt(0).toUpperCase() + name.slice(1);
  return `<!doctype html>
<html lang="en" data-iris-managed>
 <head>
   <meta charset="utf-8" />
   <meta name="viewport" content="width=device-width, initial-scale=1" />
   <title>${escapeHtml(title)} · iris</title>
   <link rel="stylesheet" href="../design/tokens.css" />
   <link rel="stylesheet" href="../design/components/base.css" />
 </head>
 <body>
   <main class="page-shell">
     <header class="header">
       <div class="topbar">
         <nav class="crumbs"><a data-iris-nav href="../index.html">&larr; dashboard</a></nav>
         ${themeToggleButton()}
       </div>
       <div class="header-bar">
         <div>
           <div class="page-title-row">
             ${apertureGlyph('report')}
             <div class="type-chip tp-report">project doc</div>
           </div>
           <h1>${escapeHtml(title)}</h1>
         </div>
         <span class="status-chip st-draft">status: pending</span>
       </div>
     </header>
     <article class="surface empty-state">
       <h2>This page is not generated yet</h2>
       <p>Create intentional content with the installed Iris skill and content commands, then refresh with <code>iris render --all</code>. Rendered pages live on the <a href="../index.html">dashboard</a>.</p>
     </article>
     <footer class="footer">managed by iris · regenerated by iris init or iris update</footer>
   </main>
   <script defer src="../design/components/base.js"></script>
 </body>
</html>
`;
}
