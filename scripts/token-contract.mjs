export const REQUIRED_TOKENS = [
  'bg',
  'surface-1',
  'surface-2',
  'surface-3',
  'line-1',
  'text-1',
  'text-2',
  'text-3',
  'accent',
  'accent-text',
  'accent-ink',
  'type-report',
  'type-feature',
  'type-bug',
  'type-idea',
  'type-plan',
  'type-research',
  'topbar-bg',
  'nav-bg',
  'nav-text',
  'nav-active-bg',
  'nav-active-text',
  'accent-soft',
  'ok',
  'warn',
  'danger',
  'info',
  'font-display',
  'font-sans',
  'font-mono',
  'size-1',
  'size-2',
  'size-3',
  'size-4',
  'size-5',
  'size-6',
  'leading-tight',
  'leading-body',
  'radius-full',
  'nav-width',
  'nav-rail',
  'duration-1',
  'duration-2',
  'duration-3',
  'easing',
];

const THEME_REQUIRED_TOKENS = [
  'bg',
  'surface-1',
  'surface-2',
  'surface-3',
  'line-1',
  'text-1',
  'text-2',
  'text-3',
  'accent',
  'accent-text',
  'accent-ink',
  'type-report',
  'type-feature',
  'type-bug',
  'type-idea',
  'type-plan',
  'type-research',
  'topbar-bg',
  'nav-bg',
  'nav-text',
  'nav-active-bg',
  'nav-active-text',
  'accent-soft',
  'ok',
  'warn',
  'danger',
  'info',
];

const CONTRAST_PAIRS = [
  ['text-1', 'bg'],
  ['text-1', 'surface-1'],
  ['text-1', 'surface-2'],
  ['text-1', 'surface-3'],
  ['text-2', 'bg'],
  ['text-2', 'surface-1'],
  ['text-2', 'surface-2'],
  ['text-2', 'surface-3'],
  ['accent-text', 'bg'],
  ['accent-text', 'surface-1'],
  ['type-report', 'surface-1'],
  ['type-feature', 'surface-1'],
  ['type-bug', 'surface-1'],
  ['type-idea', 'surface-1'],
  ['type-plan', 'surface-1'],
  ['type-research', 'surface-1'],
  ['nav-text', 'nav-bg'],
  ['nav-active-text', 'nav-bg'],
  ['text-1', 'nav-bg'],
  ['ok', 'surface-1'],
  ['warn', 'surface-1'],
  ['danger', 'surface-1'],
  ['info', 'surface-1'],
];

// WCAG 1.4.11: the accent draws buttons, the active navigation rail, and focus
// rings, so its edge against every surface it lands on is a control boundary.
const CONTROL_BOUNDARY_PAIRS = [
  ['accent', 'bg'],
  ['accent', 'surface-1'],
  ['accent', 'surface-2'],
];

// A card border is not a control, so no accessibility criterion governs it. This
// floor exists so that "the boundary is visible" is measurable rather than a
// matter of taste, and it is reported under its own name for that reason.
const BORDER_PAIRS = [
  ['line-1', 'bg'],
  ['line-1', 'surface-1'],
  ['line-1', 'surface-2'],
];

const TEXT_RATIO = 4.5;
const CONTROL_BOUNDARY_RATIO = 3;
const BORDER_VISIBILITY_RATIO = 1.45;

function declarations(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim(),
    ]),
  );
}

export function parseTokenThemes(css) {
  const root = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const light = css.match(/\[data-theme=['"]light['"]\]\s*\{([\s\S]*?)\}/)?.[1] ?? '';
  const darkTokens = declarations(root);
  const lightOverrides = declarations(light);
  return {
    dark: darkTokens,
    light: { ...darkTokens, ...lightOverrides },
    lightOverrides,
  };
}

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const normalized = hex.slice(1, 7);
  const channels = normalized.match(/../g)?.map((value) => channel(Number.parseInt(value, 16)));
  if (!channels || channels.length !== 3) return undefined;
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground, background) {
  if (!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(foreground)) return undefined;
  if (!/^#[0-9a-f]{6}$/i.test(background)) return undefined;
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  if (foregroundLuminance === undefined || backgroundLuminance === undefined) return undefined;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateTokenContract(css, referenceText = '') {
  const errors = [];
  const { dark, light, lightOverrides } = parseTokenThemes(css);

  for (const token of REQUIRED_TOKENS) {
    if (!(token in dark)) errors.push(`missing dark token --${token}`);
  }
  for (const token of THEME_REQUIRED_TOKENS) {
    if (!(token in lightOverrides)) errors.push(`missing light override --${token}`);
  }

  const declared = new Set(Object.keys(dark));
  for (const match of `${css}\n${referenceText}`.matchAll(/var\(--([a-z0-9-]+)\)/gi)) {
    if (!declared.has(match[1])) errors.push(`undeclared token reference --${match[1]}`);
  }

  const checks = [
    { pairs: CONTRAST_PAIRS, minimum: TEXT_RATIO, label: 'contrast' },
    { pairs: CONTROL_BOUNDARY_PAIRS, minimum: CONTROL_BOUNDARY_RATIO, label: 'control boundary' },
    { pairs: BORDER_PAIRS, minimum: BORDER_VISIBILITY_RATIO, label: 'border visibility floor' },
  ];

  for (const [themeName, theme] of Object.entries({ dark, light })) {
    for (const { pairs, minimum, label } of checks) {
      for (const [foregroundName, backgroundName] of pairs) {
        const foreground = theme[foregroundName];
        const background = theme[backgroundName];
        const ratio = contrastRatio(foreground, background);
        if (ratio === undefined) {
          errors.push(
            `${themeName} ${label} pair --${foregroundName}/--${backgroundName} is not opaque hex`,
          );
        } else if (ratio < minimum) {
          errors.push(
            `${themeName} ${label} --${foregroundName} on --${backgroundName} is ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
          );
        }
      }
    }
  }

  return [...new Set(errors)];
}
