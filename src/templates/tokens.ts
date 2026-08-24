/**
 * Iris Electric v2.0 token block — iris's native design system — followed by
 * the workspace extension block for the surfaces the base system does not
 * cover. A measured contrast floor moved a handful of lightness values;
 * `docs/design-system.md` records each one. Themes switch on `data-theme`,
 * which the config file, the stored preference, and the validator all use.
 */
export const TOKENS_CSS = `:root {
  /* surfaces */
  --background: oklch(0.15 0.02 285);
  --foreground: oklch(0.95 0.01 285);
  --card: oklch(0.19 0.025 285);
  --card-2: oklch(0.23 0.03 285);
  --code-bg: oklch(0.13 0.02 285);
  --border: oklch(0.355 0.03 285);
  --muted: oklch(0.65 0.02 285);

  /* brand + accents */
  --primary: oklch(0.65 0.25 293);
  --primary-fg: oklch(0.98 0.01 293);
  --accent-1: oklch(0.8 0.15 195);
  --accent-2: oklch(0.82 0.16 85);
  --accent-3: oklch(0.85 0.2 130);
  --accent-4: oklch(0.7 0.2 350);

  /* status */
  --success: oklch(0.75 0.17 155);
  --warning: oklch(0.8 0.16 75);
  --danger: oklch(0.65 0.22 25);
  --info: var(--accent-1);

  /* effects */
  --glow: 0 0 24px oklch(0.65 0.25 293 / 0.25);
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.3);

  /* shape & type */
  --radius: 12px;
  --radius-sm: 8px;
  --radius-pill: 999px;
  --font-sans: ui-sans-serif, -apple-system, 'SF Pro Text', 'Segoe UI', Inter, Roboto, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;

  /* iris extension — navigation shell */
  --nav-bg: oklch(0.13 0.02 285);
  --nav-text: var(--muted);
  --nav-active-bg: color-mix(in oklch, var(--primary) 18%, transparent);
  --nav-active-text: var(--primary);
  --selected: color-mix(in oklch, var(--primary) 14%, transparent);
  --hover: var(--card-2);
  --backdrop: oklch(0.1 0.02 285 / 0.75);

  /* iris extension — record encoding */
  --type-report: var(--accent-1);
  --type-feature: var(--accent-3);
  --type-bug: var(--danger);
  --type-idea: var(--accent-4);
  --type-plan: var(--accent-2);
  --type-research: var(--primary);
  --priority-urgent: var(--danger);
  --priority-high: var(--warning);
  --priority-medium: var(--info);
  --priority-low: var(--muted);

  /* iris extension — the code block is dark in both themes, so these are constant */
  --code-fg: oklch(0.92 0.01 260);
  --code-muted: oklch(0.68 0.02 285);
  --code-comment: oklch(0.63 0.02 285);

  /* iris extension — Mermaid cannot read custom properties, so it gets sRGB fallbacks */
  --mmd-primary: #2a2438;
  --mmd-primary-text: #efeef5;
  --mmd-primary-border: #8b5cf6;
  --mmd-line: #5b5570;
  --mmd-secondary: #173b47;
  --mmd-tertiary: #3d3117;
  --mmd-note-bg: #3d3117;
  --mmd-note-text: #efeef5;
  --mmd-actor-border: #8b5cf6;
  --mmd-signal: #9b96ad;
  --mmd-focus: #8b5cf6;
  --mmd-svc: #22d3ee;
  --mmd-db: #fbbf24;
  --mmd-q: #a3e635;
  --mmd-ext: #f472b6;
  --mmd-err: #f87171;

  /* iris extension — type, space, motion, and layout ramps */
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
  --border-1: 1px solid var(--border);
  --duration-1: 120ms;
  --duration-2: 220ms;
  --duration-3: 320ms;
  --easing: cubic-bezier(0.22, 0.61, 0.36, 1);
  --nav-width: 15rem;
  --nav-rail: 3.5rem;
}

[data-theme='light'] {
  --background: oklch(0.98 0.005 285);
  --foreground: oklch(0.2 0.02 285);
  --card: oklch(1 0 0);
  --card-2: oklch(0.96 0.01 285);
  --code-bg: oklch(0.24 0.02 285);
  --border: oklch(0.825 0.01 285);
  --muted: oklch(0.5 0.02 285);

  --primary: oklch(0.55 0.25 293);
  --primary-fg: oklch(0.98 0.01 293);
  --accent-1: oklch(0.54 0.13 220);
  --accent-2: oklch(0.57 0.15 65);
  --accent-3: oklch(0.54 0.17 140);
  --accent-4: oklch(0.59 0.21 350);

  --success: oklch(0.54 0.15 155);
  --warning: oklch(0.57 0.15 70);
  --danger: oklch(0.55 0.21 25);
  --info: oklch(0.54 0.13 220);

  --glow: 0 4px 20px oklch(0.55 0.25 293 / 0.12);
  --shadow-card: 0 1px 3px oklch(0 0 0 / 0.08);

  --nav-bg: var(--card);
  --nav-text: var(--muted);
  --nav-active-bg: color-mix(in oklch, var(--primary) 12%, transparent);
  --nav-active-text: var(--primary);
  --selected: color-mix(in oklch, var(--primary) 10%, transparent);
  --hover: var(--card-2);
  --backdrop: oklch(0.2 0.02 285 / 0.4);

  --mmd-primary: #f1edfb;
  --mmd-primary-text: #28243a;
  --mmd-line: #a8a3bd;
  --mmd-secondary: #e3f4fa;
  --mmd-tertiary: #fbf3dc;
  --mmd-note-bg: #fbf3dc;
  --mmd-note-text: #28243a;
  --mmd-signal: #6b6683;
}

[data-nav='collapsed'] {
  --nav-width: var(--nav-rail);
}

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
}

:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Print is a third palette rather than a theme, so it lives with the others. */
@media print {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0 0 0);
    --card: oklch(1 0 0);
    --card-2: oklch(0.96 0 0);
    --code-bg: oklch(0.96 0 0);
    --code-fg: oklch(0.15 0 0);
    --code-muted: oklch(0.45 0 0);
    --code-comment: oklch(0.45 0 0);
    --border: oklch(0.85 0 0);
    --muted: oklch(0.45 0 0);
    --shadow-card: none;
    --glow: none;
  }
}
`;
