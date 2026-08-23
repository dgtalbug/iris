export const REQUIRED_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-2',
  'code-bg',
  'border',
  'muted',
  'primary',
  'primary-fg',
  'accent-1',
  'accent-2',
  'accent-3',
  'accent-4',
  'success',
  'warning',
  'danger',
  'info',
  'glow',
  'shadow-card',
  'radius',
  'radius-sm',
  'radius-pill',
  'font-sans',
  'font-mono',
  'nav-bg',
  'nav-text',
  'nav-active-bg',
  'nav-active-text',
  'selected',
  'hover',
  'backdrop',
  'type-report',
  'type-feature',
  'type-bug',
  'type-idea',
  'type-plan',
  'type-research',
  'priority-urgent',
  'priority-high',
  'priority-medium',
  'priority-low',
  'code-fg',
  'code-muted',
  'code-comment',
  'mmd-primary',
  'mmd-primary-text',
  'mmd-primary-border',
  'mmd-line',
  'mmd-secondary',
  'mmd-tertiary',
  'mmd-note-bg',
  'mmd-note-text',
  'mmd-actor-border',
  'mmd-signal',
  'mmd-focus',
  'mmd-svc',
  'mmd-db',
  'mmd-q',
  'mmd-ext',
  'mmd-err',
  'size-1',
  'size-2',
  'size-3',
  'size-4',
  'size-5',
  'size-6',
  'leading-tight',
  'leading-body',
  'weight-regular',
  'weight-medium',
  'weight-bold',
  'space-1',
  'space-2',
  'space-3',
  'space-4',
  'space-5',
  'space-6',
  'border-1',
  'duration-1',
  'duration-2',
  'duration-3',
  'easing',
  'nav-width',
  'nav-rail',
];

const THEME_REQUIRED_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-2',
  'code-bg',
  'border',
  'muted',
  'primary',
  'primary-fg',
  'accent-1',
  'accent-2',
  'accent-3',
  'accent-4',
  'success',
  'warning',
  'danger',
  'info',
  'glow',
  'shadow-card',
  'nav-bg',
  'nav-active-bg',
];

const CONTRAST_PAIRS = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'card-2'],
  ['muted', 'background'],
  ['muted', 'card'],
  ['muted', 'card-2'],
  ['primary', 'background'],
  ['primary', 'card'],
  ['type-report', 'card'],
  ['type-feature', 'card'],
  ['type-bug', 'card'],
  ['type-idea', 'card'],
  ['type-plan', 'card'],
  ['type-research', 'card'],
  ['priority-urgent', 'card'],
  ['priority-high', 'card'],
  ['priority-medium', 'card'],
  ['priority-low', 'card'],
  ['success', 'card'],
  ['warning', 'card'],
  ['danger', 'card'],
  ['info', 'card'],
  ['nav-text', 'nav-bg'],
  ['nav-active-text', 'nav-bg'],
  ['foreground', 'nav-bg'],
  ['code-fg', 'code-bg'],
  ['code-muted', 'code-bg'],
  ['code-comment', 'code-bg'],
];

// WCAG 1.4.11: the primary draws buttons, the active navigation entry, and focus
// rings, so its edge against every surface it lands on is a control boundary.
const CONTROL_BOUNDARY_PAIRS = [
  ['primary', 'background'],
  ['primary', 'card'],
  ['primary', 'card-2'],
];

