import checkbox from '@inquirer/checkbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  box,
  colorSupported,
  createPalette,
  IRIS_NO_ANIMATION,
  isInteractive,
  motionAllowed,
  multiSelect,
  reducedMotionPreferred,
} from '../src/lib/terminal.js';

vi.mock('@inquirer/checkbox', () => ({ default: vi.fn() }));

const checkboxMock = vi.mocked(checkbox);

const ANSI_PATTERN = /\u001B\[[0-9;]*m/g;

function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('colorSupported', () => {
  const tty = { isTTY: true };

  it('enables color on a TTY with a clean env', () => {
    expect(colorSupported({ env: {}, stream: tty })).toBe(true);
  });

  it('disables color when NO_COLOR is set to any non-empty value', () => {
    expect(colorSupported({ env: { NO_COLOR: '1' }, stream: tty })).toBe(false);
    expect(colorSupported({ env: { NO_COLOR: '0' }, stream: tty })).toBe(false);
  });

  it('ignores an empty NO_COLOR value', () => {
    expect(colorSupported({ env: { NO_COLOR: '' }, stream: tty })).toBe(true);
  });

  it('disables color in CI even on a TTY', () => {
    expect(colorSupported({ env: { CI: 'true' }, stream: tty })).toBe(false);
  });

  it('disables color without a TTY', () => {
    expect(colorSupported({ env: {}, stream: { isTTY: false } })).toBe(false);
  });

  it('disables color for a dumb terminal', () => {
    expect(colorSupported({ env: { TERM: 'dumb' }, stream: tty })).toBe(false);
  });

  it('honors FORCE_COLOR without a TTY unless NO_COLOR wins', () => {
    expect(colorSupported({ env: { FORCE_COLOR: '1' }, stream: { isTTY: false } })).toBe(true);
    expect(colorSupported({ env: { FORCE_COLOR: '0' }, stream: { isTTY: false } })).toBe(false);
    expect(
      colorSupported({ env: { FORCE_COLOR: '1', NO_COLOR: '1' }, stream: { isTTY: false } }),
    ).toBe(false);
  });
});

describe('isInteractive', () => {
  it('requires a TTY and a non-CI environment', () => {
    expect(isInteractive({ env: {}, stream: { isTTY: true } })).toBe(true);
    expect(isInteractive({ env: { CI: '1' }, stream: { isTTY: true } })).toBe(false);
    expect(isInteractive({ env: {}, stream: { isTTY: false } })).toBe(false);
  });
});

describe('createPalette', () => {
  it('returns identity formatters when color is disabled', () => {
    const palette = createPalette({ env: { NO_COLOR: '1' }, stream: { isTTY: true } });
    expect(palette.enabled).toBe(false);
    expect(palette.accent('hello')).toBe('hello');
    expect(palette.accentBold('hello')).toBe('hello');
    expect(palette.error('hello')).toBe('hello');
  });

  it('wraps text in ANSI codes when color is enabled', () => {
    const palette = createPalette({ env: {}, stream: { isTTY: true } });
    expect(palette.enabled).toBe(true);
    expect(palette.accent('hello')).toContain('\u001B[');
    expect(stripAnsi(palette.accentBold('hello'))).toBe('hello');
  });
});

describe('reducedMotionPreferred', () => {
  it('honors the Iris no-animation env var without touching the OS', () => {
    const exec = vi.fn(() => '1\n');
    expect(
      reducedMotionPreferred({ env: { [IRIS_NO_ANIMATION]: '1' }, platform: 'darwin', exec }),
    ).toBe(true);
    expect(exec).not.toHaveBeenCalled();
  });

  it('reads the macOS reduce-motion preference', () => {
    expect(reducedMotionPreferred({ env: {}, platform: 'darwin', exec: () => '1\n' })).toBe(true);
    expect(reducedMotionPreferred({ env: {}, platform: 'darwin', exec: () => '0\n' })).toBe(false);
  });

  it('treats any read failure as no preference', () => {
    const exec = () => {
      throw new Error('defaults: domain not found');
    };
    expect(reducedMotionPreferred({ env: {}, platform: 'darwin', exec })).toBe(false);
  });

  it('does not probe the OS on non-macOS platforms', () => {
    const exec = vi.fn(() => '1\n');
    expect(reducedMotionPreferred({ env: {}, platform: 'linux', exec })).toBe(false);
    expect(exec).not.toHaveBeenCalled();
  });
});

describe('motionAllowed', () => {
  it('is disabled in CI and by the Iris no-animation env var', () => {
    expect(motionAllowed({ env: { CI: 'true' }, platform: 'linux' })).toBe(false);
    expect(motionAllowed({ env: { [IRIS_NO_ANIMATION]: '1' }, platform: 'linux' })).toBe(false);
  });

  it('is allowed with a clean env and no OS preference', () => {
    expect(motionAllowed({ env: {}, platform: 'linux' })).toBe(true);
  });
});

describe('box', () => {
  const plain = createPalette({ env: { NO_COLOR: '1' } });
  const colored = createPalette({ env: {}, stream: { isTTY: true } });

  it('renders a bordered card with uniform line widths', () => {
    const output = box(['Welcome to Iris', 'Workspace ready'], { palette: plain });
    const lines = output.split('\n');
    expect(lines[0]).toMatch(/^╭─+╮$/);
    expect(lines.at(-1)).toMatch(/^╰─+╯$/);
    for (const line of lines.slice(1, -1)) {
      expect(line).toMatch(/^│.*│$/);
    }
    expect(new Set(lines.map((line) => line.length)).size).toBe(1);
    expect(lines[1]).toContain(' Welcome to Iris ');
    expect(lines[2]).toContain(' Workspace ready ');
  });

  it('renders a title as the first content line', () => {
    const output = box(['body'], { palette: plain, title: 'Done' });
    const lines = output.split('\n');
    expect(lines[1]).toContain('Done');
    expect(lines[2]).toContain('body');
  });

  it('accepts a single line and custom padding', () => {
    const output = box('hello', { palette: plain, padding: 3 });
    const lines = output.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('│   hello   │');
  });

  it('keeps the same visible shape when color is enabled', () => {
    const options = { title: 'Iris', padding: 2 };
    const plainOutput = box(['one', 'two'], { ...options, palette: plain });
    const coloredOutput = box(['one', 'two'], { ...options, palette: colored });
    expect(coloredOutput).toContain('\u001B[');
    expect(stripAnsi(coloredOutput)).toBe(plainOutput);
  });
});

describe('multiSelect', () => {
  it('maps choices onto the prompt library and returns selected values', async () => {
    checkboxMock.mockResolvedValue(['claude', 'cursor']);
    const selected = await multiSelect({
      message: 'Pick tools',
      choices: [
        { value: 'claude', checked: true },
        { value: 'cursor', name: 'Cursor', description: 'IDE' },
      ],
    });
    expect(selected).toEqual(['claude', 'cursor']);
    expect(checkboxMock).toHaveBeenCalledWith({
      message: 'Pick tools',
      required: false,
      choices: [
        { value: 'claude', name: 'claude', description: undefined, checked: true },
        { value: 'cursor', name: 'Cursor', description: 'IDE', checked: false },
      ],
    });
  });

  it('passes the required flag through', async () => {
    checkboxMock.mockResolvedValue([]);
    await multiSelect({ message: 'Pick tools', choices: [{ value: 'claude' }], required: true });
    expect(checkboxMock).toHaveBeenCalledWith(expect.objectContaining({ required: true }));
  });
});
