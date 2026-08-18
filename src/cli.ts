import { parseArgs } from 'node:util';
import { runInitCommand } from './commands/init.js';
import { runRenderCommand } from './commands/render.js';
import { IrisError } from './lib/errors.js';

const ALL_COMMANDS = [
  'init',
  'render',
  'report',
  'feature',
  'bug',
  'idea',
  'plan',
  'promote',
  'sync',
  'adopt',
  'archive',
  'export',
  'vendor',
  'open',
  'update',
] as const;

export const HELP_TEXT = `iris v0.1
Usage: iris <command> [options]

Commands:
${ALL_COMMANDS.map((command) => `  - ${command}`).join('\n')}
`;

export async function runCli(argv: string[], cwd = process.cwd()): Promise<number> {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      json: { type: 'boolean' },
    },
  });

  if (parsed.values.help || parsed.positionals.length === 0) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }

  const [command] = parsed.positionals;

  try {
    switch (command) {
      case 'init':
        await runInitCommand(cwd);
        return 0;
      case 'render':
        await runRenderCommand(cwd);
        return 0;
      case 'report':
      case 'feature':
      case 'bug':
      case 'idea':
      case 'plan':
      case 'promote':
      case 'sync':
      case 'adopt':
      case 'archive':
      case 'export':
      case 'vendor':
      case 'open':
      case 'update':
        process.stderr.write(`Command '${command}' is registered but not yet implemented in M0.\n`);
        return 1;
      default:
        throw new IrisError(1, `Unknown command: ${command}`);
    }
  } catch (error) {
    if (error instanceof IrisError) {
      process.stderr.write(`${error.message}\n`);
      return error.code;
    }

    process.stderr.write(`Unexpected error: ${(error as Error).message}\n`);
    return 2;
  }
}