// A card border is not a control, so no accessibility criterion governs it. This
// floor exists so that "the boundary is visible" is measurable rather than a
// matter of taste, and it is reported under its own name for that reason.
const BORDER_PAIRS = [
  ['border', 'background'],
  ['border', 'card'],
  ['border', 'card-2'],
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
  const root = css.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const light = css.match(/\[data-theme=['"]light['"]\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  const darkTokens = declarations(root);
  const lightOverrides = declarations(light);
  return {
    dark: darkTokens,
    light: { ...darkTokens, ...lightOverrides },
    lightOverrides,
  };
}

/** Follows `var(--x)` chains within one theme; cycles and dead ends resolve to undefined. */
function resolveToken(value, theme, seen = new Set()) {
  if (typeof value !== 'string') return undefined;
  const alias = value.trim().match(/^var\(\s*--([a-z0-9-]+)\s*\)$/i);
  if (!alias) return value.trim();
  if (seen.has(alias[1])) return undefined;
  seen.add(alias[1]);
  return resolveToken(theme[alias[1]], theme, seen);
}

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function linearFromHex(hex) {
  const channels = hex
    .slice(1, 7)
    .match(/../g)
    ?.map((value) => channel(Number.parseInt(value, 16)));
  return channels && channels.length === 3 ? channels : undefined;
}

/** OKLab → linear sRGB (Ottosson's matrices); components may fall outside 0..1. */
function linearFromOklch(lightness, chroma, hue) {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const GAMUT_EPSILON = 0.0001;

function inGamut(channels) {
  return channels.every((value) => value >= -GAMUT_EPSILON && value <= 1 + GAMUT_EPSILON);
}

/**
 * CSS Color 4 gamut mapping: hold lightness and hue, reduce chroma until the
 * color fits sRGB. Clamping channels instead would overstate the luminance of
 * out-of-gamut tokens, and a browser renders the reduced-chroma color, not the
 * clamped one.
 */
function mapIntoGamut(lightness, chroma, hue) {
  const direct = linearFromOklch(lightness, chroma, hue);
  if (inGamut(direct)) return direct.map((value) => Math.min(1, Math.max(0, value)));

  let low = 0;
  let high = chroma;
  for (let step = 0; step < 40; step += 1) {
    const middle = (low + high) / 2;
    if (inGamut(linearFromOklch(lightness, middle, hue))) low = middle;
    else high = middle;
  }
  return linearFromOklch(lightness, low, hue).map((value) => Math.min(1, Math.max(0, value)));
}

function number(text) {
  const trimmed = text.trim();
  const value = Number.parseFloat(trimmed);
  if (Number.isNaN(value)) return undefined;
  return trimmed.endsWith('%') ? value / 100 : value;
}

/**
 * Returns linear-sRGB channels plus whether the color carries alpha. Understands
 * the two notations the token block uses: `oklch()` and hex.
 */
export function parseColor(value) {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();

  const oklch = text.match(/^oklch\(\s*([^\s/]+)\s+([^\s/]+)\s+([^\s/)]+)\s*(?:\/\s*([^)]+))?\)$/i);
  if (oklch) {
    const lightness = number(oklch[1]);
    const chroma = number(oklch[2]);
    const hue = Number.parseFloat(oklch[3]);
    if (lightness === undefined || chroma === undefined || Number.isNaN(hue)) return undefined;
    const alpha = oklch[4] === undefined ? 1 : (number(oklch[4]) ?? 1);
    return { channels: mapIntoGamut(lightness, chroma, hue), opaque: alpha >= 1 };
  }

  if (/^#[0-9a-f]{6}$/i.test(text)) {
    const channels = linearFromHex(text);
    return channels ? { channels, opaque: true } : undefined;
  }

  if (/^#[0-9a-f]{8}$/i.test(text)) {
    const channels = linearFromHex(text);
    const alpha = Number.parseInt(text.slice(7, 9), 16) / 255;
    return channels ? { channels, opaque: alpha >= 1 } : undefined;
  }

  return undefined;
}

function luminance(channels) {
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground, background, theme = {}) {
  const front = parseColor(resolveToken(foreground, theme));
  const back = parseColor(resolveToken(background, theme));
  if (!front || !back || !back.opaque) return undefined;
  const lighter = Math.max(luminance(front.channels), luminance(back.channels));
  const darker = Math.min(luminance(front.channels), luminance(back.channels));
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
        const ratio = contrastRatio(theme[foregroundName], theme[backgroundName], theme);
        if (ratio === undefined) {
          errors.push(
            `${themeName} ${label} pair --${foregroundName}/--${backgroundName} is not an opaque color`,
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
