import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';

export type Opener = (command: string, args: string[]) => Promise<void>;

const defaultOpener: Opener = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore', detached: true });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });

function openerFor(platform: NodeJS.Platform, target: string): [string, string[]] {
  if (platform === 'darwin') return ['open', [target]];
  // 'start' is a cmd built-in; the empty string fills its window-title slot so
  // the target path is never mistaken for a title.
  if (platform === 'win32') return ['cmd', ['/c', 'start', '', target]];
  return ['xdg-open', [target]];
}

export async function runOpenCommand(cwd: string, opener: Opener = defaultOpener): Promise<void> {
  const dashboardPath = path.join(cwd, 'iris', 'index.html');
  if (!existsSync(dashboardPath)) {
    throw new IrisError(1, "iris/index.html not found; run 'iris init' first");
  }

  const [command, args] = openerFor(process.platform, dashboardPath);
  try {
    await opener(command, args);
  } catch (error) {
    throw new IrisError(2, `Cannot open dashboard in a browser: ${(error as Error).message}`);
  }

  process.stdout.write(`opened ${path.relative(cwd, dashboardPath)}\n`);
}
