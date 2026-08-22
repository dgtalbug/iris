import { icons as lucideIcons } from 'lucide';

/**
 * Lucide icons are serialised to inline SVG here, at generation time, rather than
 * created by a browser script: a published artifact must contain no script or
 * resource reference, and generated pages must stay readable without JavaScript.
 */

type IconAttributes = Readonly<Record<string, string | number>>;
type IconNode = readonly [string, IconAttributes, (readonly IconNode[])?];

/** iris's semantic names mapped onto Vision's pinned Lucide set (§5, §7). */
const ICON_NAMES = {
  brand: 'radar',

  overview: 'layout-dashboard',
  work: 'kanban',
  spec: 'scroll-text',
  research: 'flask-conical',
  commands: 'terminal',

  doc: 'file-text',
  'doc-overview': 'book-open',
  'doc-hld': 'network',
  'doc-lld': 'cpu',
  'doc-erd': 'database',
  'doc-decisions': 'scale',

  'type-report': 'clipboard-list',
  'type-feature': 'sparkles',
  'type-bug': 'bug',
  'type-idea': 'lightbulb',
  'type-plan': 'route',
  'type-research': 'flask-conical',
  'type-page': 'file-text',

  'meta-id': 'hash',
  'meta-branch': 'git-branch',
  'meta-date': 'calendar',
  'meta-agent': 'user',
  'meta-tag': 'tag',

  'callout-info': 'info',
  'callout-warn': 'alert-triangle',
  'callout-danger': 'alert-octagon',
  'callout-success': 'check-circle-2',

  'chrome-dark': 'moon',
  'chrome-light': 'sun',
  'chrome-menu': 'menu',
  'chrome-sidebar': 'panel-left-close',
  'chrome-search': 'search',
  'chrome-next': 'arrow-right',
  'chrome-open': 'external-link',
} as const;

export type IconName = keyof typeof ICON_NAMES;

export const ICON_KEYS = Object.keys(ICON_NAMES) as IconName[];

function pascalCase(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// Attribute values here are static package data plus caller-supplied labels; the
// text escape lives in common.ts, which imports this module, so quoting is local.
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeAttributes(attributes: IconAttributes): string {
  return Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
    .join('');
}

function serializeNode(node: IconNode): string {
  const [tag, attributes, children] = node;
  const inner = (children ?? []).map(serializeNode).join('');
  return inner === ''
    ? `<${tag}${serializeAttributes(attributes)} />`
    : `<${tag}${serializeAttributes(attributes)}>${inner}</${tag}>`;
}

export type IconOptions = {
  /** Extra classes, typically one of Vision's `.ic-*` semantic color classes. */
  class?: string;
  /** Set only when the icon carries meaning no adjacent text already carries. */
  label?: string;
};

/**
 * Renders one icon as inline SVG. An unknown name throws so a typo fails the
 * build rather than silently emitting a page with a missing glyph.
 */
export function icon(name: IconName, options: IconOptions = {}): string {
  const lucideName = ICON_NAMES[name];
  if (!lucideName) {
    throw new Error(`Unknown iris icon '${String(name)}'`);
  }

  // Lucide's own node type carries SVGProps; the serialiser only needs tag,
  // attributes, and children, so the shape is narrowed here.
  const node = (lucideIcons as unknown as Record<string, IconNode | undefined>)[
    pascalCase(lucideName)
  ];
  if (!node) {
    throw new Error(`Lucide icon '${lucideName}' is not present in the installed package`);
  }

  const [, rootAttributes, children] = node;
  const classes = ['lucide', `lucide-${lucideName}`, options.class]
    .filter((value): value is string => Boolean(value))
    .join(' ');
  const accessibility = options.label
    ? ` role="img" aria-label="${escapeAttribute(options.label)}"`
    : ' aria-hidden="true"';

  const inner = (children ?? []).map(serializeNode).join('');
  return `<svg${serializeAttributes(rootAttributes)} class="${classes}" focusable="false"${accessibility}>${inner}</svg>`;
}

/** The typed icon for a work record type, falling back to the generic page icon. */
export function typeIcon(type: string, options: IconOptions = {}): string {
  const key = `type-${type}` as IconName;
  return icon(key in ICON_NAMES ? key : 'type-page', options);
}
