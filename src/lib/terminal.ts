import { execFileSync } from 'node:child_process';
import checkbox from '@inquirer/checkbox';
import pc from 'picocolors';

/** Env var that disables all Iris motion, independent of the OS preference. */
export const IRIS_NO_ANIMATION = 'IRIS_NO_ANIMATION';

export type TtyStream = {
  isTTY?: boolean;
};

export type TerminalEnv = {
  env?: NodeJS.ProcessEnv;
  stream?: TtyStream;
};

export type MotionEnv = {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  /** Injectable for tests; defaults to a guarded `execFileSync` with a short timeout. */
  exec?: (file: string, args: string[]) => string;
};

function envFlag(value: string | undefined): boolean {
  return value !== undefined && value !== '';
}

export function colorSupported(options: TerminalEnv = {}): boolean {
  const env = options.env ?? process.env;
  const stream = options.stream ?? process.stdout;
  if (envFlag(env.NO_COLOR)) return false;
  if (envFlag(env.CI)) return false;
  if (envFlag(env.FORCE_COLOR) && env.FORCE_COLOR !== '0') return true;
  if (!stream.isTTY) return false;
  return env.TERM !== 'dumb';
}

export function isInteractive(options: TerminalEnv = {}): boolean {
  const env = options.env ?? process.env;
  const stream = options.stream ?? process.stdout;
  return Boolean(stream.isTTY) && !envFlag(env.CI);
}

export type Palette = {
  /** When false every formatter below is the identity function (static fallback). */
  enabled: boolean;
  /** The single Iris accent hue, used for card borders and titles. */
  accent: (text: string) => string;
  accentBold: (text: string) => string;
  dim: (text: string) => string;
  success: (text: string) => string;
  warning: (text: string) => string;
  error: (text: string) => string;
};

export function createPalette(options: TerminalEnv = {}): Palette {
  const enabled = colorSupported(options);
  const colors = pc.createColors(enabled);
  return {
    enabled,
    accent: colors.cyan,
    accentBold: (text) => colors.bold(colors.cyan(text)),
    dim: colors.dim,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
  };
}

const MACOS_REDUCE_MOTION_TIMEOUT_MS = 250;

function defaultExec(file: string, args: string[]): string {
  return execFileSync(file, args, {
    encoding: 'utf8',
    timeout: MACOS_REDUCE_MOTION_TIMEOUT_MS,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

export function reducedMotionPreferred(options: MotionEnv = {}): boolean {
  const env = options.env ?? process.env;
  if (envFlag(env[IRIS_NO_ANIMATION])) return true;
  const platform = options.platform ?? process.platform;
  if (platform !== 'darwin') return false;
  try {
    const output = (options.exec ?? defaultExec)('defaults', [
      'read',
      'com.apple.universalaccess',
      'reduceMotion',
    ]);
    return output.trim() === '1';
  } catch {
    return false;
  }
}

export function motionAllowed(options: MotionEnv = {}): boolean {
  const env = options.env ?? process.env;
  if (envFlag(env.CI)) return false;
  return !reducedMotionPreferred(options);
}

const ANSI_PATTERN = /\u001B\[[0-9;]*m/g;

function visibleLength(text: string): number {
  return text.replace(ANSI_PATTERN, '').length;
}

export type BoxOptions = {
  palette?: Palette;
  title?: string;
  /** Horizontal padding in spaces on each side of the content. */
  padding?: number;
};

export function box(lines: string | string[], options: BoxOptions = {}): string {
  const palette = options.palette ?? createPalette();
  const padding = options.padding ?? 1;
  const body = Array.isArray(lines) ? lines : [lines];
  const content = options.title ? [palette.accentBold(options.title), ...body] : body;
  const width = Math.max(0, ...content.map(visibleLength));
  const pad = ' '.repeat(padding);
  const border = palette.accent;
  const top = border(`╭${'─'.repeat(width + padding * 2)}╮`);
  const bottom = border(`╰${'─'.repeat(width + padding * 2)}╯`);
  const rows = content.map((line) => {
    const fill = ' '.repeat(width - visibleLength(line));
    return `${border('│')}${pad}${line}${fill}${pad}${border('│')}`;
  });
  return [top, ...rows, bottom].join('\n');
}

export type MultiSelectChoice = {
  value: string;
  /** List label; defaults to the value. */
  name?: string;
  description?: string;
  checked?: boolean;
};

export type MultiSelectOptions = {
  message: string;
  choices: MultiSelectChoice[];
  /** When true, Enter on an empty selection keeps prompting instead of returning []. */
  required?: boolean;
};

/**
 * Arrow keys move, Space toggles, `a` toggles all, Enter confirms.
 * Callers must gate on `isInteractive()`; non-TTY and CI runs never prompt.
 */
export async function multiSelect(options: MultiSelectOptions): Promise<string[]> {
  return checkbox({
    message: options.message,
    required: options.required ?? false,
    choices: options.choices.map((choice) => ({
      value: choice.value,
      name: choice.name ?? choice.value,
      description: choice.description,
      checked: choice.checked ?? false,
    })),
  });
}
