export const TOKENS_CSS = `:root {
  --bg: #0e1117;
  --surface-1: #151923;
  --surface-2: #1b2030;
  --surface-3: #242a3b;
  --line-1: #2a3143;
  --text-1: #e7eaf2;
  --text-2: #a4adc2;
  --text-3: #7a8399;
  --accent: #6f8cff;
  --accent-text: #93a8ff;
  --accent-ink: #0b0e14;
  --accent-soft: #6f8cff1f;
  --nav-bg: #0a0d13;
  --nav-text: #a4adc2;
  --nav-active-bg: #6f8cff1f;
  --nav-active-text: #c3cfff;
  --type-report: #5cb8f0;
  --type-feature: #4fc98c;
  --type-bug: #ef6a6a;
  --type-idea: #a78bfa;
  --type-plan: #f2b24e;
  --type-research: #2dd4bf;
  --type-report-soft: #5cb8f026;
  --type-feature-soft: #4fc98c26;
  --type-bug-soft: #ef6a6a26;
  --type-idea-soft: #a78bfa26;
  --type-plan-soft: #f2b24e26;
  --type-research-soft: #2dd4bf26;
  --ok: #4fc98c;
  --warn: #f0913e;
  --danger: #ef6a6a;
  --info: #5cb8f0;
  --ok-soft: #4fc98c26;
  --warn-soft: #f0913e26;
  --danger-soft: #ef6a6a26;
  --info-soft: #5cb8f026;
  --selected: #6f8cff1a;
  --hover: #242a3b;
  --backdrop: #05070bcc;
  --priority-urgent: #ef6a6a;
  --priority-high: #f0913e;
  --priority-medium: #5cb8f0;
  --priority-low: #a4adc2;
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
  --bg: #f4f5f7;
  --surface-1: #ffffff;
  --surface-2: #f1f2f4;
  --surface-3: #e4e6ea;
  --line-1: #dfe1e6;
  --text-1: #172b4d;
  --text-2: #44546f;
  --text-3: #626f86;
  --accent: #3b5bdb;
  --accent-text: #2f4ac0;
  --accent-ink: #ffffff;
  --accent-soft: #3b5bdb14;
  --nav-bg: #ffffff;
  --nav-text: #44546f;
  --nav-active-bg: #3b5bdb14;
  --nav-active-text: #2f4ac0;
  --type-report: #126b9b;
  --type-feature: #16754a;
  --type-bug: #b62b32;
  --type-idea: #6941c6;
  --type-plan: #84530b;
  --type-research: #0f766e;
  --type-report-soft: #126b9b18;
  --type-feature-soft: #16754a18;
  --type-bug-soft: #b62b3218;
  --type-idea-soft: #6941c618;
  --type-plan-soft: #84530b18;
  --type-research-soft: #0f766e18;
  --ok: #16754a;
  --warn: #954708;
  --danger: #b62b32;
  --info: #126b9b;
  --ok-soft: #16754a18;
  --warn-soft: #95470818;
  --danger-soft: #b62b3218;
  --info-soft: #126b9b18;
  --selected: #3b5bdb14;
  --hover: #f1f2f4;
  --backdrop: #172b4d66;
  --priority-urgent: #b62b32;
  --priority-high: #954708;
  --priority-medium: #126b9b;
  --priority-low: #44546f;
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
