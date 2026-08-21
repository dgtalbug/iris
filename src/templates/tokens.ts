export const TOKENS_CSS = `:root {
  --bg: #0d1220;
  --surface-1: #141b2d;
  --surface-2: #1c2540;
  --surface-3: #26314f;
  --line-1: #2b3757;
  --text-1: #f2f5fc;
  --text-2: #b6c2dc;
  --text-3: #8e9bb8;
  --accent: #7d9bff;
  --accent-text: #a8bcff;
  --accent-ink: #08101f;
  --accent-soft: #7d9bff26;
  --nav-bg: #090d18;
  --nav-text: #b6c2dc;
  --nav-active-bg: #7d9bff26;
  --nav-active-text: #cfd9ff;
  --type-report: #5ec8ff;
  --type-feature: #3fe39b;
  --type-bug: #ff8080;
  --type-idea: #c0a5ff;
  --type-plan: #ffc65c;
  --type-research: #3ae5d0;
  --type-report-soft: #5ec8ff26;
  --type-feature-soft: #3fe39b26;
  --type-bug-soft: #ff808026;
  --type-idea-soft: #c0a5ff26;
  --type-plan-soft: #ffc65c26;
  --type-research-soft: #3ae5d026;
  --ok: #3fe39b;
  --warn: #ffa64d;
  --danger: #ff8080;
  --info: #5ec8ff;
  --ok-soft: #3fe39b26;
  --warn-soft: #ffa64d26;
  --danger-soft: #ff808026;
  --info-soft: #5ec8ff26;
  --selected: #7d9bff1f;
  --hover: #26314f;
  --backdrop: #050810cc;
  --priority-urgent: #ff8080;
  --priority-high: #ffa64d;
  --priority-medium: #5ec8ff;
  --priority-low: #b6c2dc;
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
  --nav-width: 15rem;
  --nav-rail: 3.5rem;
}

[data-theme='light'] {
  --bg: #eef1f7;
  --surface-1: #ffffff;
  --surface-2: #e7ebf3;
  --surface-3: #d9dfeb;
  --line-1: #cdd5e4;
  --text-1: #0f1b33;
  --text-2: #3c4a66;
  --text-3: #5a688a;
  --accent: #3450e0;
  --accent-text: #2440c8;
  --accent-ink: #ffffff;
  --accent-soft: #3450e014;
  --nav-bg: #ffffff;
  --nav-text: #3c4a66;
  --nav-active-bg: #3450e014;
  --nav-active-text: #2440c8;
  --type-report: #0a68a8;
  --type-feature: #0a7346;
  --type-bug: #c2262e;
  --type-idea: #6435d4;
  --type-plan: #8a5200;
  --type-research: #0a7268;
  --type-report-soft: #0a68a818;
  --type-feature-soft: #0a734618;
  --type-bug-soft: #c2262e18;
  --type-idea-soft: #6435d418;
  --type-plan-soft: #8a520018;
  --type-research-soft: #0a726818;
  --ok: #0a7346;
  --warn: #9a4a00;
  --danger: #c2262e;
  --info: #0a68a8;
  --ok-soft: #0a734618;
  --warn-soft: #9a4a0018;
  --danger-soft: #c2262e18;
  --info-soft: #0a68a818;
  --selected: #3450e014;
  --hover: #e7ebf3;
  --backdrop: #0f1b3366;
  --priority-urgent: #c2262e;
  --priority-high: #9a4a00;
  --priority-medium: #0a68a8;
  --priority-low: #3c4a66;
  --elevation-1: 0 1px 2px #091e4214, 0 0 1px #091e4224;
}

[data-nav='collapsed'] {
  --nav-width: var(--nav-rail);
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
